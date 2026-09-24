import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './styles/tokens.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx'

/**
 * The app entry point: mounts <App/> into #root under StrictMode +
 * BrowserRouter. tokens.css = the theme/component layer; the two providers
 * wrap the tree so every layout, guard, and page can read the session
 * (user+role) and the live cart count (P1 seam; P4 builds on both).
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* P1: session user+role (guards/header account menu) + the live cart
          count (header badge). The providers wrap the tree so every layout,
          guard, and placeholder page can read them. */}
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
