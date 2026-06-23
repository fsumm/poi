import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { makeOverlays } from '../overlayText.js'
import aeronaut001 from '../../img/aeronaut001.jpg'
import carbonic001 from '../../img/carbonic001.jpg'
import orbiter001 from '../../img/orbiter001.jpg'
import diode001 from '../../img/diode001.jpg'

const HERO_TEXT = 'Place of Interest'
const HERO_FAMILY = 'POI Orbiter'
const HERO_TRACKING = -0.0615 // -6.15% letter-spacing, expressed in em

// Fits HERO_TEXT to the exact width of the container, then nudges it so the
// ink (the glyph outlines, not the advance box) is flush with both content
// edges — the stem of the leading "P" and the terminal of the "t" land on the
// container edges. We measure the real ink bounds with Canvas TextMetrics
// (actualBoundingBox*), which include the font's side bearings.
function useFitHeadline() {
  const containerRef = useRef(null)
  const [fit, setFit] = useState(null) // { fontSize, marginLeft } in px

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const containerW = container.clientWidth
    if (!containerW) return

    const REF = 200 // reference size to measure at; result is scaled from here
    const canvas = (useFitHeadline._canvas ||= document.createElement('canvas'))
    const ctx = canvas.getContext('2d')
    ctx.font = `400 ${REF}px "${HERO_FAMILY}", sans-serif`
    // letterSpacing affects measureText in modern browsers; ignore if unsupported
    try { ctx.letterSpacing = `${HERO_TRACKING * REF}px` } catch { /* noop */ }

    const m = ctx.measureText(HERO_TEXT)
    const left = m.actualBoundingBoxLeft
    const right = m.actualBoundingBoxRight
    if (left == null || right == null) {
      // Fallback: advance-width fit with no bearing compensation
      const scale = containerW / (m.width || containerW)
      setFit({ fontSize: REF * scale, marginLeft: 0 })
      return
    }

    // Ink extents relative to the text origin (CSS pen position):
    //   left edge  = -actualBoundingBoxLeft   (left side bearing of "P")
    //   ink width  = actualBoundingBoxLeft + actualBoundingBoxRight
    const inkWidth = left + right
    const leftEdge = -left
    if (!inkWidth) return

    const scale = containerW / inkWidth
    setFit({ fontSize: REF * scale, marginLeft: -leftEdge * scale })
  }, [])

  // Refit once the variable font is ready (metrics differ from the fallback face)
  useEffect(() => {
    let cancelled = false
    measure()
    document.fonts?.ready.then(() => { if (!cancelled) measure() })
    return () => { cancelled = true }
  }, [measure])

  // Refit on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [measure])

  return [containerRef, fit]
}

function CatalogHero() {
  const [containerRef, fit] = useFitHeadline()
  return (
    <div className="catalog-hero" ref={containerRef} data-anim-pending={fit ? undefined : ''}>
      <h1
        className="catalog-hero-text"
        style={fit ? { fontSize: `${fit.fontSize}px`, marginLeft: `${fit.marginLeft}px` } : { fontSize: 0 }}
      >
        {HERO_TEXT}
      </h1>
    </div>
  )
}

export default function Catalog() {
  const [aeronaut, carbonic, orbiter, diode] = fonts

  // Generate the random glyphs + random style once per mount so they stay
  // stable across the re-renders the hero autofit triggers. Keyed by font id,
  // with a distinct letter per image (no repeats across the grid).
  const overlays = useMemo(() => makeOverlays(fonts), [])

  return (
    <div className="catalog-page">
      <CatalogHero />
      <div className="catalog-grid">
        {/* Placement lives in CSS (.catalog-grid > nth-child) so the
            responsive breakpoints can remap each card. */}
        <Link to="/catalog/aeronaut" className="catalog-card">
          <div className="catalog-card-img landscape" style={{ backgroundImage: `url(${aeronaut001})` }}>
            <span className="catalog-card-text" style={overlays.aeronaut.style}>{overlays.aeronaut.text}</span>
          </div>
          <div className="catalog-card-name">{aeronaut.displayName}</div>
        </Link>

        <Link to="/catalog/carbonic" className="catalog-card">
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${carbonic001})` }}>
            <span className="catalog-card-text" style={overlays.carbonic.style}>{overlays.carbonic.text}</span>
          </div>
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        <Link to="/catalog/orbiter" className="catalog-card">
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${orbiter001})` }}>
            <span className="catalog-card-text" style={overlays.orbiter.style}>{overlays.orbiter.text}</span>
          </div>
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        <Link to="/catalog/diode" className="catalog-card">
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${diode001})` }}>
            <span className="catalog-card-text" style={overlays.diode.style}>{overlays.diode.text}</span>
          </div>
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
