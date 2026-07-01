import { useEffect } from 'react'
import { waitUntilReady, waitForPending, hasFontduePending } from '../animUtils.js'

// Hold the enter animation until fontdue's font specimens have swapped from
// their Fallback face to the real one, then settle as usual — otherwise the
// specimen text visibly re-renders after the fade-in has finished.
async function waitForCartReady(el) {
  await waitForPending(el, hasFontduePending)
  await waitUntilReady(el)
}

async function animatePage(container) {
  if (!container || container.dataset.cartPage) return
  container.dataset.cartPage = 'loading'

  await waitForCartReady(container)

  if (!container.isConnected) return
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
