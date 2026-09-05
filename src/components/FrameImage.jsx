import { imgProps } from '../data/images.js'

/**
 * A framed image slot.
 *
 * The wrapper keeps its layout class (e.g. "media media--work"), its radius and
 * its inline-size container context — so the catalog's overlay glyphs still
 * size themselves to the frame — and the fill is a real `.frame-img` element
 * rather than a background on the wrapper.
 *
 * Three fills, in order of precedence:
 *   - `video`  a /public path, e.g. "video/ooo-thumbnail.mp4". Plays muted,
 *              looping and inline, with `file` as its poster so the frame is
 *              painted before the first video frame decodes.
 *   - `file`   an /img filename, e.g. "about-1.jpg", resolved through the
 *              responsive pipeline (scripts/gen-images.mjs → data/images.js).
 *              The LQIP sits behind the <img> as a background, so the frame is
 *              never empty while the real file loads.
 *   - neither  the flat --gray-2 placeholder, for frames with no final asset.
 *
 * There is deliberately no hover treatment: the cursor-following perspective
 * tilt that framed images used to carry (useTilt) has been removed. useTilt
 * itself is still used elsewhere.
 *
 * Resolution: variants carry DENSITY (x) descriptors keyed to the reference
 * height in scripts/gen-images.mjs, so the browser picks purely on devicePixel-
 * Ratio and every frame class gets the same rung. Frames now vary from 231px to
 * 639px tall, so short frames over-fetch; sizing them individually would mean
 * w-descriptors plus a per-breakpoint `sizes` for each .media-- class.
 *
 * @param {string} file   /img filename — the image, or a video's poster
 * @param {string} video  path under /public to a looping video fill
 * @param {boolean} eager load immediately instead of lazily
 */
export default function FrameImage({ file, video, className, eager = false, children }) {
  const img = file ? imgProps(file) : null
  const base = import.meta.env.BASE_URL

  // <video poster> takes a single URL with no density picking of its own, and
  // imgProps' src is the 1× file — soft on a Retina frame. Pull the 2× variant
  // out of the srcset when there is one.
  const poster = img
    ? img.srcSet.split(', ').find((v) => v.endsWith(' 2x'))?.split(' ')[0] ?? img.src
    : undefined

  let fill
  if (video) {
    fill = (
      <video
        className="frame-img"
        // Poster paints instantly and covers the gap before the first frame
        // decodes; without it the frame flashes its gray ground.
        poster={poster}
        style={img ? { backgroundImage: `url(${img.placeholder})` } : undefined}
        autoPlay
        loop
        muted
        playsInline
        // The clips are decorative, so they stay out of the critical path until
        // the frame is near the viewport.
        preload={eager ? 'auto' : 'metadata'}
      >
        <source src={`${base}${video}`} type="video/mp4" />
      </video>
    )
  } else if (img) {
    fill = (
      <img
        className="frame-img"
        src={img.src}
        srcSet={img.srcSet}
        width={img.width}
        height={img.height}
        style={{ backgroundImage: `url(${img.placeholder})` }}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        alt=""
      />
    )
  } else {
    fill = <div className="frame-img" />
  }

  return (
    <div className={className}>
      {fill}
      {children}
    </div>
  )
}
