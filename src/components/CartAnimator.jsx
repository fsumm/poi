import { useEffect } from 'react'
import { waitUntilReady, waitForPending, hasFontduePending } from '../animUtils.js'

// Hold the enter animation until fontdue's font specimens have swapped from
// their Fallback face to the real one, then settle as usual — otherwise the
// specimen text visibly re-renders after the fade-in has finished.
async function waitForCartReady(el) {
  await waitForPending(el, hasFontduePending)
  await waitUntilReady(el)
}

// Index → product exit: mirrors the webpage exit stagger (0.3s fade, 40ms per
// item) before letting fontdue swap pages.
const EXIT_STEP = 40
const EXIT_DURATION = 300

// Fontdue swaps index → product in a single render, so to animate the catalog
// out first we intercept the click before React sees it, flip the index page
// (itself a store-modal page) to data-cart-page=exiting, then re-dispatch the
// click on the same button once the fade completes.
function setupIndexExit(overlay) {
  overlay.addEventListener('click', e => {
    const button = e.target.closest?.('.store-modal__index-item__button')
    if (!button) return
    if (overlay.dataset.cartExit === 'done') return
    if (overlay.dataset.cartExit === 'exiting') {
      // Swallow further clicks while the exit is playing
      e.preventDefault()
      e.stopPropagation()
      return
    }
    const page = button.closest('.store-modal__page__container')
    if (!page) return
    // Still loading — items are invisible, so an exit fade would only add lag
    if (page.dataset.cartPage === 'loading') return
    e.preventDefault()
    e.stopPropagation()

    overlay.dataset.cartExit = 'exiting'
    page.dataset.cartPage = 'exiting'
    const items = overlay.querySelectorAll('.store-modal__index-item__button')
    const wait = EXIT_DURATION + EXIT_STEP * Math.max(0, items.length - 1)
    setTimeout(() => {
      if (!overlay.isConnected) return
      overlay.dataset.cartExit = 'done'
      button.click()
      // If navigation didn't happen (index still mounted), restore the items
      setTimeout(() => {
        if (page.isConnected) {
          page.dataset.cartPage = 'entering'
          delete overlay.dataset.cartExit
        }
      }, 1000)
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

  // The first page's data loads before watchPageChanges is attached below, so
  // hide fontdue's "Loading..." fallback here too — both any already present and
  // one that appears while we wait for fonts.
  const hideFallbacks = () =>
    overlay.querySelectorAll('.store-modal__page__container').forEach(hideLoadingFallback)
  hideFallbacks()
  const openObs = new MutationObserver(hideFallbacks)
  openObs.observe(overlay, { childList: true, subtree: true })

  await waitForCartReady(overlay)

  openObs.disconnect()
  if (!overlay.isConnected) return

  overlay.classList.remove('cart-anim--loading')
  overlay.classList.add('cart-anim--entering')
  overlay.dataset.cartAnim = 'open'

  watchPageChanges(overlay)
  setupIndexExit(overlay)
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
