import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { makeOverlays } from '../overlayText.js'
import { useFitText } from '../useFitText.js'
import aeronaut001 from '../../img/aeronaut001.jpg'
import carbonic001 from '../../img/carbonic001.jpg'
import orbiter001 from '../../img/orbiter001.jpg'
import diode001 from '../../img/diode001.jpg'

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
