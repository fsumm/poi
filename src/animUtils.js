const SETTLE_IDLE = 80
const SETTLE_MAX  = 2000
// Async content (e.g. the type tester, which fetches data then loads its
// webfont) marks itself with [data-anim-pending] while it is still loading.
// Give it longer than the generic settle window before falling through.
const PENDING_MAX = 4000

// Resolves once no [data-anim-pending] elements remain in the subtree, so the
// enter animation doesn't start while content is still rendering in.
export function waitForPending(el) {
  return new Promise(resolve => {
    if (!el) return resolve()
    const settled = () => el.querySelector('[data-anim-pending]') == null
    if (settled()) return resolve()
    const done = () => { observer.disconnect(); clearTimeout(timer); resolve() }
    const observer = new MutationObserver(() => { if (settled()) done() })
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
