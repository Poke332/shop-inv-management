import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'

import { mockApi } from '../data'

/**
 * P1 CartStore seam (ARCHITECTURE §4.3 CartStore exception): the live cart
 * count feeds the StorefrontHeader badge now; P4 builds the full cart page
 * and checkout wizard on top of this context. Cart lines live in the
 * session-based mock module (refreshes empty), so the context hydrates from
 * mockApi.getCart() on mount and exposes refresh() for P4.
 */
const CartContext = createContext(null)

/**
 * The CartStore context (the P1 seam): hydrates from mockApi.getCart() on
 * mount and exposes refresh() for P4.
 * @param {{children: import('react').ReactNode}} props
 */
export function CartProvider({ children }) {
  const [data, setData] = useState(null)
  const loadedRef = useRef(false)

  const refresh = useCallback(async () => {
    const d = await mockApi.getCart()
    loadedRef.current = true
    setData(d)
  }, [])

  useEffect(() => {
    if (!loadedRef.current) refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      lines: data ? data.lines : [],
      count: data ? data.count : 0,
      subtotal: data ? data.subtotal : 0,
      loaded: !!data,
      refresh,
    }),
    [data, refresh],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * The cart context value.
 * @returns {{lines: object[], count: number, subtotal: number, loaded: boolean,
 *            refresh: () => Promise<void>}}
 * @throws {Error} when called outside <CartProvider>
 */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
