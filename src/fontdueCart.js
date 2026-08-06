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

function watchForClose() {
  // Poll until the overlay appears in the DOM, then watch for its removal
  let attempts = 0
  const poll = setInterval(() => {
    const overlay = document.querySelector('.store-modal__container__overlay')
    // Overlay not mounted yet (StoreModal lazy-loads on a fresh session) — keep
    // polling until it appears; only give up after the attempt budget runs out.
    if (!overlay) { if (++attempts > 40) clearInterval(poll); return }
    clearInterval(poll)

    // Repeated openCart calls (e.g. double clicks) each start a poll — never
    // install the listeners/wrapper twice on the same overlay.
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
