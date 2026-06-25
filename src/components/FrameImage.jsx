import { imgProps } from '../data/images.js'

/**
 * A framed, cover-cropped responsive image.
 *
 * Renders the existing frame wrapper (`className` carries the frame's layout
 * class, e.g. "catalog-card-img portrait") with:
 *   - a tiny inline LQIP painted as the wrapper background so something shows
 *     instantly while the real image streams in / lazy-loads;
 *   - an <img> with srcSet + sizes so the browser fetches the resolution that
 *     fits the layout and the display density (Retina picks the 2× candidate);
 *   - native lazy loading by default (eager only for above-the-fold heroes).
 *
 * The blur-in intro animation targets `.frame-img` (see index.css).
 *
 * @param {string} file   /img filename, e.g. "about001.jpg"
 * @param {string} sizes  CSS `sizes` describing the rendered width per breakpoint
 * @param {boolean} eager load immediately instead of lazily (use for LCP images)
 */
export default function FrameImage({ file, sizes, className, eager = false, children }) {
  const { src, srcSet, width, height, placeholder } = imgProps(file)
  return (
    <div className={className} style={{ backgroundImage: `url(${placeholder})` }}>
      <img
        className="frame-img"
        src={src}
        srcSet={srcSet}
        sizes={sizes}
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
