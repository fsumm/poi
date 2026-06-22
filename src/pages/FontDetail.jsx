import { useParams, Navigate } from 'react-router-dom'
import { Suspense, Component } from 'react'
import aeronaut001 from '../../img/aeronaut001.jpg'
import carbonic001 from '../../img/carbonic001.jpg'
import orbiter001 from '../../img/orbiter001.jpg'
import diode001 from '../../img/diode001.jpg'

const fontImages = { aeronaut: aeronaut001, carbonic: carbonic001, orbiter: orbiter001, diode: diode001 }
import BuyButton from 'fontdue-js/BuyButton'
import GlyphOverview from '../components/GlyphOverview.jsx'
import TypeTester from '../components/TypeTester.jsx'
import { getFontById } from '../data/fonts.js'

class SectionErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return null
    return this.props.children
  }
}

function fontFamily(id) {
  const map = {
    aeronaut: 'POI Aeronaut',
    carbonic: 'POI Carbonic',
    orbiter: 'POI Orbiter',
    diode: 'POI Diode',
  }
  return map[id] ?? 'inherit'
}

export default function FontDetail() {
  const { fontId } = useParams()
  const font = getFontById(fontId)

  if (!font) return <Navigate to="/catalog" replace />

  const ff = fontFamily(fontId)

  return (
    <div className="font-detail">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="font-detail-header">
        <div className="font-detail-img" style={{ backgroundImage: fontImages[fontId] ? `url(${fontImages[fontId]})` : undefined }} />

        <div className="font-detail-meta">
          <div className="font-detail-breadcrumb">{font.displayName}</div>

          <div
            className="font-detail-specimen"
            style={{ fontFamily: ff, fontWeight: 400 }}
          >
            Aa
          </div>
        </div>

        <p className="font-detail-description">{font.description}</p>
      </div>

      {/* ── Type tester ──────────────────────────────────────────── */}
      <div className="fontdue-section">
        <TypeTester
          collectionSlug={font.fontdueSlug}
          collectionId={font.fontdueCollectionId}
          defaultStyleName={font.defaultStyleName}
          defaultWeight={font.defaultWeight}
        />
      </div>

      {/* ── Glyph overview (custom) ──────────────────────────────── */}
      <GlyphOverview collectionSlug={font.fontdueSlug} collectionId={font.fontdueCollectionId} fallbackWeights={font.weights} />

      {/* ── Buy actions ──────────────────────────────────────────────
          Last in the DOM so the mobile sticky bar's natural flow position
          is the bottom of the content; desktop/tablet pin it via grid-row:1. */}
      <div className="font-detail-actions-sticky">
        <a
          className="btn btn-dark"
          href={`https://store.poi.tf/products/${font.fontdueSlug}?trial=true`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Trial
        </a>
        <Suspense fallback={<span className="btn btn-blue">Buy</span>}>
          <BuyButton
            collectionSlug={font.fontdueSlug}
            collectionName={font.name}
            label="Buy"
          />
        </Suspense>
      </div>
    </div>
  )
}
