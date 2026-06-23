// Random yellow glyph overlays for the font imagery. Each overlay is an
// uppercase letter paired with its lowercase form (e.g. "Aa"), set in a random
// style of the linked font's family.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function styleFor(font) {
  const weight = font.weights[Math.floor(Math.random() * font.weights.length)]
  return {
    fontFamily: `"POI ${font.name}", sans-serif`,
    fontWeight: weight.weight,
    fontStyle: weight.style,
  }
}

function fromLetter(font, letter) {
  return { text: letter + letter.toLowerCase(), style: styleFor(font) }
}

// Builds an overlay per font keyed by font id, guaranteeing every image gets a
// distinct letter (no repeats across the set).
export function makeOverlays(fontList) {
  const pool = ALPHABET.split('')
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const result = {}
  fontList.forEach((font, i) => { result[font.id] = fromLetter(font, pool[i]) })
  return result
}

// A single overlay with a random letter (e.g. a font detail page's one image).
export function makeOverlay(font) {
  return fromLetter(font, ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
}
