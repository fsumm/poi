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

        {/* Carbonic — 2 cols wide, portrait, row 1, cols 7–8 */}
        <Link to="/catalog/carbonic" className="catalog-card" style={{ gridColumn: '7 / 9', gridRow: 1 }}>
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        {/* Orbiter — 2 cols wide, portrait, row 2, cols 5–6 */}
        <Link to="/catalog/orbiter" className="catalog-card" style={{ gridColumn: '5 / 7', gridRow: 2 }}>
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        {/* Diode — 2 cols wide, portrait, row 2, cols 9–10 */}
        <Link to="/catalog/diode" className="catalog-card" style={{ gridColumn: '9 / 11', gridRow: 2 }}>
          <div className="catalog-card-img portrait" />
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
