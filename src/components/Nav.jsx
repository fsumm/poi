import { NavLink } from 'react-router-dom'
import { openCart } from '../fontdueCart.js'

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
      <div className="nav-cart">
        <button className="nav-cart-btn" onClick={openCart}>Cart</button>
      </div>
    </nav>
  )
}
