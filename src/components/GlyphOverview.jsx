import { useState, useEffect } from 'react'

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

export default function GlyphOverview({ collectionSlug, collectionId }) {
  const [collection, setCollection] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [selectedStyleIdx, setSelectedStyleIdx] = useState(0)

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
      })
  }, [collectionSlug, collectionId])

  if (!collection) return <div className="glyph-overview-loading" />

  const { name, featureStyle, fontStyles, glyphGroups: allGroups } = collection
  const glyphGroups = allGroups.filter(g => g.name !== 'Access All Alternates')
  const glyphNames = featureStyle.glyphNames ?? []

  // Variable font instances take priority over static fontStyles
  const instances = featureStyle.variableInstances ?? []
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

  const previewStyle = { fontFamily, fontVariationSettings }
  const gridStyle = (fontFeatureSettings) => ({ fontFamily, fontVariationSettings, fontFeatureSettings })

  const pills = hasInstances ? instances : hasMultiStyle ? fontStyles : []

  return (
    <div className="glyph-overview">
      <div className="glyph-overview__body">

        {/* ── Left: label (non-sticky) + sticky preview ───────── */}
        <div className="glyph-overview__preview-col">
          <div className="page-section-label">Glyph Overview</div>
          <div className="glyph-overview__preview-sticky">
            <div className="glyph-overview__preview" style={previewStyle}>
              <span className="glyph-overview__preview-char">{hovered ?? selected ?? firstChar}</span>
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

        {/* ── Right: all categories stacked ───────────────────── */}
        <div className="glyph-overview__groups">
          {glyphGroups.map((group, idx) => {
            const chars = expandCharacters(group.characterSets, glyphNames)
            const fontFeatureSettings = featureSettings(group.characterSets)

            // Pair groups (left=even, right=odd); pad both to the taller pair's row count
            const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1
            const pairGroup = glyphGroups[pairIdx]
            const pairChars = pairGroup ? expandCharacters(pairGroup.characterSets, glyphNames) : []
            const myRows = Math.ceil(chars.length / 6)
            const pairRows = Math.ceil(pairChars.length / 6)
            const maxRows = Math.max(myRows, pairRows)
            const fillerCount = maxRows * 6 - chars.length

            return (
              <div key={group.name} className="glyph-overview__group">
                <div className="glyph-overview__group-name">{group.name}</div>
                <div className="glyph-overview__grid" style={gridStyle(fontFeatureSettings)}>
                  {chars.map((char, i) => (
                    <div
                      key={i}
                      className={`glyph-overview__cell${selected === char ? ' selected' : ''}`}
                      onMouseEnter={() => setHovered(char)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => setSelected(prev => prev === char ? null : char)}
                    >
                      {char}
                    </div>
                  ))}
                  {Array.from({ length: fillerCount }).map((_, i) => (
                    <div key={`filler-${i}`} className="glyph-overview__cell-filler" />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
