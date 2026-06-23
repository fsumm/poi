import { useRef, useState } from 'react'

export default function CopyEmailButton({ email = 'hello@poi.tf' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Fallback for browsers without the async clipboard API
      const ta = document.createElement('textarea')
      ta.value = email
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      className={`btn btn-dark copy-email${copied ? ' is-copied' : ''}`}
      onClick={handleCopy}
    >
      <span className="copy-email-tip" aria-hidden="true">
        {copied ? 'Copied' : 'Copy'}
      </span>
      {email}
    </button>
  )
}
