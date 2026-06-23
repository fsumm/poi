import { Route, Navigate } from 'react-router-dom'
import AnimatedRoutes from './components/AnimatedRoutes.jsx'
import CartAnimator from './components/CartAnimator.jsx'
import FontdueProvider from 'fontdue-js/FontdueProvider'
import StoreModal from 'fontdue-js/StoreModal'
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
import License from './pages/License.jsx'
import Privacy from './pages/Privacy.jsx'

const STORE_URL = 'https://store.poi.tf'

const STRIPE_APPEARANCE = {
  theme: 'flat',
  variables: {
    borderRadius: '999px',
    fontFamily: "'POI Orbiter', system-ui, -apple-system, sans-serif",
    fontWeightNormal: '600',
    fontWeightMedium: '600',
    fontWeightBold: '600',
    colorBackground: '#ededeb',
    colorText: '#171716',
    colorTextPlaceholder: '#989898',
    colorTextSecondary: '#171716',
    colorDanger: '#DD0000',
    colorSuccessText: '#00AA00',
    colorDangerText: '#DD0000',
    focusBoxShadow: '0 0 0 1px #1C1C1C',
    fontSizeBase: '12px',
    fontSmooth: 'always',
    gridRowSpacing: '6px',
    spacingUnit: '3px',
    accordionItemSpacing: '20px',
  },
  rules: {
    '.Tab': { border: 'none', borderRadius: '999px', boxShadow: 'none', outline: 'none' },
    '.Tab:hover': { border: 'none', backgroundColor: '#d8d8d6', boxShadow: 'none', outline: 'none' },
    '.Tab--selected,.Tab--selected:hover': { border: 'none', backgroundColor: '#1C1C1C', color: '#FFFFFF', boxShadow: 'none', outline: 'none' },
    '.TabIcon--selected': { fill: '#FFFFFF' },
    '.Label': { color: '#171716' },
    '.Input': { padding: '10px 16px' },
    '.Select': { padding: '10px 16px', backgroundImage: 'none', appearance: 'none' },
    '.CvcIllustration': { display: 'none' },
  },
}

export default function App() {
  return (
    <FontdueProvider url={STORE_URL} config={{ stripe: { appearance: STRIPE_APPEARANCE } }}>
      <StoreModal />
      <CartAnimator />
      <div className="app">
        <Nav />
        <main className="main">
          <AnimatedRoutes>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:fontId" element={<FontDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/trials" element={<Trials />} />
            <Route path="/license" element={<License />} />
            <Route path="/privacy" element={<Privacy />} />
          </AnimatedRoutes>
        </main>
        <Footer />
      </div>
    </FontdueProvider>
  )
}
