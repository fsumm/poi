import { Link } from 'react-router-dom'
import FrameImage from '../components/FrameImage.jsx'

// Studio-level lists, the same shape as the landing page's side columns.
const CAPABILITIES = ['Logos', 'Wordmarks', 'Custom Fonts', 'Modifications']
const SECTORS = ['Arts & Culture', 'Higher Education', 'Science', 'Technology', 'Finance', 'Sustainability']

// The four stages of the studio's process, two-up across the right half.
const PROCESS = [
  {
    name: 'Research',
    text: 'A deep understanding of the problem at hand. Discovering the best approach through questioning and strategy.',
  },
  {
    name: 'Direction',
    text: 'Translating discovery into development. Rapid sketching and prototyping to validate each possible outcome.',
  },
  {
    name: 'Craft',
    text: 'Integrating the latest advances in design and font technology. A nuanced competence of the medium and its capabilities.',
  },
  {
    name: 'Output',
    text: 'Revolutionary design that sets the standard and puts your work on the map. Culturally significant and cutting-edge.',
  },
]

export default function About() {
  return (
    <div className="doc">
      {/* ── Statement ────────────────────────────────────────────────────
          The page opens at the H1 step across all 12 columns — the only place
          besides the masthead where the largest step is used. */}
      <div className="band band--open">
        <h1>
          Place of Interest is an independent studio building brands and stories
          through typography.
        </h1>
      </div>

      {/* ── Intro ────────────────────────────────────────────────────────
          The section heading closes this band rather than opening the next: it
          sits under the intro and introduces the row below the rule. */}
      <section className="band">
        <div className="row">
          <p className="body-lg col-right">
            Integrating research, iteration, and craft, the result is trusted by
            designers and companies worldwide. Founded in 2024 by designer Felix Summ.
          </p>
        </div>
        <h2 className="statement band-outro">Information</h2>
      </section>

      {/* ── Information ──────────────────────────────────────────────── */}
      <section className="band">
        <div className="row">
          <dl className="list-block col-q1">
            <dt>All inquiries</dt>
            <dd><a href="mailto:hello@poi.tf">hello@poi.tf</a></dd>
          </dl>
          <dl className="list-block col-q2">
            <dt>Capabilities</dt>
            {CAPABILITIES.map(item => <dd key={item}>{item}</dd>)}
          </dl>
          <dl className="list-block col-q3">
            <dt>Sectors</dt>
            {SECTORS.map(item => <dd key={item}>{item}</dd>)}
          </dl>
          <dl className="list-block col-q4">
            <dt>Office</dt>
            <dd>Bed-Stuy</dd>
            <dd>Brooklyn, NY</dd>
          </dl>
        </div>

        <div className="about-feature">
          <FrameImage className="media media--wide" />
          <div className="caption">
            Prattfolio <span className="caption-note">Fonts in Use</span>
          </div>
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────── */}
      <section className="band row">
        <h2 className="statement col-main">Philosophy</h2>
        <p className="body-lg col-right">
          In its use as a wayfinding symbol, ⌘ denotes cultural locations and
          places of interest. These spaces are made known for their knowledge,
          heritage, and community. Place of Interest is what it looks like for a
          studio to embody these ideals; to place itself on the map for the
          entire world to see.
        </p>
      </section>

      {/* ── Process ──────────────────────────────────────────────────────
          Two rows of two in the right half, split by a rule that spans only
          that half rather than the full content width. */}
      <section className="band row">
        <h2 className="statement col-main">Process</h2>
        <div className="col-right process-grid">
          {PROCESS.map(stage => (
            <dl className="list-block" key={stage.name}>
              <dt>{stage.name}</dt>
              <dd>{stage.text}</dd>
            </dl>
          ))}
        </div>
      </section>

      {/* ── Retail catalog ───────────────────────────────────────────── */}
      <section className="band row">
        <h2 className="statement col-main">Retail catalog</h2>
        <div className="col-right">
          <p className="body-lg">
            A collection of fonts designed for contemporary use. Download free
            trials of the whole catalog—complete with all features and glyphsets.
          </p>
          <div className="arrow-row band-actions">
            <Link to="/trials" className="arrow-link">Download trial fonts →</Link>
            <Link to="/license" className="arrow-link">License overview →</Link>
          </div>
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
