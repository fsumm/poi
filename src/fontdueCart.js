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
}
