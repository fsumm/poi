import TrialForm from '../components/TrialForm.jsx'

export default function Trials() {
  return (
    <div className="doc">
      <div className="band band--open row">
        <h1 className="statement col-main">Try the whole catalog before you license it.</h1>
      </div>

      <section className="band row">
        <div className="col-main">
          <TrialForm heading={false} />
        </div>
      </section>
    </div>
  )
}
