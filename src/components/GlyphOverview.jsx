import { useState, useEffect, useRef } from 'react'

const STORE_URL = 'https://store.poi.tf'

const COLLECTION_FIELDS = `
  name
  featureStyle {
    cssFamily
    name
    webfontSources { url format }
    glyphNames { characters features name }
    variableInstances { name coordinates { axis value } }
  }
  fontStyles { id name cssFamily }
  glyphGroups {
    name
    characterSets {
      features
      characters {
        __typename
        ... on CharacterString { string }
        ... on CharacterRange { first last }
      }
    }
  }
`

const QUERY_BY_SLUG = `
  query CharacterViewerSlugQuery($collectionSlug: String!) {
    viewer {
      slug(name: $collectionSlug) {
        fontCollection { ${COLLECTION_FIELDS} }
      }
    }
  }
`

const QUERY_BY_ID = `
  query CharacterViewerIdQuery($id: ID!) {
    node(id: $id) {
      ... on FontCollection { ${COLLECTION_FIELDS} }
    }
  }
`

// Match a character+features pair against the glyphNames cmap
function glyphExists(string, features, glyphNames) {
  return glyphNames.some(g => {
    if (g.characters !== string) return false
    const af = features ?? null
    const bf = g.features ?? null
    if (af === null && bf === null) return true
    if (af === null || bf === null) return false
    if (af.length !== bf.length) return false
    return af.every(f => bf.includes(f))
  })
}

function expandCharacters(characterSets, glyphNames) {
  return characterSets.flatMap(cs => {
    const expanded = cs.characters.flatMap(c => {
      if (c.__typename === 'CharacterString') return [c.string]
      const start = c.first.codePointAt(0)
      const end = c.last.codePointAt(0)
      return Array.from({ length: end - start + 1 }, (_, i) =>
        String.fromCodePoint(start + i)
      )
    })
    return expanded.filter(ch => glyphExists(ch, cs.features, glyphNames))
  })
}

function featureSettings(characterSets) {
  const features = characterSets.flatMap(cs => cs.features ?? [])
  return features.length ? features.map(f => `"${f}" 1`).join(', ') : 'normal'
}

export default function GlyphOverview({ collectionSlug, collectionId, fallbackWeights }) {
  const [collection, setCollection] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState([])
  const [selectedStyleIdx, setSelectedStyleIdx] = useState(0)
  const defaultStyleSet = useRef(false)

  useEffect(() => {
    const [query, variables] = collectionId
      ? [QUERY_BY_ID, { id: collectionId }]
      : [QUERY_BY_SLUG, { collectionSlug }]

    fetch(`${STORE_URL}/graphql?queryName=CharacterViewerSlugQuery`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
      .then(r => r.json())
      .then(json => {
        const col = collectionId
          ? (json.data?.node ?? null)
          : (json.data?.viewer?.slug?.fontCollection ?? null)
        setCollection(col)
        defaultStyleSet.current = false
      })
  }, [collectionSlug, collectionId])

  useEffect(() => {
    if (!collection || defaultStyleSet.current) return
    defaultStyleSet.current = true
    const apiInst = collection.featureStyle?.variableInstances ?? []
    const fs = collection.fontStyles ?? []
    const pills = apiInst.length ? apiInst : (!apiInst.length && !fs.length && fallbackWeights?.length)
      ? fallbackWeights.map(w => ({ name: w.name }))
      : fs.length > 1 ? fs : []
    const lightIdx = pills.findIndex(p => p.name === 'Light')
    if (lightIdx > 0) setSelectedStyleIdx(lightIdx)
  }, [collection, fallbackWeights])

  useEffect(() => {
    setSelected([])
  }, [collectionSlug, collectionId])


  if (!collection) return <div className="glyph-overview-loading" />

  const { name, featureStyle, fontStyles, glyphGroups: allGroups } = collection
  const glyphGroups = allGroups.filter(g => g.name !== 'Access All Alternates')
  const glyphNames = featureStyle.glyphNames ?? []

  // Variable font instances take priority over static fontStyles, then fallback weights
  const apiInstances = featureStyle.variableInstances ?? []
  const syntheticInstances = (!apiInstances.length && !fontStyles.length && fallbackWeights?.length)
    ? fallbackWeights.map(w => ({ name: w.name, coordinates: [{ axis: 'wght', value: w.weight }] }))
    : []
  const instances = apiInstances.length ? apiInstances : syntheticInstances
  const hasInstances = instances.length > 0
  const hasMultiStyle = fontStyles.length > 1

  const selectedInstance = hasInstances ? (instances[selectedStyleIdx] ?? instances[0]) : null
  const selectedStyle = hasMultiStyle ? (fontStyles[selectedStyleIdx] ?? fontStyles[0]) : null
  const fontFamily = selectedStyle?.cssFamily ?? featureStyle.cssFamily

  const fontVariationSettings = selectedInstance
    ? selectedInstance.coordinates.map(c => `"${c.axis}" ${c.value}`).join(', ')
    : 'normal'

  const firstChar = expandCharacters(glyphGroups[0]?.characterSets ?? [], glyphNames)
    .find(c => c.trim() !== '') ?? ''

  // Split the groups into two balanced, contiguous columns (mirroring CSS
  // multicol's column-major flow, which WebKit renders buggily — see CSS). A
  // group's column height ≈ (rows + 1) × cellHeight: `rows` grid rows of 6 cells
  // plus ~1 row's worth of header + inter-group margin. The split point is
  // chosen to minimise the height difference between the two columns.
  const groupColumns = (() => {
    const heights = glyphGroups.map(g =>
      Math.ceil(expandCharacters(g.characterSets, glyphNames).length / 6) + 1)
    const total = heights.reduce((a, b) => a + b, 0)
    let acc = 0, splitIdx = glyphGroups.length, bestDiff = Infinity
    for (let i = 1; i < glyphGroups.length; i++) {
      acc += heights[i - 1]
      const diff = Math.abs(2 * acc - total)
      if (diff < bestDiff) { bestDiff = diff; splitIdx = i }
    }
    return [glyphGroups.slice(0, splitIdx), glyphGroups.slice(splitIdx)]
  })()

  const previewStyle = { fontFamily, fontVariationSettings }
  const gridStyle = (fontFeatureSettings) => ({ fontFamily, fontVariationSettings, fontFeatureSettings })

  const activeEntry = hovered ?? selected[selected.length - 1] ?? null
  const activeChar = activeEntry?.char ?? firstChar
  const activeFeatures = activeEntry?.fontFeatureSettings ?? 'normal'

  const pills = hasInstances ? instances : hasMultiStyle ? fontStyles : []

  return (
    <div className="glyph-overview">
      <div className="glyph-overview__body">

        {/* ── Left: label (non-sticky) + sticky preview ───────── */}
        <div className="glyph-overview__preview-col">
          <div className="glyph-overview__group-name">Glyph Overview</div>
          <div className="glyph-overview__preview-sticky">
            <div className="glyph-overview__preview" style={previewStyle}>
              {selected.map((entry, i) => {
                const age = selected.length - 1 - i
                return (
                  <span
                    key={`selected-bg-${i}`}
                    className="glyph-overview__preview-char glyph-selected-bg"
                    style={{
                      fontFamily: entry.fontFamily,
                      fontVariationSettings: entry.fontVariationSettings,
                      fontFeatureSettings: entry.fontFeatureSettings,
                      opacity: Math.max(0, 1 - age * 0.04),
                      filter: `blur(${age + 1}px)`,
                    }}
                  >
                    {entry.char}
                  </span>
                )
              })}
              <span
                className="glyph-overview__preview-char"
                style={{ fontFeatureSettings: activeFeatures }}
              >
                {activeChar}
              </span>
            </div>
            {pills.length > 1 && (
              <div className="glyph-overview__style-pills">
                {pills.map((s, i) => (
                  <button
                    key={s.id ?? s.name}
                    className={`tt-style-pill${i === selectedStyleIdx ? ' active' : ''}`}
                    onClick={() => setSelectedStyleIdx(i)}
                    type="button"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: all categories, pre-split into two balanced columns ── */}
        {/* Two explicit flex columns instead of CSS multicol, which WebKit
            mis-renders here (see CSS). groupColumns is balanced in JS above. */}
        <div className="glyph-overview__groups">
          {groupColumns.map((col, ci) => (
            <div key={ci} className="glyph-overview__col">
              {col.map((group) => {
                const chars = expandCharacters(group.characterSets, glyphNames)
                const fontFeatureSettings = featureSettings(group.characterSets)

                return (
                  <div key={group.name} className="glyph-overview__group">
                    <div className="glyph-overview__group-name">{group.name}</div>
                    <div className="glyph-overview__grid" style={gridStyle(fontFeatureSettings)}>
                      {chars.map((char, i) => (
                        <div
                          key={i}
                          className={`glyph-overview__cell${selected[selected.length - 1]?.char === char ? ' selected' : ''}`}
                          onMouseEnter={() => setHovered({ char, fontFeatureSettings })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => setSelected(prev => [...prev, { char, fontFamily, fontVariationSettings, fontFeatureSettings }])}
                        >
                          <span>{char}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
