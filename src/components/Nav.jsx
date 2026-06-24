import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { openCart } from '../fontdueCart.js'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const navRef = useRef(null)
  const submenuRef = useRef(null)
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

  // Publish the open submenu's *actual* height as --submenu-h on <body> so the
  // nav's frosted backdrop and the sticky items below it can offset by exactly
  // the amount the bar grows. Measured (not a fixed guess) so the offset matches
  // the real content height rather than the max-height cap. 0 when closed.
  useEffect(() => {
    if (!catalogOpen || !submenuRef.current) {
      document.body.style.removeProperty('--submenu-h')
      return
    }
    const el = submenuRef.current
    const publish = (animate) => {
      if (animate) {
        // Commit the start value (0) with a forced reflow first so the dependent
        // `top`/`height` transitions have a distinct state to animate from —
        // otherwise they snap straight to the end.
        document.body.style.setProperty('--submenu-h', '0px')
        void document.body.offsetWidth // flush the 0 state
      }
      document.body.style.setProperty('--submenu-h', `${el.scrollHeight}px`)
    }
    publish(true)
    // If a webfont is still loading, the first measure used fallback metrics;
    // re-measure once fonts settle and ease to the corrected value (no flush).
    let cancelled = false
    document.fonts?.ready.then(() => { if (!cancelled) publish(false) })
    return () => {
      cancelled = true
      document.body.style.removeProperty('--submenu-h')
    }
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
          <ul className="nav-submenu" ref={submenuRef}>
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
