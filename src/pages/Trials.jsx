import trials001 from '../../img/trials001.jpg'
import TrialForm from '../components/TrialForm.jsx'

export default function Trials() {
  return (
    <div className="page">
      <div className="page-grid">
        <div className="page-grid-img" style={{ backgroundImage: `url(${trials001})` }} />
        <div className="page-grid-body">
          <TrialForm />
        </div>
      </div>
    </div>
  )
}
