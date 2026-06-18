import { Routes, Route, Navigate } from 'react-router-dom'
import FontdueProvider from 'fontdue-js/FontdueProvider'
import 'fontdue-js/fontdue.css'
import './fontdue-theme.css'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import FontDetail from './pages/FontDetail.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Newsletter from './pages/Newsletter.jsx'
import Trials from './pages/Trials.jsx'

const STORE_URL = 'https://store.poi.tf'

export default function App() {
  return (
    <FontdueProvider url={STORE_URL}>
      <div className="app">
        <Nav />
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:fontId" element={<FontDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/trials" element={<Trials />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </FontdueProvider>
  )
}
