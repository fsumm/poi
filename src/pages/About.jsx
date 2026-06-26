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
            Place of Interest is the type design practice of 
            Finnish-American designer Felix Summ. The foundry 
            is based in Brooklyn, NY and delivers high-quality 
            font software to clients worldwide.
          </p>
        </div>
      </div>

      <div className="about-secondary">
        <FrameImage file="about002.jpg" className="about-secondary-img" />
        <div className="about-secondary-body">
          <p className="about-secondary-text">
            The name Place of Interest embodies the foundry’s 
            grounding philosophy. To be an emanation of 
            culture, design, and craft. It is to be a resource
            and a landmark.
          </p>
        </div>
      </div>
    </div>
  )
}
