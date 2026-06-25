import FrameImage from '../components/FrameImage.jsx'
import TrialForm from '../components/TrialForm.jsx'

// page-grid-img spans 2 cols. Rendered width per tier (see index.css):
// full width ≤580px, ~25vw-25 on the ≤1140 8-col grid, ~260px on desktop.
const NARROW_SIZES = '(max-width: 580px) calc(100vw - 40px), (max-width: 1140px) calc(25vw - 25px), 260px'

export default function Trials() {
  return (
    <div className="page">
      <div className="page-grid">
        <FrameImage file="trials001.jpg" className="page-grid-img" sizes={NARROW_SIZES} eager />
        <div className="page-grid-body">
          <TrialForm />
        </div>
      </div>
    </div>
  )
}
