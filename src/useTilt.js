import { useEffect, useRef } from 'react'

// Cursor-following perspective tilt: the element rotates a few degrees to "face"
// the pointer and changes size slightly on hover.
//
// The smoothing is done in a requestAnimationFrame loop that eases the current
// angles toward the pointer target — NOT with a CSS `transition`. Smoothing
// continuous pointer input with a transition restarts a fresh interpolation on
// every mousemove; Chrome composites through it but Safari/WebKit jitters badly
// (re-decomposing a perspective matrix3d + re-rasterizing the rounded-corner
// clip every frame). One transform write per frame is smooth everywhere.
const TILT_MAX = 9 // degrees of rotation at the element's edge
const TILT_SCALE = 1.03 // hover size factor (>1 grows, <1 shrinks)
const SMOOTH = 0.15 // ease factor toward the target, per 60fps frame
const clamp = (v) => Math.max(-1, Math.min(1, v))

const tiltEnabled = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Imperative tilt core, shared by the React hook and the standalone attachTilt().
// `getEl` returns the element to tilt lazily, so the hook can hand over a ref
// whose .current is only set after mount.
//   max   — peak rotation in degrees at the element's edge
//   scale — hover size factor (>1 grows like the catalog images, <1 shrinks
//           like the glyph cells / store-modal buttons)
function createTiltController(getEl, { max = TILT_MAX, scale = TILT_SCALE } = {}) {
  // t* = target, c* = current (eased); rect cached on enter so mousemove never
  // forces a synchronous layout.
  const s = { tx: 0, ty: 0, ts: 1, cx: 0, cy: 0, cs: 1, rect: null, hovering: false, raf: 0, last: 0 }

  // With max: 0 there's no rotation, so emit a plain 2D scale (no perspective /
  // rotateX/Y, hence no needless 3D compositing layer) — used where we want the
  // hover scale without the tilt.
  const transformStr = () =>
    max === 0
      ? `scale(${s.cs})`
      : `perspective(900px) rotateX(${s.cy}deg) rotateY(${s.cx}deg) scale(${s.cs})`

  const tick = (now) => {
    const el = getEl()
    if (!el) { s.raf = 0; return }
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
      el.style.transform = s.hovering ? transformStr() : '' // settled back to flat
      s.raf = 0 // stop; the next enter/move/leave restarts the loop
      return
    }

    el.style.transform = transformStr()
    s.raf = requestAnimationFrame(tick)
  }

  const ensureLoop = () => {
    if (!s.raf) {
      s.last = 0
      s.raf = requestAnimationFrame(tick)
    }
  }

  return {
    enter() {
      const el = getEl()
      if (!el || !tiltEnabled()) return
      s.rect = el.getBoundingClientRect()
      s.hovering = true
      // Deliberately NO `will-change: transform`. Toggling it per hover eagerly
      // promotes the element to its own compositor layer, re-rasterizing a
      // rounded/clipped box into a fresh GPU texture — a visible paint flash.
      // The running transform composites on its own anyway.
      ensureLoop()
    },
    move(clientX, clientY) {
      if (!s.hovering || !s.rect) return
      const px = clamp((clientX - s.rect.left) / s.rect.width - 0.5)
      const py = clamp((clientY - s.rect.top) / s.rect.height - 0.5)
      s.tx = px * 2 * max // rotateY: turn toward the cursor horizontally
      s.ty = -py * 2 * max // rotateX: tip toward the cursor vertically
      s.ts = scale
      ensureLoop()
    },
    leave() {
      s.hovering = false
      s.tx = 0
      s.ty = 0
      s.ts = 1
      ensureLoop() // eases back to flat, then clears the transform
    },
    rect: () => s.rect, // the resting rect cached on enter
    dispose() {
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    },
  }
}

// React hook: spread the returned handlers onto an element and attach the ref.
// Options { max, scale } are read once on first render (stable per call site).
export function useTilt(opts = {}) {
  const ref = useRef(null)
  const ctrlRef = useRef(null)
  if (!ctrlRef.current) ctrlRef.current = createTiltController(() => ref.current, opts)
  const ctrl = ctrlRef.current

  const apiRef = useRef(null)
  if (!apiRef.current) {
    apiRef.current = {
      ref,
      onMouseEnter: () => ctrl.enter(),
      onMouseMove: (e) => ctrl.move(e.clientX, e.clientY),
      onMouseLeave: () => ctrl.leave(),
    }
  }

  useEffect(() => () => ctrl.dispose(), [ctrl])
  return apiRef.current
}

// Imperative tilt for DOM that React doesn't render (e.g. the Fontdue store
// modal). Attaches pointer listeners to `el` and returns a cleanup function.
//
// opts.stableHover: keep the hover region fixed at the element's RESTING rect,
// tracked via a window-level mousemove, instead of the element's own (moving)
// hit-box. The element scales/tilts under the cursor without ever firing a
// spurious leave — which otherwise flickers: shrink away from the cursor →
// mouseleave → grow back → mouseenter → repeat. Use when the element itself is
// the clickable target (so it can't be made pointer-events:none like the glyph
// cells' inner wrapper) and can't be wrapped (React-owned DOM).
export function attachTilt(el, opts = {}) {
  const ctrl = createTiltController(() => el, opts)

  if (opts.stableHover) {
    let winMove = null
    const stopTracking = () => {
      if (winMove) { window.removeEventListener('mousemove', winMove); winMove = null }
    }
    const onEnter = (e) => {
      ctrl.enter() // caches the resting rect, starts the loop
      ctrl.move(e.clientX, e.clientY)
      if (winMove) return
      winMove = (ev) => {
        const r = ctrl.rect()
        if (!r) return
        const inside =
          ev.clientX >= r.left && ev.clientX <= r.right &&
          ev.clientY >= r.top && ev.clientY <= r.bottom
        if (inside) ctrl.move(ev.clientX, ev.clientY)
        else { ctrl.leave(); stopTracking() } // left the resting rect → settle
      }
      window.addEventListener('mousemove', winMove)
    }
    el.addEventListener('mouseenter', onEnter)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      stopTracking()
      ctrl.dispose()
      el.style.transform = ''
    }
  }

  const onEnter = () => ctrl.enter()
  const onMove = (e) => ctrl.move(e.clientX, e.clientY)
  const onLeave = () => ctrl.leave()
  el.addEventListener('mouseenter', onEnter)
  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mouseenter', onEnter)
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
    ctrl.dispose()
    el.style.transform = ''
  }
}
