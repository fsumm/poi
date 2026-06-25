import { imgProps } from '../data/images.js'
import { useTilt } from '../useTilt.js'

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
 *   - a cursor-following perspective tilt on hover (see useTilt — smoothed in a
 *     rAF loop, no CSS transition, so it stays smooth in Safari as well).
 *
 * The blur-in intro animation targets `.frame-img` (see index.css).
 *
 * @param {string} file   /img filename, e.g. "about001.jpg"
 * @param {boolean} eager load immediately instead of lazily (use for LCP images)
 */
export default function FrameImage({ file, className, eager = false, children }) {
  const { src, srcSet, width, height, placeholder } = imgProps(file)
  const tilt = useTilt()
  return (
    <div
      ref={tilt.ref}
      className={className}
      style={{ backgroundImage: `url(${placeholder})` }}
      onMouseEnter={tilt.onMouseEnter}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
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
