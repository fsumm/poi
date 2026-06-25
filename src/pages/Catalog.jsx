import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { makeOverlays } from '../overlayText.js'
import { useFitText } from '../useFitText.js'
import FrameImage from '../components/FrameImage.jsx'

// Rendered width per responsive tier (see index.css breakpoints):
//   ≤580px  → full width (single column)
//   ≤1140px → 8-col grid: 4-col cells ≈ 50vw-30, 2-col cells ≈ 25vw-25
//   >1140px → 12-col grid: 4-col cells ≈ 540px, 2-col cells ≈ 260px
// Aeronaut + Diode span 4 cols (wide); Carbonic + Orbiter span 2 cols (narrow).
const WIDE_SIZES = '(max-width: 580px) calc(100vw - 40px), (max-width: 1140px) calc(50vw - 30px), 540px'
const NARROW_SIZES = '(max-width: 580px) calc(100vw - 40px), (max-width: 1140px) calc(25vw - 25px), 260px'

const HERO_TEXT = 'Place of Interest'
const HERO_FAMILY = 'POI Orbiter'
const HERO_TRACKING = -0.0615 // -6.15% letter-spacing, expressed in em

function CatalogHero() {
  const [containerRef, textRef, ready] = useFitText({ text: HERO_TEXT, family: HERO_FAMILY, tracking: HERO_TRACKING })
  return (
    <div className="catalog-hero" ref={containerRef} data-anim-pending={ready ? undefined : ''}>
      <h1
        className="catalog-hero-text"
        ref={textRef}
        style={{ visibility: ready ? undefined : 'hidden' }}
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
          <FrameImage file="aeronaut001.jpg" className="catalog-card-img landscape" sizes={WIDE_SIZES} eager>
            <span className="catalog-card-text" style={overlays.aeronaut.style}>{overlays.aeronaut.text}</span>
          </FrameImage>
          <div className="catalog-card-name">{aeronaut.displayName}</div>
        </Link>

        <Link to="/catalog/carbonic" className="catalog-card">
          <FrameImage file="carbonic001.jpg" className="catalog-card-img portrait" sizes={NARROW_SIZES} eager>
            <span className="catalog-card-text" style={overlays.carbonic.style}>{overlays.carbonic.text}</span>
          </FrameImage>
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        <Link to="/catalog/orbiter" className="catalog-card">
          <FrameImage file="orbiter001.jpg" className="catalog-card-img portrait" sizes={NARROW_SIZES}>
            <span className="catalog-card-text" style={overlays.orbiter.style}>{overlays.orbiter.text}</span>
          </FrameImage>
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        <Link to="/catalog/diode" className="catalog-card">
          <FrameImage file="diode001.jpg" className="catalog-card-img portrait" sizes={WIDE_SIZES}>
            <span className="catalog-card-text" style={overlays.diode.style}>{overlays.diode.text}</span>
          </FrameImage>
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
