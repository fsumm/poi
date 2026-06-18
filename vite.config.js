import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-relay', 'relay-runtime'],
  },
  optimizeDeps: {
    include: [
      'fontdue-js/FontdueProvider',
      'fontdue-js/TypeTesters',
      'fontdue-js/TypeTester',
      'fontdue-js/CharacterViewer',
      'fontdue-js/BuyButton',
      'fontdue-js/CartButton',
      'fontdue-js/NewsletterSignup',
      'fontdue-js/TestFontsForm',
      'fontdue-js/StoreModal',
      'fontdue-js/useFont',
      'fontdue-js/useFontStyle',
    ],
  },
})
