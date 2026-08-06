import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { openCart } from '../fontdueCart.js'

export default function Nav() {
  const location = useLocation()
  // Catalog now lives at "/", with font detail pages under "/catalog/:id".
  // Highlight the Catalog label on the home page and any font detail page.
  const catalogActive = location.pathname === '/' || location.pathname.startsWith('/catalog')
  const [menuOpen, setMenuOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const navRef = useRef(null)
  const submenuRef = useRef(null)
  const close = () => {
    setMenuOpen(false)
    setCatalogOpen(false)
  }

  // Desktop (no hamburger, >580px): the submenu opens on hover of the Catalog
  // item and the label click navigates like a normal link. Mobile keeps the
  // tap-to-toggle behavior (tapping the label opens/closes the submenu rather
  // than navigating). Closes on outside click or Escape.
  const isDesktop = () => window.matchMedia('(min-width: 581px)').matches
  const onCatalogClick = (e) => {
    if (isDesktop()) {
      close()
      return
    }
    e.preventDefault()
    setCatalogOpen(v => !v)
  }
  const onCatalogEnter = () => { if (isDesktop()) setCatalogOpen(true) }

  // While open on desktop, the panel behaves as a full-width band: moving the
  // cursor left/right of the item names keeps it open; it only closes when the
  // cursor leaves vertically — up into the nav bar (unless it's over the
  // Catalog item itself) or down into the page content. Tracked via document
  // mousemove because mouseleave on the (narrow) Catalog item would also fire
  // on horizontal exits.
  useEffect(() => {
    if (!catalogOpen || !isDesktop()) return
    const onMove = (e) => {
      const sub = submenuRef.current
      if (!sub) return
      if (sub.closest('.nav-item--has-submenu')?.contains(e.target)) return
      const band = sub.getBoundingClientRect() // live panel box; top = bar bottom
      if (e.clientY >= band.top && e.clientY <= band.bottom) return
      setCatalogOpen(false)
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [catalogOpen])

  // Publish the open submenu's *actual* height as --submenu-h on <body> so the
  // nav's white backdrop can grow by exactly the panel's height (the submenu
  // is absolutely positioned and overlays the page content). Measured (not a
  // fixed guess) so the backdrop matches the real content height rather than
  // the max-height cap. 0 when closed.
  useEffect(() => {
    if (!catalogOpen || !submenuRef.current) {
      document.body.style.removeProperty('--submenu-h')
      return
    }
    const el = submenuRef.current
    // The submenu uses overflow-y: clip (not a scroll container), so scrollHeight
    // can't be trusted for the full content height. Sum the items' offsetHeights
    // plus the ::after bottom spacer instead — offsetHeight ignores the items'
    // fade-in transform and the max-height clamp, both of which would skew a
    // getBoundingClientRect/scrollHeight measurement at open time.
    const measure = () => {
      let h = 0
      // getBoundingClientRect().height is fractional and unaffected by the items'
      // translateY fade (translate doesn't change height), so it sums precisely.
      el.querySelectorAll(':scope > li').forEach((li) => { h += li.getBoundingClientRect().height })
      h += parseFloat(getComputedStyle(el, '::after').height) || 0
      return Math.round(h)
    }
    const publish = (animate) => {
      if (animate) {
        // Commit the start value (0) with a forced reflow first so the backdrop's
        // dependent `height` transition has a distinct state to animate from —
        // otherwise it snaps straight to the end.
        document.body.style.setProperty('--submenu-h', '0px')
        void document.body.offsetWidth // flush the 0 state
      }
      document.body.style.setProperty('--submenu-h', `${measure()}px`)
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
      <div className="nav-logo">
        <NavLink to="/" className="nav-logo-link" aria-label="Place of Interest" onClick={close}>
          ⌘
        </NavLink>
      </div>
      <button
        className="nav-toggle"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(v => !v)}
      >
        Menu
      </button>
      <ul className="nav-links">
        <li
          className={`nav-item nav-item--has-submenu${catalogOpen ? ' nav-item--submenu-open' : ''}`}
          onMouseEnter={onCatalogEnter}
        >
          <NavLink to="/" onClick={onCatalogClick} aria-haspopup="true" aria-expanded={catalogOpen} className={'nav-link' + (catalogActive ? ' active' : '')}>Catalog</NavLink>
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
