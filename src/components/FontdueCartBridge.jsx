import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setCartDispatch } from '../fontdueCart.js'

export default function FontdueCartBridge() {
  const dispatch = useDispatch()
  useEffect(() => {
    setCartDispatch(dispatch)
    return () => setCartDispatch(null)
  }, [dispatch])
  return null
}
