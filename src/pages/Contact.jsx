import FrameImage from '../components/FrameImage.jsx'
import CopyEmailButton from '../components/CopyEmailButton'

export default function Contact() {
  return (
    <div className="page">
      <div className="page-grid">
        <FrameImage file="contact001.jpg" className="page-grid-img" eager />
        <div className="page-grid-body">
          <div className="page-section-label">Contact</div>
          <p className="page-text">
            The foundry is available for custom projects and bespoke modifications to
            the catalog. Proposals for new retail fonts are reviewed on a case-by-case basis. Kindly 
            reach out to the email below.
          </p>
          <CopyEmailButton email="hello@poi.tf" />
        </div>
      </div>
    </div>
  )
}
