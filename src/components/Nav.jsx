import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { openCart } from '../fontdueCart.js'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <nav className={`nav${menuOpen ? ' nav--open' : ''}`}>
      <NavLink to="/" className="nav-logo" aria-label="Place of Interest" onClick={close}>
        ⌘
      </NavLink>
      <ul className="nav-links">
        <li><NavLink to="/catalog" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Catalog</NavLink></li>
        <li><NavLink to="/contact" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Contact</NavLink></li>
        <li><NavLink to="/about" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>About</NavLink></li>
        <li><NavLink to="/trials" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Trials</NavLink></li>
      </ul>
      <div className="nav-cart">
        <button className="nav-cart-btn" onClick={openCart}>Cart</button>
      </div>
      <button
        className="nav-toggle"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(v => !v)}
      >
        <span />
        <span />
      </button>
    </nav>
  )
}
