const SETTLE_IDLE = 80
const SETTLE_MAX  = 2000

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
  await document.fonts.ready
  await domSettle(el)
  if (document.fonts.status === 'loading') {
    await document.fonts.ready
    await raf2()
  }
}
