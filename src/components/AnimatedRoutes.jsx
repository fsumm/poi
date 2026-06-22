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
