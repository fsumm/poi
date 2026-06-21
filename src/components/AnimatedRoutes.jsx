import { useEffect, useRef, useState } from 'react'
import { Routes, useLocation } from 'react-router-dom'

const EXIT_DURATION = 480
const SETTLE_IDLE = 80   // ms of DOM quiet before we consider the page ready
const SETTLE_MAX  = 2000 // hard cap so a misbehaving component can't block forever

function domSettle(el) {
  return new Promise(resolve => {
    let timer = null

    const settle = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        observer.disconnect()
        resolve()
      }, SETTLE_IDLE)
    }

    const observer = new MutationObserver(settle)
    observer.observe(el, { subtree: true, childList: true, characterData: true, attributes: true })
    settle()

    setTimeout(() => { observer.disconnect(); resolve() }, SETTLE_MAX)
  })
}

// Resolves when CSS fonts are loaded and the page DOM has been quiet for
// SETTLE_IDLE ms — meaning async components (TypeTester, etc.) have fully rendered.
async function waitUntilReady(el) {
  await document.fonts.ready
  await domSettle(el)
}

export default function AnimatedRoutes({ children }) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [phase, setPhase] = useState('idle')
  const wrapperRef = useRef(null)
  const timerRef = useRef(null)

  const startEnter = () => {
    waitUntilReady(wrapperRef.current).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('entering'))
      })
    })
  }

  // Initial page load
  useEffect(() => {
    startEnter()
  }, [])

  useEffect(() => {
    if (location.key === displayLocation.key) return

    clearTimeout(timerRef.current)
    setPhase('exiting')

    timerRef.current = setTimeout(() => {
      setDisplayLocation(location)
      setPhase('idle')
      startEnter()
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
