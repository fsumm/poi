import { useParams, Navigate } from 'react-router-dom'
import { Suspense, Component, useState } from 'react'
import BuyButton from 'fontdue-js/BuyButton'
import GlyphOverview from '../components/GlyphOverview.jsx'
import TypeTester from '../components/TypeTester.jsx'
import TrialModal from '../components/TrialModal.jsx'
import { getFontById } from '../data/fonts.js'
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

  const [specimenRef, specimenTextRef, specimenReady] = useFitText({
    text: font?.displayName ?? '',
    family: ff,
    tracking: SPECIMEN_TRACKING,
  })

  if (!font) return <Navigate to="/" replace />

  return (
    <div className="font-detail">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="font-detail-header">
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

        {/* Full-width rule under the name. A real element rather than a border
            on the specimen, which has to stay six columns wide because it is
            the fit container useFitText measures the name against. */}
        <hr className="font-detail-rule" />

        <p className="font-detail-description">{font.description}</p>
      </div>

      {/* ── Type tester ──────────────────────────────────────────────
          key={fontId} forces a fresh mount per font so tester state (size,
          tracking, line height, autofit) resets on navigation rather than
          persisting from the previously viewed font. */}
      <div className="fontdue-section">
        <h2 className="section-heading">Type tester</h2>
        {/* The rule lives on this wrapper rather than on the tester itself so
            it is drawn while the tester is still loading its webfonts. */}
        <div className="section-body">
          <TypeTester
            key={fontId}
            collectionSlug={font.fontdueSlug}
            collectionId={font.fontdueCollectionId}
          />
        </div>
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
