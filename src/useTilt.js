import { useCallback, useEffect, useRef } from 'react'

// Cursor-following perspective tilt for a framed image: the element rotates a
// few degrees to "face" the pointer and grows slightly on hover.
//
// The smoothing is done in a requestAnimationFrame loop that eases the current
// angles toward the pointer target — NOT with a CSS `transition`. Smoothing
// continuous pointer input with a transition restarts a fresh interpolation on
// every mousemove; Chrome composites through it but Safari/WebKit jitters badly
// (re-decomposing a perspective matrix3d + re-rasterizing the rounded-corner
// clip every frame). One transform write per frame is smooth everywhere.
const TILT_MAX = 9 // degrees of rotation at the frame's edge
const TILT_SCALE = 1.03 // subtle grow-on-hover
const SMOOTH = 0.15 // ease factor toward the target, per 60fps frame
const clamp = (v) => Math.max(-1, Math.min(1, v))

const tiltEnabled = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useTilt() {
  const ref = useRef(null)
  // Mutable animation state kept off React's render path: t* = target,
  // c* = current (eased) values; rect is cached on enter so mousemove never
  // forces a synchronous layout.
  const s = useRef({
    tx: 0, ty: 0, ts: 1, // targets: rotateY, rotateX, scale
    cx: 0, cy: 0, cs: 1, // current eased values
    rect: null, hovering: false, raf: 0, last: 0,
  }).current

  const tick = useCallback(
    (now) => {
      const el = ref.current
      if (!el) return
      // Frame-rate independent easing so 120Hz (ProMotion) matches 60Hz.
      const dt = s.last ? now - s.last : 16.67
      s.last = now
      const k = 1 - Math.pow(1 - SMOOTH, dt / 16.67)
      s.cx += (s.tx - s.cx) * k
      s.cy += (s.ty - s.cy) * k
      s.cs += (s.ts - s.cs) * k

      const settled =
        Math.abs(s.tx - s.cx) < 0.01 &&
        Math.abs(s.ty - s.cy) < 0.01 &&
        Math.abs(s.ts - s.cs) < 0.001

      if (settled) {
        s.cx = s.tx
        s.cy = s.ty
        s.cs = s.ts
        if (s.hovering) {
          el.style.transform = `perspective(900px) rotateX(${s.cy}deg) rotateY(${s.cx}deg) scale(${s.cs})`
        } else {
          // Fully reset: drop the inline transform + compositing hint.
          el.style.transform = ''
          el.style.willChange = ''
        }
        s.raf = 0 // stop; the next enter/move/leave restarts the loop
        return
      }

      el.style.transform = `perspective(900px) rotateX(${s.cy}deg) rotateY(${s.cx}deg) scale(${s.cs})`
      s.raf = requestAnimationFrame(tick)
    },
    [s],
  )

  const ensureLoop = useCallback(() => {
    if (!s.raf) {
      s.last = 0
      s.raf = requestAnimationFrame(tick)
    }
  }, [s, tick])

  const onMouseEnter = useCallback(() => {
    const el = ref.current
    if (!el || !tiltEnabled()) return
    s.rect = el.getBoundingClientRect()
    s.hovering = true
    el.style.willChange = 'transform'
    ensureLoop()
  }, [s, ensureLoop])

  const onMouseMove = useCallback(
    (e) => {
      if (!s.hovering || !s.rect) return
      const px = clamp((e.clientX - s.rect.left) / s.rect.width - 0.5)
      const py = clamp((e.clientY - s.rect.top) / s.rect.height - 0.5)
      s.tx = px * 2 * TILT_MAX // rotateY: turn toward the cursor horizontally
      s.ty = -py * 2 * TILT_MAX // rotateX: tip toward the cursor vertically
      s.ts = TILT_SCALE
      ensureLoop()
    },
    [s, ensureLoop],
  )

  const onMouseLeave = useCallback(() => {
    s.hovering = false
    s.tx = 0
    s.ty = 0
    s.ts = 1
    ensureLoop() // eases back to flat, then clears the transform
  }, [s, ensureLoop])

  useEffect(
    () => () => {
      if (s.raf) cancelAnimationFrame(s.raf)
    },
    [s],
  )

  return { ref, onMouseEnter, onMouseMove, onMouseLeave }
}
