import { useEffect } from 'react'
import { attachTilt } from '../useTilt.js'

// The Fontdue store modal's clickable cards/buttons are rendered by the library
// (no JSX of ours to hook), so — like CartAnimator — we watch the DOM and wire
// the cursor-following tilt onto each one imperatively as it appears.
const SELECTOR = [
  '.store-modal__index-item__button',
  '.store-modal__container__container .store-modal__family__style-button',
  '.store-modal__container__container .store-modal__family__family-button[data-clickable="true"]',
  '.store-modal__container__container .store-modal__family__bundle-button',
].join(',')

// A hover scale-DOWN (no perspective tilt — max: 0), matching the feel of the
// glyph-viewer cells which shrink on hover. `stableHover` pins the hover region
// to the button's resting rect so the scale-down never pulls its edge out from
// under the cursor (the glyph cells solve the same flicker with an inner
// pointer-events:none wrapper; these library buttons can't be wrapped, so we
// track the rect instead). Both are single tunable constants.
const TILT_OPTS = { max: 0, scale: 0.94, stableHover: true }

export default function StoreModalTilt() {
  useEffect(() => {
    const attached = new Map() // el -> cleanup

    // Re-diff the live matches on every mutation batch: attach newcomers, detach
    // anything that's gone or no longer matches (e.g. a family button whose
    // data-clickable flipped to false). MutationObserver coalesces a batch into
    // one callback, so this runs once per batch, not per node.
    const reconcile = () => {
      const matches = new Set(document.querySelectorAll(SELECTOR))
      for (const el of matches) {
        if (!attached.has(el)) attached.set(el, attachTilt(el, TILT_OPTS))
      }
      for (const [el, cleanup] of attached) {
        if (!matches.has(el)) { cleanup(); attached.delete(el) }
      }
    }

    const observer = new MutationObserver(reconcile)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-clickable'],
    })
    reconcile() // catch anything already mounted

    return () => {
      observer.disconnect()
      for (const cleanup of attached.values()) cleanup()
      attached.clear()
    }
  }, [])

  return null
}
