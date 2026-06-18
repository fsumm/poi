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
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-2col">
        <div className="page-img" />
        <div className="page-body">
          {submitted ? (
            <p className="page-text">You're subscribed. Thanks!</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="page-section-label">Newsletter</div>
              <p className="page-text">Stay informed on new releases and updates.</p>

              <input
                className="form-field"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input
                className="form-field"
                type="email"
                placeholder="Your email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label className="form-toggle" onClick={() => setOptIn(v => !v)}>
                <span className={`form-toggle-dot${optIn ? ' checked' : ''}`} />
                I would like to receive news
              </label>

              {error && <p className="page-text" style={{ color: 'red' }}>{error}</p>}

              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn ${disabled ? 'btn-dim' : 'btn-dark'}`}
                  disabled={disabled || submitting}
                >
                  {submitting ? 'Subscribing…' : 'Subscribe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
