import { imgProps } from '../data/images.js'

/**
 * Subtle cursor-following perspective tilt shared by every framed image: the
 * frame rotates a few degrees to "face" the pointer and grows slightly.
 *
 * The rotation is written straight onto the frame's inline `transform` rather
 * than through a CSS custom property: the frame is a query container
 * (`container-type: inline-size`), and a query container resets @property-typed
 * custom props to their initial value, so a var-driven transform never tilts.
 * CSS owns only the easing (see `.frame-tilt` in index.css).
 */
const TILT_MAX = 9 // degrees of rotation at the frame's edge
const TILT_SCALE = 1.03 // subtle grow-on-hover
const clamp = (v) => Math.max(-1, Math.min(1, v))

const tiltEnabled = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const tiltHandlers = {
  onMouseMove(e) {
    if (!tiltEnabled()) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = clamp((e.clientX - r.left) / r.width - 0.5) // −0.5 (left) … 0.5 (right)
    const py = clamp((e.clientY - r.top) / r.height - 0.5) // −0.5 (top)  … 0.5 (bottom)
    const ry = px * 2 * TILT_MAX // turn toward the cursor horizontally
    const rx = -py * 2 * TILT_MAX // tip toward the cursor vertically
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${TILT_SCALE})`
  },
  onMouseLeave(e) {
    e.currentTarget.style.transform = ''
  },
}

/**
 * A framed, cover-cropped responsive image.
 *
 * Renders the existing frame wrapper (`className` carries the frame's layout
 * class, e.g. "catalog-card-img portrait") with:
 *   - a tiny inline LQIP painted as the wrapper background so something shows
 *     instantly while the real image streams in / lazy-loads;
 *   - an <img> whose srcSet uses density (x) descriptors keyed off the frame's
 *     fixed height, so the browser fetches the resolution that fits the display
 *     density (Retina picks the 2×/3× candidate) — selection is height-based,
 *     independent of the card's width;
 *   - native lazy loading by default (eager only for above-the-fold heroes);
 *   - a cursor-following perspective tilt on hover (see tiltHandlers above).
 *
 * The blur-in intro animation targets `.frame-img` (see index.css).
 *
 * @param {string} file   /img filename, e.g. "about001.jpg"
 * @param {boolean} eager load immediately instead of lazily (use for LCP images)
 */
export default function FrameImage({ file, className, eager = false, children }) {
  const { src, srcSet, width, height, placeholder } = imgProps(file)
  return (
    <div
      className={['frame-tilt', className].filter(Boolean).join(' ')}
      style={{ backgroundImage: `url(${placeholder})` }}
      {...tiltHandlers}
    >
      <img
        className="frame-img"
        src={src}
        srcSet={srcSet}
        width={width}
        height={height}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchpriority: 'high' } : null)}
      />
      {children}
    </div>
  )
}
