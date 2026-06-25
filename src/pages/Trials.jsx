import FrameImage from '../components/FrameImage.jsx'
import TrialForm from '../components/TrialForm.jsx'

export default function Trials() {
  return (
    <div className="page">
      <div className="page-grid">
        <FrameImage file="trials001.jpg" className="page-grid-img" eager />
        <div className="page-grid-body">
          <TrialForm />
        </div>
      </div>
    </div>
  )
}
