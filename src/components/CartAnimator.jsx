import { useEffect } from 'react'
import { waitUntilReady } from '../animUtils.js'

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

  await waitUntilReady(container)

  if (!container.isConnected) return
  // Don't clobber an exit that started while this page was still settling
  if (container.dataset.cartPage !== 'loading') return
  container.dataset.cartPage = 'entering'
}

function watchPageChanges(overlay) {
  const body = overlay.querySelector('.store-modal__container__body')
  if (!body) return

  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.classList.contains('store-modal__page__container')) {
          animatePage(node)
        }
      }
    }
  })
  obs.observe(body, { childList: true })
}

async function handleOpen(overlay) {
  if (overlay.dataset.cartAnim) return
  overlay.dataset.cartAnim = 'loading'
  overlay.classList.add('cart-anim--loading')

  await waitUntilReady(overlay)

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
