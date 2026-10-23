import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './styles/tokens.css'
import './styles/redesign.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx'

/**
 * The app entry point: mounts <App/> into #root under StrictMode +
 * BrowserRouter. tokens.css = the theme/component layer; the two providers
 * wrap the tree so every layout, guard, and page can read the session
 * (user+role) and the live cart count.
 *
 * The cart provider sits ABOVE the auth provider on purpose: the auth
 * provider re-keys its region on owner transitions (the buyer-account
 * separation), and the cart + wizard state must survive that remount —
 * a re-keyed cart would otherwise lose the hydrated lines on every
 * sign-in/out, and an account switch would see the predecessor's cart.
 * The cart provider tracks the owner itself (via the auth storage
 * listeners) and resets + re-hydrates on each transition.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
