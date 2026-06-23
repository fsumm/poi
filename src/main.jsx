import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Stop the browser from restoring (snapping) scroll on back/forward traversal.
// AnimatedRoutes keeps the outgoing page mounted through its exit animation, so
// an auto-restored scroll jump would be visible on the old page before it fades.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Suppress transitions while the viewport is actively resizing — otherwise the
// nav (and any other breakpoint-dependent styles) animate the jump as the
// window crosses a media-query boundary. The flag drives a transition:none rule.
let resizeTimer
window.addEventListener('resize', () => {
  document.documentElement.setAttribute('data-resizing', '')
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => document.documentElement.removeAttribute('data-resizing'), 150)
}, { passive: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/poi">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
