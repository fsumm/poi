import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Suppress the click that fires when the user clicks the window to focus it.
// Without this, a background click on e.g. a font tile immediately opens the cart.
;(function () {
  let blurred = false
  window.addEventListener('blur', () => { blurred = true })
  document.addEventListener('click', (e) => {
    if (blurred) {
      blurred = false
      e.stopPropagation()
      e.preventDefault()
    }
  }, true)
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/poi">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
