import { useContext } from 'react'

import { CartContext } from '../contexts/CartContext.jsx'

/**
 * P3.1 REV 10 (code-org rule: one custom hook per file) — the useCart
 * accessor, moved out of contexts/CartContext.jsx so every custom hook
 * lives in src/hooks/. Reads the cart context value (lines, count, subtotal,
 * loaded, refresh). Throws when called outside <CartProvider>.
 * @returns {{lines: object[], count: number, subtotal: number, loaded: boolean,
 *            refresh: () => Promise<void>}}
 * @throws {Error} when called outside <CartProvider>
 */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
