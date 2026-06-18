import { useParams, Navigate } from 'react-router-dom'
import { Suspense, Component } from 'react'
import TypeTesters from 'fontdue-js/TypeTesters'
import BuyButton from 'fontdue-js/BuyButton'
import GlyphOverview from '../components/GlyphOverview.jsx'
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
      {/* ── Sticky buy actions ───────────────────────────────────────── */}
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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="font-detail-header">
        <div className="font-detail-img" />

        <div className="font-detail-meta">
          <div className="font-detail-breadcrumb">{font.displayName}</div>

          <div
            className="font-detail-specimen"
            style={{ fontFamily: ff, fontWeight: 400 }}
          >
            Aa
          </div>

          <p className="font-detail-description">{font.description}</p>

        </div>
      </div>

      {/* ── Type tester (Fontdue) ────────────────────────────────── */}
      <div className="fontdue-section">
        <SectionErrorBoundary>
          <Suspense fallback={<div className="fontdue-loading" />}>
            <TypeTesters
              collectionSlug={font.fontdueSlug}
              autofit
              features="*"
            />
          </Suspense>
        </SectionErrorBoundary>
      </div>

      {/* ── Glyph overview (custom) ──────────────────────────────── */}
      <GlyphOverview collectionSlug={font.fontdueSlug} />
    </div>
  )
}
