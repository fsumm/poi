import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

const STORE_URL = 'https://store.poi.tf'

const MUTATION = `
  mutation TestFontsFormUpdateCustomerMutation($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      order { id }
    }
  }
`

/**
 * The trial request form, shared by the /trials page and the trial modal.
 *
 * `heading` draws the "Trials" label above the copy. The modal needs it — it
 * has no other title — while the /trials page carries its own page head, where
 * a second "Trials" would just repeat the H1.
 */
export default function TrialForm({ heading = true }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eulaAgreed, setEulaAgreed] = useState(false)
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const downloadRef = useRef(null)

  const disabled = !eulaAgreed || !email || !name

  async function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${STORE_URL}/graphql?queryName=TestFontsFormUpdateCustomerMutation`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: MUTATION,
          variables: { input: { name, email, newsletterOptIn } },
        }),
      })
      const json = await res.json()
      if (json.errors?.length) {
        setError(json.errors[0].message)
      } else {
        downloadRef.current?.submit()
        setSubmitted(true)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {submitted ? (
        <p className="page-text">
          Your download should start automatically.{' '}
          <a href={`${STORE_URL}/test-fonts/archive`}>Click here</a> if it didn't.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {heading && <h2 className="page-section-label">Trials</h2>}
          <p className="page-text">
            Trial fonts include the complete character set and all OpenType
            features. Intended for client pitches, personal projects, and student work.
          </p>

          <label className="form-field-label">
            Name
            <input
              className="form-field"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>
          <label className="form-field-label">
            Email
            <input
              className="form-field"
              type="email"
              placeholder="Your email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <div className="form-eula-row">
            <label className="form-toggle" onClick={() => setEulaAgreed(v => !v)}>
              <span className={`form-toggle-dot${eulaAgreed ? ' checked' : ''}`} />
              I agree to the EULA
            </label>
            <Link to="/eula" className="pill-link">View EULA</Link>
          </div>

          <label className="form-toggle" onClick={() => setNewsletterOptIn(v => !v)}>
            <span className={`form-toggle-dot${newsletterOptIn ? ' checked' : ''}`} />
            Subscribe to the newsletter
          </label>

          {error && <p className="page-text" style={{ color: 'red' }}>{error}</p>}

          <div className="form-actions">
            <button
              type="submit"
              className={`btn ${disabled ? 'btn-dim' : 'btn-dark'}`}
              disabled={disabled || submitting}
            >
              {submitting ? 'Downloading…' : 'Download trial fonts'}
            </button>
          </div>
        </form>
      )}

      {/* Hidden form triggers the file download after mutation succeeds */}
      <form
        ref={downloadRef}
        action={`${STORE_URL}/test-fonts/archive`}
        method="get"
        target="_blank"
        style={{ display: 'none' }}
      />
    </>
  )
}
