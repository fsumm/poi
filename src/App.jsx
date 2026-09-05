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
import Newsletter from './pages/Newsletter.jsx'
import Trials from './pages/Trials.jsx'
import License from './pages/License.jsx'
import Eula from './pages/Eula.jsx'
import Privacy from './pages/Privacy.jsx'

const STORE_URL = 'https://store.poi.tf'

// Stripe renders the licensee address fields (and the payment step) inside a
// cross-origin iframe, so fontdue-theme.css can't reach them — this is the only
// way to keep them consistent with the drawer. Mirrors the text-field rules
// there: Gray 4 label, transparent field, Gray 6 underline (drawn as an inset
// box-shadow, which the appearance API supports on every class), and Gray 7
// fills at --radius-ui for the selects.
const STRIPE_APPEARANCE = {
  theme: 'flat',
  variables: {
    borderRadius: '6px',
    // Fontdue is what actually loads a face into the iframe: it turns the
    // store's UI Font setting into a Stripe CustomFontSource named
    // `cssFamily + " " + name` — "POI Orbiter SemiBold" — so the family has to
    // be spelled that way here or it resolves to nothing. It registers that one
    // face at weight 400 (hardcoded in StripeProvider, which never reads the
    // separate uiFontStyleBold slot), so the weights stay at 400: asking for
    // 600 would synthesise bold on top of an already-semibold face.
    fontFamily: "'POI Orbiter SemiBold', system-ui, -apple-system, sans-serif",
    fontWeightLight: '400',
    fontWeightNormal: '400',
    fontWeightMedium: '400',
    fontWeightBold: '400',
    colorBackground: '#2b2b29',
    colorText: '#ffffff',
    colorTextPlaceholder: 'transparent',
    colorTextSecondary: '#a6a6a4',
    colorPrimary: '#2e5bff',
    colorIcon: '#a6a6a4',
    colorDanger: '#FF2A46',
    colorSuccessText: '#2e5bff',
    colorDangerText: '#FF2A46',
    focusBoxShadow: 'none',
    fontSizeBase: '16px',
    fontSmooth: 'always',
    gridRowSpacing: '18px',
    spacingUnit: '3px',
    accordionItemSpacing: '20px',
  },
  rules: {
    '.Tab': { border: 'none', backgroundColor: '#2b2b29', color: '#ffffff', borderRadius: '6px', boxShadow: 'none', outline: 'none' },
    '.Tab:hover': { border: 'none', backgroundColor: '#474745', color: '#ffffff', boxShadow: 'none', outline: 'none' },
    '.Tab--selected,.Tab--selected:hover': { border: 'none', backgroundColor: '#ffffff', color: '#171716', boxShadow: 'none', outline: 'none' },
    '.TabIcon--selected': { fill: '#171716' },
    '.Label': { color: '#a6a6a4', fontSize: '16px', lineHeight: '20px', marginBottom: '10px' },
    '.Input': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '0',
      boxShadow: 'inset 0 -1px 0 0 #474745',
      color: '#ffffff',
      padding: '0 0 11px',
    },
    '.Input:focus': { boxShadow: 'inset 0 -1px 0 0 #ffffff', outline: 'none' },
    '.Input::placeholder': { color: 'transparent' },
    // Note: Stripe's Address Element renders its country picker as .Input, so
    // this only reaches selects in the Payment Element. Filled Gray 7 at
    // --radius-ui there matches the Company size control in the drawer.
    '.Select': {
      backgroundColor: '#2b2b29',
      border: 'none',
      borderRadius: '6px',
      boxShadow: 'none',
      color: '#ffffff',
      padding: '10px 16px',
    },
    '.Select:focus': { boxShadow: 'none', outline: 'none' },
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
            <Route path="/" element={<Catalog />} />
            <Route path="/catalog" element={<Navigate to="/" replace />} />
            {/* The Contact page is gone; its URL redirects rather than
                rendering an empty shell, since there is no catch-all route. */}
            <Route path="/contact" element={<Navigate to="/" replace />} />
            <Route path="/catalog/:fontId" element={<FontDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/trials" element={<Trials />} />
            <Route path="/license" element={<License />} />
            <Route path="/eula" element={<Eula />} />
            <Route path="/privacy" element={<Privacy />} />
          </AnimatedRoutes>
        </main>
        <Footer />
      </div>
    </FontdueProvider>
  )
}
