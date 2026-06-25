import { useEffect, useRef, useState } from 'react'
import { Routes, useLocation } from 'react-router-dom'
import { waitUntilReady } from '../animUtils.js'

const EXIT_DURATION = 480

export default function AnimatedRoutes({ children }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [phase, setPhase] = useState('idle')
  const wrapperRef = useRef(null)
  const timerRef = useRef(null)

  // Mirror phase onto body so the footer (outside this wrapper) can react to it.
  useEffect(() => {
    document.body.dataset.pagePhase = phase
  }, [phase])

  // Run the enter sequence once the displayed page's DOM has committed. Keying
  // on displayLocation (not calling startEnter inline) guarantees the new
  // page — and any [data-anim-pending] gate it renders, e.g. the type tester
  // loading placeholder — is in the DOM before waitUntilReady inspects it.
  // Otherwise the readiness check races the React commit and resolves early,
  // letting the page fade in before async content has rendered.
  useEffect(() => {
    waitUntilReady(wrapperRef.current).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('entering'))
      })
    })
  }, [displayLocation])

  useEffect(() => {
    if (location.key === displayLocation.key) return

    clearTimeout(timerRef.current)
    setPhase('exiting')

    timerRef.current = setTimeout(() => {
      setDisplayLocation(location)
      setPhase('idle')
      // Reset scroll as the new page swaps in (while still faded out), so it
      // enters from the top instead of inheriting the previous page's offset.
      window.scrollTo(0, 0)
    }, EXIT_DURATION)

    return () => clearTimeout(timerRef.current)
  }, [location])

  return (
    <div ref={wrapperRef} className={`page-anim page-anim--${phase}`}>
      <Routes location={displayLocation}>
        {children}
      </Routes>
    </div>
  )
}
