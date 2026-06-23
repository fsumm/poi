import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react'

// Fits `text` to the exact width of its container, then nudges it so the ink
// (the glyph outlines, not the advance box) is flush with both container edges
// — measured with Canvas TextMetrics (actualBoundingBox*), which include the
// font's side bearings. Also sets `--baseline-shift`: the distance from the
// alphabetic baseline to the bottom of a line-height:1 line box at the fitted
// size, so callers can sit the baseline on a target line.
//
// The fitted size is written *imperatively* to the text element so it tracks
// the container in the same frame as a resize (going through React state would
// trail layout by a render and read as a laggy/delayed resize).
//
// Returns [containerRef, textRef, ready] — attach containerRef to the element
// whose width is measured and textRef to the text element to be sized; `ready`
// is false until the first measurement lands (for gating the enter animation).
export function useFitText({ text, family, tracking = 0, weight = 400 }) {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [ready, setReady] = useState(false)

  const measure = useCallback(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return
    const containerW = container.clientWidth
    if (!containerW) return

    const REF = 200 // reference size to measure at; result is scaled from here
    const canvas = (useFitText._canvas ||= document.createElement('canvas'))
    const ctx = canvas.getContext('2d')
    ctx.font = `${weight} ${REF}px "${family}", sans-serif`
    // letterSpacing affects measureText in modern browsers; ignore if unsupported
    try { ctx.letterSpacing = `${tracking * REF}px` } catch { /* noop */ }

    const m = ctx.measureText(text)
    const left = m.actualBoundingBoxLeft
    const right = m.actualBoundingBoxRight

    let fontSize, marginLeft, baselineToBottom
    if (left == null || right == null) {
      // Fallback: advance-width fit with no bearing/baseline compensation
      fontSize = REF * (containerW / (m.width || containerW))
      marginLeft = 0
      baselineToBottom = 0
    } else {
      // Ink extents relative to the text origin (CSS pen position):
      //   left edge = -actualBoundingBoxLeft (left side bearing of first glyph)
      //   ink width = actualBoundingBoxLeft + actualBoundingBoxRight
      const inkWidth = left + right
      if (!inkWidth) return
      const scale = containerW / inkWidth
      fontSize = REF * scale
      marginLeft = -(-left) * scale
      // With line-height:1 the line box equals the font size; the alphabetic
      // baseline sits half-leading + ascent from the top, leaving this gap below
      const asc = m.fontBoundingBoxAscent * scale
      const desc = m.fontBoundingBoxDescent * scale
      baselineToBottom = (fontSize - (asc + desc)) / 2 + desc
    }

    textEl.style.fontSize = `${fontSize}px`
    textEl.style.marginLeft = `${marginLeft}px`
    textEl.style.setProperty('--baseline-shift', `${baselineToBottom}px`)
    if (!ready) setReady(true)
  }, [text, family, tracking, weight, ready])

  // First fit before paint (avoids a flash of unsized text)
  useLayoutEffect(() => { measure() }, [measure])

  // Refit once the (variable) font is ready — its metrics differ from the fallback
  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => { if (!cancelled) measure() })
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
