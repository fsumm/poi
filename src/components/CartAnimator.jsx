import { useEffect } from 'react'
import { waitUntilReady, waitForPending, hasFontduePending } from '../animUtils.js'
import { setupCartOverlay } from '../fontdueCart.js'

// Hold the enter animation until fontdue's font specimens have swapped from
// their Fallback face to the real one, then settle as usual — otherwise the
// specimen text visibly re-renders after the fade-in has finished.
async function waitForCartReady(el) {
  await waitForPending(el, hasFontduePending)
  await waitUntilReady(el)
}

// Page exit: mirrors the webpage exit stagger (0.3s fade, 40ms per item)
// before letting fontdue swap pages.
const EXIT_STEP = 40
const EXIT_DURATION = 300

// The exiting CSS defines staggered delays for the first 8 page-body children
const EXIT_STAGGER_MAX = 8

// In-modal controls that navigate to another page of the store modal
const NAV_SELECTORS = [
  '.store-modal__index-item__button',                  // catalog items
  '.store-modal__container__back-button',              // All collections / Buying options
  '.store-modal__container__cart-button',              // Items in cart
  '.store-modal__product-summary__add-to-cart-button', // Add to cart
  '.store-modal__cart__button',                        // Continue → checkout
].join(', ')

// Fade the nav chrome (back button, title, items-in-cart) back in after a page
// exit, then drop the attribute so the rest state keeps fontdue's own styles.
function navEnter(overlay) {
  if (overlay.dataset.cartNav !== 'exiting') return
  overlay.dataset.cartNav = 'entering'
  setTimeout(() => {
    if (overlay.dataset.cartNav === 'entering') delete overlay.dataset.cartNav
  }, 600)
}

// Fontdue swaps pages in a single render, so to animate the current page out
// first we intercept navigation clicks before React sees them, flip the page
// to data-cart-page=exiting, then re-dispatch the click on the same button
// once the fade completes.
function setupNavExit(overlay) {
  overlay.addEventListener('click', e => {
    const button = e.target.closest?.(NAV_SELECTORS)
    if (!button || button.disabled) return
    if (overlay.dataset.cartExit === 'done') return
    if (overlay.dataset.cartExit === 'exiting') {
      // Swallow further clicks while the exit is playing
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // The cart button is a no-op while the cart page is already showing
    if (overlay.dataset.route === 'cart' &&
        button.matches('.store-modal__container__cart-button')) return
    // The current page (skip fontdue's display:none "Loading..." fallback)
    const page = [...overlay.querySelectorAll('.store-modal__page__container')]
      .find(p => p.style.display !== 'none')
    if (!page) return
    // Still loading — content is invisible, so an exit fade would only add lag
    if (page.dataset.cartPage === 'loading') return
    // Continue (checkout) validates required fields synchronously — with a
    // blank one the click just renders errors, so don't play the exit for it
    if (button.matches('.store-modal__cart__button')) {
      const blank = [...page.querySelectorAll('input[type=text], input[type=email], select')]
        .some(el => el.offsetParent !== null && !el.value)
      if (blank) return
    }
    e.preventDefault()
    e.stopPropagation()

    overlay.dataset.cartExit = 'exiting'
    overlay.dataset.cartNav = 'exiting'
    page.dataset.cartPage = 'exiting'
    const count = Math.min(
      page.querySelectorAll('.store-modal__page__body > *').length,
      EXIT_STAGGER_MAX
    )
    const wait = EXIT_DURATION + EXIT_STEP * Math.max(0, count - 1)
    setTimeout(() => {
      if (!overlay.isConnected) return
      overlay.dataset.cartExit = 'done'
      const errsBefore = page.querySelectorAll('[class*="error"]').length
      button.click()
      // Checkout creation is a server round-trip, so give it longer before
      // concluding navigation failed; everything else swaps in one render.
      const maxWait = button.matches('.store-modal__cart__button') ? 3000 : 1000
      // If navigation didn't happen (page still mounted), restore it — right
      // away if fontdue rendered validation errors, else after maxWait.
      const started = Date.now()
      const check = () => {
        if (!page.isConnected) {
          // Navigated. Views without a page container (checkout) never reach
          // animatePage, so clear the pass-through flag here as well.
          clearInterval(poll)
          delete overlay.dataset.cartExit
          navEnter(overlay)
          return
        }
        const failed = page.querySelectorAll('[class*="error"]').length > errsBefore
        if (failed || Date.now() - started >= maxWait) {
          clearInterval(poll)
          page.dataset.cartPage = 'entering'
          delete overlay.dataset.cartExit
          navEnter(overlay)
        }
      }
      const poll = setInterval(check, 250)
      // Normal navigations swap synchronously on the re-click — check now so
      // the nav re-enters together with the new page instead of a tick later
      check()
    }, wait)
  }, true)
}

async function animatePage(container) {
  if (!container || container.dataset.cartPage) return
  container.dataset.cartPage = 'loading'

  const overlay = container.closest('.store-modal__container__overlay')
  if (overlay) delete overlay.dataset.cartExit

  await waitForCartReady(container)

  if (!container.isConnected) return
  // Don't clobber an exit that started while this page was still settling
  if (container.dataset.cartPage !== 'loading') return
  container.dataset.cartPage = 'entering'
}

// fontdue's Suspense fallback ("Loading...") renders the same page markup as a
// real page, but its body holds only a text node — no element children. Hide it
// so it never flashes; returns true when the node was the fallback so callers
// can skip the enter animation for it.
function hideLoadingFallback(node) {
  const pageBody = node.querySelector?.('.store-modal__page__body')
  if (pageBody && pageBody.children.length === 0) {
    node.style.display = 'none'
    return true
  }
  return false
}

function watchPageChanges(overlay) {
  const body = overlay.querySelector('.store-modal__container__body')
  if (!body) return

  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.classList.contains('store-modal__page__container')) {
          if (hideLoadingFallback(node)) continue
          animatePage(node)
        }
      }
    }
  })
  obs.observe(body, { childList: true })
}

// The panel slides in (slideIn, 300ms) on open, sweeping its contents under a
// stationary cursor and latching the cart button's :hover. Mark the overlay for
// the duration of that slide so CSS can suppress the button's hit-testing.
function suppressHoverDuringSlide(overlay) {
  overlay.dataset.cartOpening = ''
  const clear = () => delete overlay.dataset.cartOpening
  const panel = overlay.querySelector('.store-modal__container__container')
  if (panel) {
    const onEnd = e => {
      if (e.target !== panel || e.animationName !== 'slideIn') return
      panel.removeEventListener('animationend', onEnd)
      clear()
    }
    panel.addEventListener('animationend', onEnd)
  }
  // Fallback if the slide is absent/interrupted (e.g. reduced motion, remount).
  setTimeout(clear, 400)
}

async function handleOpen(overlay) {
  if (overlay.dataset.cartAnim) return
  overlay.dataset.cartAnim = 'loading'
  overlay.classList.add('cart-anim--loading')
  suppressHoverDuringSlide(overlay)
  // Close orchestration + the fixed "Cart" toggle — from here (not openCart)
  // so fontdue-internal opens (the Buy button) are covered too.
  setupCartOverlay(overlay)

  // The first page's data loads before watchPageChanges is attached below, so
  // sweep here too — both anything already present and whatever appears while
  // we wait for fonts. Fontdue's "Loading..." fallback is hidden; real pages
  // get the same staggered fade as later swaps (previously the first page
  // popped in with the panel instead of fading).
  const sweepPages = () =>
    overlay.querySelectorAll('.store-modal__page__container').forEach(node => {
      if (!hideLoadingFallback(node)) animatePage(node)
    })
  sweepPages()
  const openObs = new MutationObserver(sweepPages)
  openObs.observe(overlay, { childList: true, subtree: true })

  await waitForCartReady(overlay)

  openObs.disconnect()
  // Records pending at disconnect are dropped — sweep once more so a page
  // that mounted as the observer wound down (fast navigation while loading)
  // is still animated before watchPageChanges takes over below.
  sweepPages()
  if (!overlay.isConnected) return

  overlay.classList.remove('cart-anim--loading')
  overlay.classList.add('cart-anim--entering')
  overlay.dataset.cartAnim = 'open'

  watchPageChanges(overlay)
  setupNavExit(overlay)
}

export default function CartAnimator() {
  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue
          const overlay = node.classList?.contains('store-modal__container__overlay')
            ? node
            : node.querySelector?.('.store-modal__container__overlay')
          if (overlay) handleOpen(overlay)
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    const existing = document.querySelector('.store-modal__container__overlay')
    if (existing) handleOpen(existing)

    return () => observer.disconnect()
  }, [])

  return null
}
