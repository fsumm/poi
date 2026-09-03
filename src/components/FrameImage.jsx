/**
 * A framed image slot.
 *
 * In the refreshed design every image frame renders as a flat gray placeholder:
 * the wrapper keeps its layout class (e.g. "catalog-card-img portrait"), its
 * radius, and its inline-size container context — so the catalog's overlay
 * glyphs still size themselves to the frame — but paints --gray-2 instead of a
 * photograph.
 *
 * The fill is a real `.frame-img` element rather than a background on the
 * wrapper so the page-transition blur-in still has a target to animate (see the
 * .page-anim rules in index.css).
 *
 * There is deliberately no hover treatment here: the cursor-following
 * perspective tilt that framed images used to carry (useTilt) has been removed.
 * useTilt itself is still used by the store-modal buttons.
 *
 * `file` and `eager` are accepted and ignored while placeholders are in place.
 * Keeping them in the signature leaves every call site and the /img responsive
 * pipeline (scripts/gen-images.mjs → data/images.js) untouched, so restoring
 * photography is a change to this component alone.
 *
 * @param {string} file   /img filename, e.g. "about001.jpg" (currently unused)
 * @param {boolean} eager load immediately instead of lazily (currently unused)
 */
export default function FrameImage({ file, className, eager = false, children }) {
  return (
    <div className={className}>
      <div className="frame-img" />
      {children}
    </div>
  )
}
