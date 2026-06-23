import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-brand">Place of Interest</span>
      <ul className="footer-links">
        <li><Link to="/license" className="footer-link">License</Link></li>
        <li><a href="https://www.instagram.com/poi.type/" className="footer-link footer-link--instagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><Link to="/newsletter" className="footer-link">Newsletter</Link></li>
        <li><Link to="/privacy" className="footer-link">Privacy</Link></li>
      </ul>
      <span className="footer-copy">© 2026</span>
    </footer>
  )
}
