import contact001 from '../../img/contact001.jpg'
import CopyEmailButton from '../components/CopyEmailButton'

export default function Contact() {
  return (
    <div className="page">
      <div className="page-grid">
        <div className="page-grid-img" style={{ backgroundImage: `url(${contact001})` }} />
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
