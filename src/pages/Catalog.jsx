import { Link } from 'react-router-dom'
import { fonts } from '../data/fonts.js'

export default function Catalog() {
  const [aeronaut, carbonic, orbiter, diode] = fonts

  return (
    <div className="catalog-page">
      <div className="catalog-grid">
        {/* Aeronaut — 4 cols wide, landscape, row 1 */}
        <Link to="/catalog/aeronaut" className="catalog-card" style={{ gridColumn: '1 / 5', gridRow: 1 }}>
          <div className="catalog-card-img landscape" />
          <div className="catalog-card-name">{aeronaut.displayName}</div>
        </Link>

        {/* Carbonic — 3 cols wide, portrait, row 1, cols 7–9 */}
        <Link to="/catalog/carbonic" className="catalog-card" style={{ gridColumn: '7 / 10', gridRow: 1 }}>
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        {/* Orbiter — 3 cols wide, portrait, row 2, cols 5–7 */}
        <Link to="/catalog/orbiter" className="catalog-card" style={{ gridColumn: '5 / 8', gridRow: 2 }}>
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        {/* Diode — 3 cols wide, portrait, row 2, cols 9–11 */}
        <Link to="/catalog/diode" className="catalog-card" style={{ gridColumn: '9 / 12', gridRow: 2 }}>
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
