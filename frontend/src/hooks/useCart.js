import { useContext } from 'react'

import { CartContext } from '../contexts/CartContext.jsx'

/**
 * The useCart accessor (code-org rule: one custom hook per file), moved
 * out of contexts/CartContext.jsx so every custom hook lives in src/hooks/.
 * Reads the cart context value (lines, count, subtotal, loaded, error,
 * refresh, setQty, removeLine, clear). Throws when called outside
 * <CartProvider>.
 * @returns {{lines: object[], count: number, subtotal: number, loaded: boolean,
 *            error: boolean,
 *            refresh: () => Promise<void>,
 *            setQty: (lineId: string, qty: number) => Promise<boolean>,
 *            removeLine: (lineId: string) => Promise<boolean>,
 *            clear: () => Promise<boolean>}}
 * @throws {Error} when called outside <CartProvider>
 */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
