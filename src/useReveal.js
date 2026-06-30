import { useEffect, useRef } from 'react'

// One shared IntersectionObserver that toggles `data-revealed` on each registered
// element as it enters/leaves an active band near the viewport. Toggling an
// attribute imperatively (rather than through React state) avoids a re-render per
// cell on every scroll — which matters with hundreds of glyph cells. CSS keys the
// scale-in / scale-out off [data-revealed].
let observer = null

function ensureObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute('data-revealed', entry.isIntersecting)
      }
    },
    // Active band (rootMargin is top/right/bottom/left). Both +5% extend the band
    // 5% beyond the viewport: scrolling down, cells reveal 5% below the bottom
    // edge; scrolling up, they reveal 5% above the top edge (and animate back out
    // 5% past the opposite edge).
    { threshold: 0, rootMargin: '40% 0px 50% 0px' },
  )
  return observer
}

// Returns a ref to attach to the element. The element gets `data-revealed` while
// it's in view and loses it when it scrolls out (so it animates out at the top
// and back in on scroll-up). Falls back to revealed where IO is unavailable.
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = ensureObserver()
    if (!obs) {
      el.setAttribute('data-revealed', '')
      return
    }
    obs.observe(el)
    return () => obs.unobserve(el)
  }, [])
  return ref
}
