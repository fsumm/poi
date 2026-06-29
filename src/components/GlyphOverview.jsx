import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useTilt } from '../useTilt.js'

const STORE_URL = 'https://store.poi.tf'

// A single glyph grid cell. Adds the cursor-following perspective tilt (rotation
// only — `scale: 1` leaves the existing hover scale-down on the inner span
// untouched) on top of the hover/select behaviour.
//
// The tilt rides on an inner `__cell-tilt` wrapper, NOT the cell itself, and
// that wrapper is `pointer-events: none`. The cell stays flat so its hit-test
// box keeps tiling perfectly with its neighbours — transforming the cell would
// rotate its pointer region too and break the seamless cell-to-cell hover. The
// span (which CSS scales on hover) nests inside the wrapper, so tilt and scale
// live on different elements and never clash.
//
// memo()'d so a hover (which calls setHovered for the live preview, re-rendering
// the whole overview) doesn't re-render all ~490 cells — that reconcile was
// occasionally dropping a frame mid tilt-animation. All props are referentially
// stable across hovers (the callbacks are useCallback'd in the parent), so memo
// skips every cell whose selected flag hasn't flipped.
const GlyphCell = memo(function GlyphCell({ char, fontFamily, fontVariationSettings, fontFeatureSettings, selected, onHover, onLeave, onSelect }) {
  const tilt = useTilt({ scale: 1, max: 30 })
  return (
    <div
      className={`glyph-overview__cell${selected ? ' selected' : ''}`}
      onMouseEnter={(e) => { onHover(char, fontFeatureSettings); tilt.onMouseEnter(e) }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={(e) => { onLeave(); tilt.onMouseLeave(e) }}
      onClick={() => onSelect({ char, fontFamily, fontVariationSettings, fontFeatureSettings })}
    >
      <div ref={tilt.ref} className="glyph-overview__cell-tilt">
        <span>{char}</span>
      </div>
    </div>
  )
})

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

  // Expanding every group's glyph set (and the balanced two-column split) is the
  // costly part of a render: it runs glyphExists() over the whole cmap for
  // hundreds of characters. It depends only on `collection`, so memoize it —
  // otherwise every hover (which calls setHovered to drive the live preview)
  // re-runs it and can drop a frame mid tilt-animation (see GlyphCell).
  const glyphData = useMemo(() => {
    if (!collection) return null
    const glyphNames = collection.featureStyle.glyphNames ?? []
    const groups = collection.glyphGroups
      .filter(g => g.name !== 'Access All Alternates')
      .map(g => ({
        name: g.name,
        chars: expandCharacters(g.characterSets, glyphNames),
        fontFeatureSettings: featureSettings(g.characterSets),
      }))

    // Balanced, contiguous two-column split (mirrors CSS multicol's column-major
    // flow, which WebKit renders buggily — see CSS). A group's column height ≈
    // (rows + 1) × cellHeight: `rows` grid rows of 6 cells plus ~1 row's worth of
    // header + inter-group margin. Pick the split minimising the height diff.
    const heights = groups.map(g => Math.ceil(g.chars.length / 6) + 1)
    const total = heights.reduce((a, b) => a + b, 0)
    let acc = 0, splitIdx = groups.length, bestDiff = Infinity
    for (let i = 1; i < groups.length; i++) {
      acc += heights[i - 1]
      const diff = Math.abs(2 * acc - total)
      if (diff < bestDiff) { bestDiff = diff; splitIdx = i }
    }
    const groupColumns = [groups.slice(0, splitIdx), groups.slice(splitIdx)]
    const firstChar = groups[0]?.chars.find(c => c.trim() !== '') ?? ''
    return { groupColumns, firstChar }
  }, [collection])

  // Stable handlers so the memo'd cells don't see new props on every hover.
  const handleHover = useCallback((char, fontFeatureSettings) => setHovered({ char, fontFeatureSettings }), [])
  const handleLeave = useCallback(() => setHovered(null), [])
  const handleSelect = useCallback((entry) => setSelected(prev => [...prev, entry]), [])

  if (!collection) return <div className="glyph-overview-loading" />

  const { featureStyle, fontStyles } = collection

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

  const previewStyle = { fontFamily, fontVariationSettings }
  const gridStyle = (fontFeatureSettings) => ({ fontFamily, fontVariationSettings, fontFeatureSettings })

  const activeEntry = hovered ?? selected[selected.length - 1] ?? null
  const activeChar = activeEntry?.char ?? glyphData.firstChar
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
          {glyphData.groupColumns.map((col, ci) => (
            <div key={ci} className="glyph-overview__col">
              {col.map((group) => {
                const { chars, fontFeatureSettings } = group

                return (
                  <div key={group.name} className="glyph-overview__group">
                    <div className="glyph-overview__group-name">{group.name}</div>
                    <div className="glyph-overview__grid" style={gridStyle(fontFeatureSettings)}>
                      {chars.map((char, i) => (
                        <GlyphCell
                          key={i}
                          char={char}
                          fontFamily={fontFamily}
                          fontVariationSettings={fontVariationSettings}
                          fontFeatureSettings={fontFeatureSettings}
                          selected={selected[selected.length - 1]?.char === char}
                          onHover={handleHover}
                          onLeave={handleLeave}
                          onSelect={handleSelect}
                        />
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
