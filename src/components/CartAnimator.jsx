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

  await waitForCartReady(overlay)

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
