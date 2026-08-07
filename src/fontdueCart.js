let _store = null

function findStore() {
  const root = document.getElementById('root')
  const fiberKey = Object.keys(root).find(k => k.startsWith('__reactContainer'))
  if (!fiberKey) return null
  const queue = [root[fiberKey]]
  const visited = new Set()
  while (queue.length) {
    const f = queue.shift()
    if (!f || visited.has(f)) continue
    visited.add(f)
    if (f.memoizedProps?.store?.dispatch) return f.memoizedProps.store
    if (f.child) queue.push(f.child)
    if (f.sibling) queue.push(f.sibling)
  }
  return null
}

function animateClose(overlay, scrollTop) {
  const container = overlay.querySelector('.store-modal__container__container')
  if (!container) return
  // Contents arrive here already faded out (the CLOSE_CART intercept plays the
  // exit fade before React unmounts), so the panel slides out empty on purpose.
  container.dataset.closing = 'true'
  overlay.style.pointerEvents = 'none'
  // Re-append to body so the animation plays after React's removal
  document.body.appendChild(overlay)
  // Restore scroll position captured before React's re-render reset it
  container.scrollTop = scrollTop
  setTimeout(() => { if (document.body.contains(overlay)) overlay.remove() }, 280)
}

// Per-overlay close orchestration + fixed "Cart" toggle. Called by
// CartAnimator's mount observer for EVERY overlay appearance — including
// fontdue-internal opens (the Buy button dispatches with its own store
// reference, so an openCart-driven poll would never see those).
export function setupCartOverlay(overlay) {
  if (!_store) _store = findStore()
  if (!_store) return

  // Never install the listeners/wrapper twice on the same overlay
  if (overlay.dataset.cartWatch != null) return
  overlay.dataset.cartWatch = ''

  const container = overlay.querySelector('.store-modal__container__container')

  // Capture scrollTop BEFORE React re-renders on CLOSE_CART (re-render resets it to 0)
  let capturedScrollTop = 0
  let closeFadePlayed = false
  const originalDispatch = _store.dispatch.bind(_store)

  // Fade the modal contents out (mirroring the enter fade), then run fn.
  // Mirrors CartAnimator's exit stagger (0.3s fade + 40ms/child, CSS delays
  // cap at 8 children); nav chrome alone needs just the 0.3s.
  const fadeOutThen = fn => {
    closeFadePlayed = true
    capturedScrollTop = container?.scrollTop ?? 0
    // pointer-events: none below drops :hover — freeze the toggle's hovered
    // look so it doesn't flash unhovered under a stationary cursor while the
    // close animation plays.
    const toggle = overlay.querySelector('.poi-cart-toggle')
    if (toggle?.matches(':hover')) toggle.classList.add('poi-cart-toggle--hover')
    overlay.style.pointerEvents = 'none'
    overlay.dataset.cartNav = 'exiting'
    overlay.classList.add('cart-anim--closing')
    const page = [...overlay.querySelectorAll('.store-modal__page__container')]
      .find(p => p.style.display !== 'none')
    let wait = 300
    if (page && page.dataset.cartPage === 'entering') {
      page.dataset.cartPage = 'exiting'
      const count = Math.min(page.querySelectorAll('.store-modal__page__body > *').length, 8)
      wait = 300 + 40 * Math.max(0, count - 1)
    }
    setTimeout(fn, wait)
  }

  // Close gestures (background click, close button) are intercepted in the
  // capture phase and re-dispatched after the exit fade — fontdue's own
  // handlers hold a dispatch reference captured before the wrapper below was
  // installed, so their CLOSE_CART would bypass it and unmount mid-fade.
  // stopPropagation keeps the event from React's root-delegated handlers
  // (the same pattern setupNavExit uses for page swaps).
  overlay.addEventListener('click', e => {
    if (!e.target.closest?.('.store-modal__container__background') &&
        !e.target.closest?.('.poi-cart-toggle') &&
        !e.target.closest?.('.store-modal__container__close-button')) return
    e.preventDefault()
    e.stopPropagation()
    if (closeFadePlayed) return // exit fade already playing — swallow repeats
    capturedScrollTop = container?.scrollTop ?? 0
    if (overlay.dataset.cartAnim !== 'open') {
      // Still loading — nothing visible to fade, close immediately
      originalDispatch({ type: 'CLOSE_CART' })
      return
    }
    fadeOutThen(() => originalDispatch({ type: 'CLOSE_CART' }))
  }, true)

  // Fallback for CLOSE_CART routed through the store itself (e.g. Escape, if
  // the handler picked up the wrapped dispatch): capture scroll and fade
  // first when content is visible.
  _store.dispatch = function(action) {
    if (action.type === 'CLOSE_CART') {
      capturedScrollTop = container?.scrollTop ?? 0
      if (closeFadePlayed) return action
      if (overlay.dataset.cartAnim === 'open') {
        fadeOutThen(() => originalDispatch(action))
        return action
      }
    }
    return originalDispatch(action)
  }

  // Fixed "Cart" toggle replacing the panel's close button (hidden in
  // fontdue-theme): mounted on the overlay — fixed and untransformed —
  // directly over the nav cart button, so the label holds still while the
  // panel slides beneath it, mirroring the catalog submenu. Appending a
  // foreign child is safe: React removes the overlay wholesale on unmount
  // and never reconciles children it didn't create.
  const navBtn = document.querySelector('.nav-cart-btn')
  const placeToggle = () => {
    const toggle = overlay.querySelector('.poi-cart-toggle')
    if (!toggle || !navBtn) return
    const r = navBtn.getBoundingClientRect()
    toggle.style.left = `${r.left}px`
    toggle.style.top = `${r.top}px`
    toggle.style.height = `${r.height}px`
  }
  if (navBtn) {
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'poi-cart-toggle'
    toggle.textContent = 'Cart'
    // Inherit the nav button's live hover: browsers don't apply :hover to a
    // freshly inserted element until the next mouse move, so a toggle mounted
    // under a cursor that was hovering "Cart" would flash unhovered.
    if (navBtn.matches(':hover')) toggle.classList.add('poi-cart-toggle--hover')
    toggle.addEventListener('mouseleave', () => toggle.classList.remove('poi-cart-toggle--hover'))
    overlay.appendChild(toggle)
    placeToggle()
    window.addEventListener('resize', placeToggle)
  }

  let handled = false
  const mo = new MutationObserver(() => {
    if (handled || document.body.contains(overlay)) return
    handled = true
    _store.dispatch = originalDispatch
    window.removeEventListener('resize', placeToggle)
    mo.disconnect()
    animateClose(overlay, capturedScrollTop)
  })
  mo.observe(document.body, { childList: true, subtree: true })
}

export function openCart() {
  if (!_store) _store = findStore()
  if (!_store) return

  _store.dispatch({ type: 'OPEN_CART' })

  // StoreModal may still be suspended on first click — retry until it responds
  if (document.body.dataset.fontdueStoreModal !== 'open') {
    const interval = setInterval(() => {
      _store.dispatch({ type: 'OPEN_CART' })
      if (document.body.dataset.fontdueStoreModal === 'open') clearInterval(interval)
    }, 150)
    setTimeout(() => clearInterval(interval), 3000)
  }
  // Overlay setup (close orchestration, "Cart" toggle) is driven by
  // CartAnimator's mount observer via setupCartOverlay — no polling here.
}
