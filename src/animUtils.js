const SETTLE_IDLE = 80
const SETTLE_MAX  = 2000
// Async content (e.g. the type tester, which fetches data then loads its
// webfont) marks itself with [data-anim-pending] while it is still loading.
// Give it longer than the generic settle window before falling through.
const PENDING_MAX = 4000

// Default pending marker: async content (type tester etc.) tags itself with
// [data-anim-pending] while loading.
const hasAnimPending = el => el.querySelector('[data-anim-pending]') != null

// fontdue's useFont renders font specimens with inline `font-family: Fallback`
// while the real FontFace is still loading, then swaps to `"<Real>", Fallback`.
// The bare `font-family: Fallback` substring therefore appears only while a
// specimen is still unstyled — the cart-modal equivalent of [data-anim-pending].
export const hasFontduePending = el => el.querySelector('[style*="font-family: Fallback"]') != null

// Resolves once nothing in the subtree is still rendering in, so the enter
// animation doesn't start mid-load. `isPending` reports whether content is still
// pending; defaults to the [data-anim-pending] marker.
export function waitForPending(el, isPending = hasAnimPending) {
  return new Promise(resolve => {
    if (!el) return resolve()
    if (!isPending(el)) return resolve()
    const done = () => { observer.disconnect(); clearTimeout(timer); resolve() }
    const observer = new MutationObserver(() => { if (!isPending(el)) done() })
    observer.observe(el, { subtree: true, childList: true, attributes: true })
    const timer = setTimeout(done, PENDING_MAX)
  })
}

export function domSettle(el) {
  return new Promise(resolve => {
    let timer = null
    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { observer.disconnect(); resolve() }, SETTLE_IDLE)
    }
    const observer = new MutationObserver(resetTimer)
    observer.observe(el, { subtree: true, childList: true, characterData: true, attributes: true })
    resetTimer()
    setTimeout(() => { observer.disconnect(); resolve() }, SETTLE_MAX)
  })
}

export const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

export async function waitUntilReady(el) {
  // Wait for async content (type tester) to render before fonts/settle, since
  // its webfont only starts loading once its data fetch resolves.
  await waitForPending(el)
  await document.fonts.ready
  await domSettle(el)
  if (document.fonts.status === 'loading') {
    await document.fonts.ready
    await raf2()
  }
}
