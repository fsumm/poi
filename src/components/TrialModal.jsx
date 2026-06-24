import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import TrialForm from './TrialForm.jsx'

export default function TrialModal({ open, onClose }) {
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef(null)

  // Play the slide-out animation, then unmount via onClose. A timer guarantees
  // the modal still closes if the animation never fires (reduced motion, etc.).
  function requestClose() {
    if (closeTimer.current) return
    setClosing(true)
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      // Reset before unmounting so a reopened modal's first frame isn't
      // painted with the leftover data-closing (slide-out) state.
      setClosing(false)
      onClose()
    }, 300)
  }

  useEffect(() => {
    if (open) {
      setClosing(false)
      // Drop any lingering timer id so a reopened modal can close again.
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [open])

  // Clear any pending close timer on unmount.
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="trial-modal__overlay">
      {/* Transparent backdrop — clicking the main content area closes the modal */}
      <div className="trial-modal__background" onClick={requestClose} />

      <div
        className="trial-modal__panel"
        data-closing={closing ? '' : undefined}
      >
        <div className="trial-modal__nav">
          <button
            type="button"
            className="trial-modal__close-button"
            onClick={requestClose}
          />
        </div>
        <div className="trial-modal__body">
          <TrialForm />
        </div>
      </div>
    </div>,
    document.body
  )
}
