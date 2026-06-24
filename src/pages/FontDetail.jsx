import { useParams, Navigate } from 'react-router-dom'
import { Suspense, Component, useMemo, useState } from 'react'
import aeronaut001 from '../../img/aeronaut001.jpg'
import carbonic001 from '../../img/carbonic001.jpg'
import orbiter001 from '../../img/orbiter001.jpg'
import diode001 from '../../img/diode001.jpg'

const fontImages = { aeronaut: aeronaut001, carbonic: carbonic001, orbiter: orbiter001, diode: diode001 }
import BuyButton from 'fontdue-js/BuyButton'
import GlyphOverview from '../components/GlyphOverview.jsx'
import TypeTester from '../components/TypeTester.jsx'
import TrialModal from '../components/TrialModal.jsx'
import { getFontById } from '../data/fonts.js'
import { makeOverlay } from '../overlayText.js'
import { useFitText } from '../useFitText.js'

const SPECIMEN_TRACKING = -0.04 // -4% letter-spacing, expressed in em

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
  const [trialOpen, setTrialOpen] = useState(false)

  const ff = fontFamily(fontId)

  // Hooks must run unconditionally (before the early return below)
  const overlay = useMemo(() => (font ? makeOverlay(font) : null), [fontId])
  const [specimenRef, specimenTextRef, specimenReady] = useFitText({
    text: font?.displayName ?? '',
    family: ff,
    tracking: SPECIMEN_TRACKING,
  })

  if (!font) return <Navigate to="/catalog" replace />

  return (
    <div className="font-detail">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="font-detail-header">
        <div className="font-detail-img" style={{ backgroundImage: fontImages[fontId] ? `url(${fontImages[fontId]})` : undefined }}>
          <span className="catalog-card-text" style={overlay.style}>{overlay.text}</span>
        </div>

        <div
          className="font-detail-specimen"
          ref={specimenRef}
          data-anim-pending={specimenReady ? undefined : ''}
        >
          {/* fontSize / marginLeft / --baseline-shift are written imperatively
              by useFitText so the fit tracks resizes without a render delay. */}
          <span
            className="font-detail-specimen-text"
            ref={specimenTextRef}
            style={{ fontFamily: ff, fontWeight: 400, visibility: specimenReady ? undefined : 'hidden' }}
          >
            {font.displayName}
          </span>
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
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => setTrialOpen(true)}
        >
          Download Trial
        </button>
        <Suspense fallback={<span className="btn btn-blue">Buy</span>}>
          <BuyButton
            collectionSlug={font.fontdueSlug}
            collectionName={font.name}
            label="Buy"
          />
        </Suspense>
      </div>

      <TrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </div>
  )
}
