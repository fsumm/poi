import { NavLink } from 'react-router-dom'

const STORE_URL = 'https://store.poi.tf'

export default function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo" aria-label="Place of Interest">
        ⌘
      </NavLink>
      <ul className="nav-links">
        <li><NavLink to="/catalog" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Catalog</NavLink></li>
        <li><NavLink to="/contact" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Contact</NavLink></li>
        <li><NavLink to="/about" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>About</NavLink></li>
        <li><NavLink to="/trials" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Trials</NavLink></li>
      </ul>
      <a href={`${STORE_URL}/cart`} className="nav-cart" target="_blank" rel="noopener noreferrer">
        Cart
      </a>
    </nav>
  )
}
