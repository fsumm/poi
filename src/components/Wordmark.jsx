import { useFitText } from '../useFitText.js'

// The "Place of Interest" masthead, set to the exact width of its container.
// It appears twice in the design at the same treatment — opening the landing
// page and closing every page above the footer links — so both call sites
// share this component rather than re-deriving the fit.
//
// Weight 500 (POI Orbiter Medium) and -6.55% tracking are the drawn values.
const TEXT = 'Place of Interest'
const FAMILY = 'POI Orbiter'
const WEIGHT = 500
const TRACKING = -0.0655

/**
 * @param {string} as        element for the text itself ('h1' on the landing
 *                           page, a plain span in the footer where it is
 *                           decorative and must not claim a heading level)
 * @param {string} className extra class on the clipping container
 */
export default function Wordmark({ as: Tag = 'span', className = '', 'aria-hidden': ariaHidden }) {
  // The weight is handed to the fitter as well as set in CSS: useFitText
  // rasterizes the text to find its true ink edges, so measuring at a different
  // weight than the one that paints would break the flush-left/right fit.
  const [containerRef, textRef, ready] = useFitText({
    text: TEXT,
    family: FAMILY,
    tracking: TRACKING,
    weight: WEIGHT,
  })
  return (
    <div
      className={`wordmark${className ? ` ${className}` : ''}`}
      ref={containerRef}
      aria-hidden={ariaHidden}
      data-anim-pending={ready ? undefined : ''}
    >
      {/* fontSize / marginLeft are written imperatively by useFitText so the
          fit tracks resizes without waiting on a render. */}
      <Tag
        className="wordmark-text"
        ref={textRef}
        style={{ visibility: ready ? undefined : 'hidden' }}
      >
        {TEXT}
      </Tag>
    </div>
  )
}
