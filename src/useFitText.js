import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react'

// Measures the ink geometry of `text` at a reference font size by rasterizing it
// to an offscreen canvas and scanning pixels for the true left/right ink edges.
//
// We deliberately do NOT use Canvas TextMetrics.actualBoundingBox{Left,Right}:
// WebKit/Safari clamps actualBoundingBoxLeft to 0 when a glyph's ink sits
// entirely to the right of the pen origin (e.g. the "P" in "Place"), even though
// its rasterizer draws the glyph at the correct, non-zero side bearing. That
// makes the metric disagree with what Safari actually paints in the DOM and
// opens a gap on the left edge. The pixel raster, by contrast, is the same in
// every engine — so we read the edges straight from it.
//
// Returns { left, right, inkWidth, asc, desc } in REF pixels (or null if the
// canvas isn't available). `left`/`right` mirror the actualBoundingBox sign
// convention: left is positive to the LEFT of the origin, right positive to the
// right, so inkWidth = left + right.
function measureInk({ text, family, tracking, weight, REF }) {
  const canvas = (measureInk._canvas ||= document.createElement('canvas'))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const setFont = () => {
    ctx.font = `${weight} ${REF}px "${family}", sans-serif`
    // letterSpacing affects the advance width in modern browsers; ignore if unsupported
    try { ctx.letterSpacing = `${tracking * REF}px` } catch { /* noop */ }
  }
  setFont()

  const m = ctx.measureText(text)
  const asc = m.fontBoundingBoxAscent
  const desc = m.fontBoundingBoxDescent

  // Lay out the raster with generous padding so even large side bearings or a
  // first glyph that overhangs left of the origin stay inside the bitmap.
  const PAD = Math.ceil(REF * 0.5)
  const penX = PAD
  const baselineY = PAD + Math.ceil(asc)
  canvas.width = Math.ceil(m.width) + PAD * 2
  canvas.height = Math.ceil(asc + desc) + PAD * 2

  setFont() // resizing the canvas resets the context state
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#000'
  ctx.fillText(text, penX, baselineY)

  const W = canvas.width
  const { data } = ctx.getImageData(0, 0, W, canvas.height)
  const inked = (x) => {
    for (let y = 0; y < canvas.height; y++) {
      if (data[(y * W + x) * 4 + 3] > 10) return true
    }
    return false
  }
  let inkLeftX = -1
  for (let x = 0; x < W; x++) { if (inked(x)) { inkLeftX = x; break } }
  let inkRightX = -1
  for (let x = W - 1; x >= 0; x--) { if (inked(x)) { inkRightX = x; break } }

  if (inkLeftX < 0 || inkRightX < inkLeftX) {
    // No ink found (empty text / load race): advance-width fit, no bearing comp
    return { left: 0, right: m.width, inkWidth: m.width || REF, asc, desc }
  }

  const left = penX - inkLeftX
  const right = inkRightX - penX
  return { left, right, inkWidth: inkRightX - inkLeftX, asc, desc }
}

// Fits `text` to the exact width of its container, then nudges it so the ink
// (the glyph outlines, not the advance box) is flush with both container edges.
// Also sets `--baseline-shift`: the distance from the alphabetic baseline to the
// bottom of a line-height:1 line box at the fitted size, so callers can sit the
// baseline on a target line.
//
// The fitted size is written *imperatively* to the text element so it tracks the
// container in the same frame as a resize (going through React state would trail
// layout by a render and read as a laggy/delayed resize).
//
// Returns [containerRef, textRef, ready] — attach containerRef to the element
// whose width is measured and textRef to the text element to be sized; `ready`
// is false until the first measurement lands (for gating the enter animation).
export function useFitText({ text, family, tracking = 0, weight = 400 }) {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [ready, setReady] = useState(false)
  // Ink geometry depends only on the font + text, not the container width, so we
  // scan once and cache. Resize then only recomputes the (cheap) scale math.
  const inkRef = useRef({ key: null, ink: null })

  const REF = 200 // reference size to measure at; result is scaled from here
  const inkKey = `${weight}|${family}|${tracking}|${text}`

  const measure = useCallback(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return
    const containerW = container.clientWidth
    if (!containerW) return

    let ink = inkRef.current.key === inkKey ? inkRef.current.ink : null
    if (!ink) {
      ink = measureInk({ text, family, tracking, weight, REF })
      if (!ink) return
      inkRef.current = { key: inkKey, ink }
    }

    const { left, inkWidth, asc, desc } = ink
    if (!inkWidth) return
    const scale = containerW / inkWidth
    const fontSize = REF * scale
    // Push the leftmost ink (origin - left) flush to the container's left edge
    const marginLeft = left * scale
    // With line-height:1 the line box equals the font size; the alphabetic
    // baseline sits half-leading + ascent from the top, leaving this gap below
    const baselineToBottom = (fontSize - (asc + desc) * scale) / 2 + desc * scale

    textEl.style.fontSize = `${fontSize}px`
    textEl.style.marginLeft = `${marginLeft}px`
    textEl.style.setProperty('--baseline-shift', `${baselineToBottom}px`)
    if (!ready) setReady(true)
  }, [inkKey, text, family, tracking, weight, ready])

  // First fit before paint (avoids a flash of unsized text)
  useLayoutEffect(() => { measure() }, [measure])

  // Refit once the (variable) font is ready — its metrics differ from the
  // fallback, so bust the cached ink geometry and re-scan.
  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (cancelled) return
      inkRef.current = { key: null, ink: null }
      measure()
    })
    return () => { cancelled = true }
  }, [measure])

  // Refit on container resize — imperative write inside the callback keeps the
  // text locked to the container width with no render-cycle delay.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [measure])

  return [containerRef, textRef, ready]
}
