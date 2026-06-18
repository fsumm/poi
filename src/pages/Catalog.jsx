import { Link } from 'react-router-dom'
import { fonts } from '../data/fonts.js'

export default function Catalog() {
  const [aeronaut, carbonic, orbiter, diode] = fonts

  return (
    <div className="catalog-page">
      <div className="catalog-grid">
        {/* Aeronaut — landscape, cols 1–4, row 1 */}
        <Link
          to="/catalog/aeronaut"
          className="catalog-card"
          style={{ gridColumn: '1 / 5', gridRow: 1 }}
        >
          <div className="catalog-card-img landscape" />
          <div className="catalog-card-name">{aeronaut.displayName}</div>
        </Link>

        {/* Carbonic — portrait, cols 6–8, row 1 (cols 5 & 9–10 empty) */}
        <Link
          to="/catalog/carbonic"
          className="catalog-card"
          style={{ gridColumn: '6 / 9', gridRow: 1 }}
        >
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        {/* Orbiter — portrait, cols 4–6, row 2 */}
        <Link
          to="/catalog/orbiter"
          className="catalog-card"
          style={{ gridColumn: '4 / 7', gridRow: 2 }}
        >
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        {/* Diode — portrait, cols 7–9, row 2 (col 10 empty) */}
        <Link
          to="/catalog/diode"
          className="catalog-card"
          style={{ gridColumn: '7 / 10', gridRow: 2 }}
        >
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
