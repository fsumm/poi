import { Link } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      {/* Decorative: the site name is already the logo in the nav and the H1 on
          the landing page, so this repeat is hidden from assistive tech. */}
      <Wordmark className="footer-wordmark" aria-hidden="true" />
      <div className="footer-bottom">
        <span className="footer-copy">© 2026</span>
        <ul className="footer-links">
            <li><a href="https://www.instagram.com/poi.type/" className="footer-link footer-link--instagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li><Link to="/newsletter" className="footer-link">Newsletter</Link></li>
          <li><Link to="/privacy" className="footer-link">Privacy</Link></li>
        </ul>
      </div>
    </footer>
  )
}
