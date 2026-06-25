import FrameImage from '../components/FrameImage.jsx'
import CopyEmailButton from '../components/CopyEmailButton'

export default function About() {
  return (
    <div className="page">
      <div className="page-grid">
        <FrameImage file="about001.jpg" className="page-grid-img" eager />
        <div className="page-grid-body">
          <div className="page-section-label">About</div>
          <p className="page-text">
            Place of Interest is an independent type foundry based in Brooklyn, NY.
            It was founded in 2024 by Felix Summ after years of drawing self-initiated
            typefaces. Get in touch for custom inquiries or to submit a font to the catalog.
          </p>
          <CopyEmailButton email="hello@poi.tf" />
        </div>
      </div>

      <div className="about-secondary">
        <FrameImage file="about002.jpg" className="about-secondary-img" />
        <div className="about-secondary-body">
          <div className="page-section-label">⌘?</div>
          <p className="about-secondary-text">
            The oldest recorded ⌘ is 1,600 years old and was discovered in Sweden.
          </p>
          <p className="about-secondary-text">
            In the 1950s, Nordic countries in Europe adopted ⌘ as a wayfinding marker
            for cultural and historical places of interest.
          </p>
          <p className="about-secondary-text">
            To be a place of interest—in art, culture, and design—is the guiding
            principle of the foundry.
          </p>
        </div>
      </div>
    </div>
  )
}
