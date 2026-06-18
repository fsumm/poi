import { useState, useEffect } from 'react'

const STORE_URL = 'https://store.poi.tf'

const QUERY = `
  query CharacterViewerSlugQuery($collectionSlug: String!) {
    viewer {
      slug(name: $collectionSlug) {
        fontCollection {
          name
          featureStyle {
            cssFamily
            name
            webfontSources { url format }
            glyphNames { characters features name }
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
        }
      }
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

export default function GlyphOverview({ collectionSlug }) {
  const [collection, setCollection] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [selectedStyleIdx, setSelectedStyleIdx] = useState(0)

  useEffect(() => {
    fetch(`${STORE_URL}/graphql?queryName=CharacterViewerSlugQuery`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { collectionSlug } }),
    })
      .then(r => r.json())
      .then(json => setCollection(json.data?.viewer?.slug?.fontCollection ?? null))
  }, [collectionSlug])

  if (!collection) return <div className="glyph-overview-loading" />

  const { name, featureStyle, fontStyles, glyphGroups } = collection
  const glyphNames = featureStyle.glyphNames ?? []
  const selectedStyle = fontStyles[selectedStyleIdx] ?? fontStyles[0]
  const fontFamily = selectedStyle?.cssFamily ?? featureStyle.cssFamily
  const firstChar = expandCharacters(glyphGroups[0]?.characterSets ?? [], glyphNames)
    .find(c => c.trim() !== '') ?? ''

  return (
    <div className="glyph-overview">
      <div className="glyph-overview__body">

        {/* ── Left: sticky preview ─────────────────────────────── */}
        <div className="glyph-overview__preview-col">
          <div className="page-section-label">Glyph Overview</div>
          <div className="glyph-overview__preview" style={{ fontFamily }}>
            {hovered ?? firstChar}
          </div>
          <button
            className="glyph-overview__style-selector"
            onClick={() => fontStyles.length > 1 && setSelectedStyleIdx(i => (i + 1) % fontStyles.length)}
            disabled={fontStyles.length <= 1}
          >
            {name} {selectedStyle?.name ?? 'Regular'}
          </button>
        </div>

        {/* ── Right: all categories stacked ───────────────────── */}
        <div className="glyph-overview__groups">
          {glyphGroups.map(group => {
            const chars = expandCharacters(group.characterSets, glyphNames)
            const fontFeatureSettings = featureSettings(group.characterSets)
            return (
              <div key={group.name} className="glyph-overview__group">
                <div className="glyph-overview__group-name">{group.name}</div>
                <div className="glyph-overview__grid" style={{ fontFamily, fontFeatureSettings }}>
                  {chars.map((char, i) => (
                    <div
                      key={i}
                      className="glyph-overview__cell"
                      onMouseEnter={() => setHovered(char)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {char}
                    </div>
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
