import { Link } from 'react-router-dom'

/**
 * License overview — the plain-language companion to the EULA at /eula, which
 * remains the binding document.
 */

// Two rows of four, each row opened by its own rule. Question in gray-4,
// answer in ink — the inverse of the label/list blocks elsewhere.
const FAQ_ROWS = [
  [
    { q: 'Can I commission a modification to a typeface?', a: 'Yes.' },
    { q: 'Can I commission a custom typeface?', a: 'Yes.' },
    {
      q: 'Do you offer discounts?',
      a: 'A 25% discount is offered at checkout for any Licensees that are registered as a non-profit.',
    },
    {
      q: 'Can I purchase a license for my client?',
      a: 'Yes. Purchasing on behalf of a Licensee is specified when adding a license to your cart. If your Licensee is making the purchase, there is also an option to share your cart with them.',
    },
  ],
  [
    {
      q: 'What payment methods are supported?',
      a: 'Font licenses can be purchased via credit card. Payment processing is handled by Stripe.',
    },
    {
      q: 'How does pricing work?',
      a: 'The price is based on the company size of the licensee (“Licensee Size”) at the time of purchase.',
    },
    {
      q: 'How does “Licensee Size” work?',
      a: '“Licensee Size” is the number of people, including part-time and full-time employees and temporary staff, working for the licensee.',
    },
    {
      q: 'What is your refund policy?',
      a: 'Refunds are not offered for font license purchases. The entire catalog is free to try and can be tested before purchasing.',
    },
  ],
]

export default function License() {
  return (
    <div className="doc">
      {/* ── Title ────────────────────────────────────────────────────── */}
      <div className="band band--open">
        <h1>
          Bold designs.<br />
          Easy licensing.
        </h1>
      </div>

      <section className="band row">
        <p className="body-lg col-right">
          Each typeface is carefully researched, drawn, and engineered.
          Purchasing a license is the simplest part.
        </p>
      </section>

      {/* ── One license ──────────────────────────────────────────────── */}
      <section className="band row">
        <h2 className="statement col-main">One license</h2>
        <div className="col-right">
          <p className="body-lg">
            The commercial license bundles all uses into one license. Use your
            fonts anywhere—from print to web, to logos, to merchandise. Custom
            licenses available on request.
          </p>
          <dl className="list-block band-actions">
            <dt>License inquiries</dt>
            <dd><a href="mailto:hello@poi.tf">hello@poi.tf</a></dd>
          </dl>
        </div>
      </section>

      {/* ── Fair pricing ─────────────────────────────────────────────── */}
      <section className="band row">
        <h2 className="statement col-main">Fair pricing</h2>
        <div className="col-right">
          <p className="body-lg">
            No subscriptions and no renewals. Pricing is based on the licensee
            size at the time of purchase. Your license remains valid even as the
            licensee size grows.
          </p>
          <div className="arrow-row band-actions">
            <Link to="/eula" className="arrow-link">Read the full license terms →</Link>
          </div>
        </div>
      </section>

      {/* ── Free trials ──────────────────────────────────────────────────
          The FAQ heading closes this band, introducing the rows beneath it. */}
      <section className="band">
        <div className="row">
          <h2 className="statement col-main">Free trials</h2>
          <div className="col-right">
            <p className="body-lg">
              Try out the complete catalog before purchasing a license. Trial
              fonts include the complete glyphset and features. Intended for
              client pitches, personal projects, and student work.
            </p>
            <div className="arrow-row band-actions">
              <Link to="/trials" className="arrow-link">Download trial fonts →</Link>
            </div>
          </div>
        </div>
        <h2 className="body-lg band-outro">Frequently asked questions</h2>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {FAQ_ROWS.map((row, i) => (
        <section
          className={`band faq-row${i < FAQ_ROWS.length - 1 ? ' band--tight' : ' faq-row--end'}`}
          key={i}
        >
          <div className="row">
            {row.map(item => (
              <dl className="faq" key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </dl>
            ))}
          </div>
        </section>
      ))}

      {/* ── Contact ──────────────────────────────────────────────────── */}
      <section className="band">
        <p className="contact-block">
          Get in touch<br />
          <a href="mailto:hello@poi.tf">hello@poi.tf</a>
        </p>
      </section>
    </div>
  )
}
