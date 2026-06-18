import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-brand">Place of Interest</span>
      <ul className="footer-links">
        <li><a href="https://store.poi.tf/pages/license" className="footer-link" target="_blank" rel="noopener noreferrer">License</a></li>
        <li><a href="https://instagram.com/placeofinterest.tf" className="footer-link" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><Link to="/newsletter" className="footer-link">Newsletter</Link></li>
        <li><a href="https://store.poi.tf/pages/legal" className="footer-link" target="_blank" rel="noopener noreferrer">Legal</a></li>
      </ul>
      <span className="footer-copy">© 2026</span>
    </footer>
  )
}
