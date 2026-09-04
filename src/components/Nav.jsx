import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { fonts } from '../data/fonts.js'
import { openCart } from '../fontdueCart.js'

// The three top-level sections, each with its own submenu. `to` is where the
// label itself navigates on desktop; `isActive` decides when the label is
// highlighted, since a section stays current across all of its sub-pages
// (Catalog covers "/" and every font detail page, License covers the overview,
// trials and the EULA).
const MENUS = [
  {
    id: 'catalog',
    label: 'Catalog',
    to: '/',
    isActive: (p) => p === '/' || p.startsWith('/catalog'),
    // The catalog submenu is still the font list, generated from the data.
    items: fonts.map((font) => ({ to: `/catalog/${font.id}`, label: font.displayName })),
  },
  {
    id: 'about',
    label: 'About',
    to: '/about',
    isActive: (p) => p === '/about' || p === '/newsletter',
    items: [
      { to: '/about', label: 'Studio' },
      { to: '/newsletter', label: 'Newsletter' },
    ],
  },
  {
    id: 'license',
    label: 'License',
    to: '/license',
    isActive: (p) => p === '/license' || p === '/trials' || p === '/eula',
    items: [
      { to: '/license', label: 'Overview' },
      { to: '/trials', label: 'Trials' },
      { to: '/eula', label: 'EULA' },
    ],
  },
]

export default function Nav() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  // id of the section whose submenu is open, or null. At most one is ever open.
  const [openId, setOpenId] = useState(null)
  const navRef = useRef(null)
  // Whether a submenu was already open on the previous commit — drives whether
  // the backdrop animates up from 0 or eases across from the outgoing panel's
  // height (see the measurement effect below).
  const wasOpenRef = useRef(false)
  // Points at the *open* submenu's <ul> (the closed ones don't claim the ref),
  // so the measurement and hover-band effects below always read the right panel.
  const submenuRef = useRef(null)
  const close = () => {
    setMenuOpen(false)
    setOpenId(null)
  }

  // Desktop (no hamburger, >580px): a submenu opens on hover of its top-level
  // item and the label click navigates like a normal link. Mobile keeps the
  // tap-to-toggle behavior (tapping the label opens/closes the submenu rather
  // than navigating). Closes on outside click or Escape.
  const isDesktop = () => window.matchMedia('(min-width: 581px)').matches
  const onLabelClick = (id) => (e) => {
    if (isDesktop()) {
      close()
      return
    }
    e.preventDefault()
    setOpenId((cur) => (cur === id ? null : id))
  }
  const onItemEnter = (id) => () => { if (isDesktop()) setOpenId(id) }

  // While open on desktop, the panel behaves as a full-width band: moving the
  // cursor left/right of the item names keeps it open; it only closes when the
  // cursor leaves vertically — up into the nav bar or down into the page
  // content. Tracked via document mousemove because mouseleave on the (narrow)
  // nav item would also fire on horizontal exits.
  useEffect(() => {
    if (!openId || !isDesktop()) return
    const onMove = (e) => {
      const sub = submenuRef.current
      if (!sub) return
      // Bail while the cursor is over ANY top-level item that owns a submenu,
      // not just the open one's. Sliding sideways from one label to the next
      // puts the cursor in the bar, above the open panel — which reads as
      // "left vertically" and would close the menu. Because the browser fires
      // the sibling's mouseover *before* this mousemove, that close would land
      // in the same React batch as the sibling's onMouseEnter and win, so the
      // next menu would never open. Bailing here hands the switch off to that
      // item's own mouseenter instead.
      if (e.target instanceof Element && e.target.closest('.nav-item--has-submenu')) return
      const band = sub.getBoundingClientRect() // live panel box; top = bar bottom
      if (e.clientY >= band.top && e.clientY <= band.bottom) return
      setOpenId(null)
    }
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [openId])

  // Publish the open submenu's *actual* height as --submenu-h on <body> so the
  // nav's white backdrop can grow by exactly the panel's height (the submenu
  // is absolutely positioned and overlays the page content). Measured (not a
  // fixed guess) so the backdrop matches the real content height rather than
  // the max-height cap — which matters more now that the three sections have
  // different item counts. 0 when closed.
  useEffect(() => {
    if (!openId || !submenuRef.current) {
      document.body.style.removeProperty('--submenu-h')
      wasOpenRef.current = false
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
    // Flush through 0 only when opening from closed; switching between menus
    // eases from the outgoing height straight to the new one.
    publish(!wasOpenRef.current)
    wasOpenRef.current = true
    // If a webfont is still loading, the first measure used fallback metrics;
    // re-measure once fonts settle and ease to the corrected value (no flush).
    let cancelled = false
    document.fonts?.ready.then(() => { if (!cancelled) publish(false) })
    return () => {
      cancelled = true
      document.body.style.removeProperty('--submenu-h')
    }
  }, [openId])

  // Dismiss on outside press or Escape. This runs for the mobile dropdown as
  // well as an open submenu, and closes BOTH — dismissing the submenu while
  // leaving the menu itself open reads as the gesture having failed. touchstart
  // alongside mousedown so a tap dismisses on contact rather than waiting for
  // the browser's synthesised mouse event; close() is idempotent, so the pair
  // firing for one tap is harmless.
  useEffect(() => {
    if (!menuOpen && !openId) return
    const onDocPointer = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) close()
    }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('touchstart', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('touchstart', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, openId])

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
        {MENUS.map((menu) => {
          const open = openId === menu.id
          return (
            <li
              key={menu.id}
              className={`nav-item nav-item--has-submenu${open ? ' nav-item--submenu-open' : ''}`}
              onMouseEnter={onItemEnter(menu.id)}
            >
              <NavLink
                to={menu.to}
                onClick={onLabelClick(menu.id)}
                aria-haspopup="true"
                aria-expanded={open}
                className={'nav-link' + (menu.isActive(location.pathname) ? ' active' : '')}
              >
                {menu.label}
              </NavLink>
              {/* Only the open panel claims the ref — the measurement and
                  hover-band effects above read exactly one element. */}
              <ul className="nav-submenu" ref={open ? submenuRef : null}>
                {menu.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} onClick={close} end className={({ isActive }) => 'nav-link nav-sublink' + (isActive ? ' active' : '')}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
      <div className="nav-cart">
        <button className="nav-cart-btn" onClick={openCart}>Cart</button>
      </div>
    </nav>
  )
}
