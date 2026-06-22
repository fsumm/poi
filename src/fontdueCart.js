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
  // If fonts were still loading when the user closed, snap content visible so
  // the slide-out animation doesn't play with an empty-looking panel.
  if (overlay.classList.contains('cart-anim--loading')) {
    overlay.classList.remove('cart-anim--loading')
    overlay.classList.add('cart-anim--entering')
  }
  container.dataset.closing = 'true'
  overlay.style.pointerEvents = 'none'
  // Re-append to body so the animation plays after React's removal
  document.body.appendChild(overlay)
  // Restore scroll position captured before React's re-render reset it
  container.scrollTop = scrollTop
  setTimeout(() => { if (document.body.contains(overlay)) overlay.remove() }, 280)
}

function watchForClose() {
  // Poll until the overlay appears in the DOM, then watch for its removal
  let attempts = 0
  const poll = setInterval(() => {
    const overlay = document.querySelector('.store-modal__container__overlay')
    // Overlay not mounted yet (StoreModal lazy-loads on a fresh session) — keep
    // polling until it appears; only give up after the attempt budget runs out.
    if (!overlay) { if (++attempts > 40) clearInterval(poll); return }
    clearInterval(poll)

    const container = overlay.querySelector('.store-modal__container__container')

    // Close when clicking the transparent background (outside the panel)
    const bg = overlay.querySelector('.store-modal__container__background')
    if (bg) bg.addEventListener('click', () => _store?.dispatch({ type: 'CLOSE_CART' }), { once: true })

    // Capture scrollTop BEFORE React re-renders on CLOSE_CART (re-render resets it to 0)
    let capturedScrollTop = 0
    const originalDispatch = _store.dispatch.bind(_store)
    _store.dispatch = function(action) {
      if (action.type === 'CLOSE_CART') {
        capturedScrollTop = container?.scrollTop ?? 0
      }
      return originalDispatch(action)
    }

    let handled = false
    const mo = new MutationObserver(() => {
      if (handled || document.body.contains(overlay)) return
      handled = true
      _store.dispatch = originalDispatch
      mo.disconnect()
      animateClose(overlay, capturedScrollTop)
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }, 50)
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

  watchForClose()
}
