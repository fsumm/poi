import { useState } from 'react'

const STORE_URL = 'https://store.poi.tf'

const MUTATION = `
  mutation NewsletterSignupUpdateCustomerMutation($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      order { id }
    }
  }
`

export default function Newsletter() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [optIn, setOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const disabled = !optIn || !email || !name

  async function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${STORE_URL}/graphql?queryName=NewsletterSignupUpdateCustomerMutation`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: MUTATION,
          variables: { input: { name, email, newsletterOptIn: optIn } },
        }),
      })
      const json = await res.json()
      if (json.errors?.length) {
        setError(json.errors[0].message)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="doc">
      {/* Statement, then the form below the rule — the same band structure as
          the landing, about and license pages. */}
      <div className="band band--open row">
        <h1 className="statement col-main">Hear about updates and new releases.</h1>
      </div>

      <section className="band row">
        <div className="col-main">
          {submitted ? (
            <p className="page-text">You're subscribed. Thanks!</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="page-text">Stay informed on new releases and updates.</p>

              <label className="form-field-label">
                Name
                <input
                  className="form-field"
                  type="text"
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
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="form-toggle" onClick={() => setOptIn(v => !v)}>
                <span className={`form-toggle-dot${optIn ? ' checked' : ''}`} />
                Subscribe
              </label>

              {error && <p className="form-error">{error}</p>}

              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn ${disabled ? 'btn-dim' : 'btn-dark'}`}
                  disabled={disabled || submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
