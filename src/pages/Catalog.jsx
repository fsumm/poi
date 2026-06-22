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
        {/* Placement lives in CSS (.catalog-grid > nth-child) so the
            responsive breakpoints can remap each card. */}
        <Link to="/catalog/aeronaut" className="catalog-card">
          <div className="catalog-card-img landscape" style={{ backgroundImage: `url(${aeronaut001})` }} />
          <div className="catalog-card-name">{aeronaut.displayName}</div>
        </Link>

        <Link to="/catalog/carbonic" className="catalog-card">
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${carbonic001})` }} />
          <div className="catalog-card-name">{carbonic.displayName}</div>
        </Link>

        <Link to="/catalog/orbiter" className="catalog-card">
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${orbiter001})` }} />
          <div className="catalog-card-name">{orbiter.displayName}</div>
        </Link>

        <Link to="/catalog/diode" className="catalog-card">
          <div className="catalog-card-img portrait" style={{ backgroundImage: `url(${diode001})` }} />
          <div className="catalog-card-name">{diode.displayName}</div>
        </Link>
      </div>
    </div>
  )
}
