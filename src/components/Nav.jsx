import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { openCart } from '../fontdueCart.js'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const navRef = useRef(null)
  const close = () => {
    setMenuOpen(false)
    setCatalogOpen(false)
  }

  // The Catalog submenu is click-toggled on every viewport (clicking the label
  // opens/closes it rather than navigating). Closes on outside click or Escape.
  const onCatalogClick = (e) => {
    e.preventDefault()
    setCatalogOpen(v => !v)
  }

  // Flag the open submenu on <body> so its height (--submenu-h) is readable by
  // both the nav's frosted backdrop and the sticky items in the page below it.
  useEffect(() => {
    document.body.classList.toggle('catalog-submenu-open', catalogOpen)
    return () => document.body.classList.remove('catalog-submenu-open')
  }, [catalogOpen])

  useEffect(() => {
    if (!catalogOpen) return
    const onDocPointer = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setCatalogOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setCatalogOpen(false) }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [catalogOpen])

  return (
    <nav ref={navRef} className={`nav${menuOpen ? ' nav--open' : ''}`}>
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
          <NavLink to="/catalog" onClick={onCatalogClick} aria-haspopup="true" aria-expanded={catalogOpen} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Catalog</NavLink>
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
