import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import TrialForm from './TrialForm.jsx'

export default function TrialModal({ open, onClose }) {
  const [closing, setClosing] = useState(false)
  // Content fades hold until the panel's 300ms slide-in has played (matching
  // the cart modal); --entered releases the staggered fade.
  const [entered, setEntered] = useState(false)
  // Content fades back out before the slide-out (matching the cart modal's
  // close); --exiting drives the staggered fade.
  const [exiting, setExiting] = useState(false)
  const closeTimer = useRef(null)
  const exitTimer = useRef(null)

  // 0.3s fade + 40ms stagger across the 7 form rows, mirroring the cart exit
  const EXIT_FADE = 540

  // Fade the content out, play the slide-out animation, then unmount via
  // onClose. Timers guarantee the modal still closes if the animations never
  // fire (reduced motion, etc.).
  function requestClose() {
    if (closeTimer.current || exitTimer.current) return
    setExiting(true)
    const beginSlide = () => {
      setClosing(true)
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null
        // Reset before unmounting so a reopened modal's first frame isn't
        // painted with leftover state. entered especially: the open-effect
        // reset below runs only AFTER the first paint, so a stale true here
        // would flash the content fully visible for one frame at the slide's
        // start position.
        setClosing(false)
        setExiting(false)
        setEntered(false)
        onClose()
      }, 300)
    }
    // Before --entered the content is still invisible — nothing to fade out
    if (!entered) return beginSlide()
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null
      beginSlide()
    }, EXIT_FADE)
  }

  useEffect(() => {
    if (open) {
      setClosing(false)
      setExiting(false)
      // Drop any lingering timer ids so a reopened modal can close again.
      clearTimeout(closeTimer.current)
      closeTimer.current = null
      clearTimeout(exitTimer.current)
      exitTimer.current = null
    }
  }, [open])

  // Release the content fade as soon as the held (opacity 0) state has
  // painted — the fade then plays while the panel is still sliding in,
  // matching the cart modal. Reset on reopen.
  useEffect(() => {
    if (!open) return
    setEntered(false)
    let r2
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setEntered(true)) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [open])

  // Blur the page behind the modal (the .nav::after layer, same as the cart
  // modal). The flag drops when the slide-out starts so the blur's 0.25s
  // opacity fade plays during the slide, mirroring the cart's close.
  useEffect(() => {
    if (open && !closing) document.body.dataset.trialModal = 'open'
    else delete document.body.dataset.trialModal
    return () => delete document.body.dataset.trialModal
  }, [open, closing])

  // Clear any pending close/exit timers on unmount.
  useEffect(() => () => {
    clearTimeout(closeTimer.current)
    clearTimeout(exitTimer.current)
  }, [])

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
        className={
          'trial-modal__panel' +
          (entered ? ' trial-modal__panel--entered' : '') +
          (exiting ? ' trial-modal__panel--exiting' : '')
        }
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
