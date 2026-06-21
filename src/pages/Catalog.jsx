import { Link } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import aeronaut001 from '../../img/aeronaut001.jpg'
import carbonic001 from '../../img/carbonic001.jpg'
import orbiter001 from '../../img/orbiter001.jpg'
import diode001 from '../../img/diode001.jpg'

export default function Catalog() {
  const [aeronaut, carbonic, orbiter, diode] = fonts

  return (
    <div className="catalog-page">
      <div className="catalog-grid">
        {/* Aeronaut — 4 cols wide, landscape, row 1 */}
        <Link to="/catalog/aeronaut" className="catalog-card" style={{ gridColumn: '1 / 5', gridRow: 1 }}>
          <div className="catalog-card-img landscape" style={{ backgroundImage: `url(${aeronaut001})` }} />
          <div className="catalog-card-name">{aeronaut.displayName}</div>
        </Link>

        {/* Carbonic — 2 cols wide, portrait, row 1, cols 7–8 */}
        <Link to="/catalog/carbonic" className="catalog-card" style={{ gridColumn: '7 / 9', gridRow: 1 }}>
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${carbonic001})` }} />
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        {/* Orbiter — 2 cols wide, portrait, row 2, cols 5–6 */}
        <Link to="/catalog/orbiter" className="catalog-card" style={{ gridColumn: '5 / 7', gridRow: 2 }}>
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${orbiter001})` }} />
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        {/* Diode — 2 cols wide, portrait, row 2, cols 9–10 */}
        <Link to="/catalog/diode" className="catalog-card" style={{ gridColumn: '9 / 11', gridRow: 2 }}>
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${diode001})` }} />
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
