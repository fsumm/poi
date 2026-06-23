import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { openCart } from '../fontdueCart.js'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const close = () => {
    setMenuOpen(false)
    setCatalogOpen(false)
  }

  // On the mobile dropdown (≤580px) tapping "Catalog" reveals the submenu
  // instead of navigating. On desktop/tablet the submenu is hover-driven, so
  // the link behaves normally.
  const onCatalogClick = (e) => {
    if (window.matchMedia('(max-width: 580px)').matches) {
      e.preventDefault()
      setCatalogOpen(v => !v)
    } else {
      close()
    }
  }

  return (
    <nav className={`nav${menuOpen ? ' nav--open' : ''}`}>
      <NavLink to="/" className="nav-logo" aria-label="Place of Interest" onClick={close}>
        ⌘
      </NavLink>
      <button
        className="nav-toggle"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(v => !v)}
      >
        Menu
      </button>
      <ul className="nav-links">
        <li className={`nav-item nav-item--has-submenu${catalogOpen ? ' nav-item--submenu-open' : ''}`}>
          <NavLink to="/catalog" onClick={onCatalogClick} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Catalog</NavLink>
          <ul className="nav-submenu">
            {fonts.map(font => (
              <li key={font.id}>
                <NavLink to={`/catalog/${font.id}`} onClick={close} className={({ isActive }) => 'nav-link nav-sublink' + (isActive ? ' active' : '')}>
                  {font.displayName}
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
        <li><NavLink to="/contact" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Contact</NavLink></li>
        <li><NavLink to="/about" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>About</NavLink></li>
        <li><NavLink to="/trials" onClick={close} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Trials</NavLink></li>
      </ul>
      <div className="nav-cart">
        <button className="nav-cart-btn" onClick={openCart}>Cart</button>
      </div>
    </nav>
  )
}
