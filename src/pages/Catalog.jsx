import { Link } from 'react-router-dom'
import { getFontById } from '../data/fonts.js'
import FrameImage from '../components/FrameImage.jsx'
import Wordmark from '../components/Wordmark.jsx'

// The landing page leads with a single release rather than the full catalog:
// Orbiter takes the full-width hero, and the three remaining families run
// beneath "Commercial typefaces" — one at six columns, two at three.
const HERO_FONT = 'orbiter'
const GRID_FONTS = ['aeronaut', 'carbonic', 'diode']

// Selected work. Placeholder frames for now; each is an ink-black subject with
// a gray descriptor after it.
const WORK = [
  { subject: 'Pratt Institute', note: 'Custom Font' },
  { subject: 'Miniware', note: 'Custom Logomark' },
  { subject: 'Siempre Agencia', note: 'Fonts in Use' },
  { subject: 'OOO', note: 'Custom Motionmark' },
]

const CAPABILITIES = ['Logos', 'Wordmarks', 'Custom Fonts', 'Modifications']
const SECTORS = ['Arts & Culture', 'Higher Education', 'Science', 'Technology', 'Finance', 'Sustainability']

export default function Catalog() {
  const hero = getFontById(HERO_FONT)
  const [lead, ...rest] = GRID_FONTS.map(getFontById)

  return (
    <div className="doc">
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <div className="band band--open">
        <Wordmark as="h1" />
      </div>

      {/* ── Release ──────────────────────────────────────────────────── */}
      <section className="band">
        <Link to={`/catalog/${HERO_FONT}`}>
          <FrameImage className="media media--hero" />
          <div className="caption caption--split">
            <span>{hero.displayName}</span>
            <span>New Release</span>
          </div>
        </Link>
      </section>

      {/* ── Studio ───────────────────────────────────────────────────── */}
      <section className="band row">
        <h2 className="statement col-main">Independent type designed in Brooklyn, NY.</h2>
        <dl className="list-block col-a">
          <dt>Capabilities</dt>
          {CAPABILITIES.map(item => <dd key={item}>{item}</dd>)}
        </dl>
        <div className="col-b">
          <Link to="/about" className="arrow-link">About the studio →</Link>
        </div>
      </section>

      {/* ── Catalog ──────────────────────────────────────────────────── */}
      <section className="band">
        <h2 className="body-lg">Commercial typefaces</h2>

        <div className="row catalog-grid">
          <Link to={`/catalog/${lead.id}`} className="catalog-card col-main">
            <FrameImage className="media media--large" />
            <div className="caption">{lead.displayName}</div>
          </Link>

          {rest.map((font, i) => (
            <Link key={font.id} to={`/catalog/${font.id}`} className={`catalog-card ${i === 0 ? 'col-a' : 'col-b'}`}>
              <FrameImage className="media media--tall" />
              <div className="caption">{font.displayName}</div>
            </Link>
          ))}
        </div>

        <div className="row">
          <p className="body-lg catalog-note col-main">
            Fonts designed for contemporary use. Enjoy straightforward licensing
            and free trials across the entire catalog.
          </p>
        </div>
        <div className="arrow-row catalog-actions">
          <Link to="/trials" className="arrow-link">Download trial fonts →</Link>
          <Link to="/license" className="arrow-link">License overview →</Link>
        </div>
      </section>

      {/* ── Clients ──────────────────────────────────────────────────── */}
      <section className="band">
        <div className="row">
          <h2 className="statement col-main">Trusted by designers and brands worldwide.</h2>
          <dl className="list-block col-a">
            <dt>Sectors</dt>
            {SECTORS.map(item => <dd key={item}>{item}</dd>)}
          </dl>
          <dl className="list-block col-b">
            <dt>All inquiries</dt>
            <dd><a href="mailto:hello@poi.tf">hello@poi.tf</a></dd>
          </dl>
        </div>

        <div className="work-grid">
          {WORK.map(item => (
            <div key={item.subject}>
              <FrameImage className="media media--work" />
              <div className="caption">
                {item.subject} <span className="caption-note">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

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
