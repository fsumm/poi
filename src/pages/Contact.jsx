import FrameImage from '../components/FrameImage.jsx'
import CopyEmailButton from '../components/CopyEmailButton'

// page-grid-img spans 2 cols. Rendered width per tier (see index.css):
// full width ≤580px, ~25vw-25 on the ≤1140 8-col grid, ~260px on desktop.
const NARROW_SIZES = '(max-width: 580px) calc(100vw - 40px), (max-width: 1140px) calc(25vw - 25px), 260px'

export default function Contact() {
  return (
    <div className="page">
      <div className="page-grid">
        <FrameImage file="contact001.jpg" className="page-grid-img" sizes={NARROW_SIZES} eager />
        <div className="page-grid-body">
          <div className="page-section-label">Contact</div>
          <p className="page-text">
            We're open for custom projects, collaborations, and modifications to
            the catalog. Have a font ready for retail release? We'd love to see that too.
          </p>
          <CopyEmailButton email="hello@poi.tf" />
        </div>
      </div>
    </div>
  )
}
