import {
  createContext, useCallback, useEffect, useMemo, useRef, useState,
} from 'react'

import { mockApi } from '../data'

/**
 * P1 CartStore seam (ARCHITECTURE §4.3 CartStore exception): the live cart
 * count feeds the StorefrontHeader badge now; P4 builds the full cart page
 * and checkout wizard on top of this context. Cart lines live in the
 * session-based mock module (refreshes empty), so the context hydrates from
 * mockApi.getCart() on mount and exposes refresh() for P4.
 *
 * P3.1 REV 10 (code-org rule: one custom hook per file): the useCart
 * accessor moved to src/hooks/useCart.js — this module keeps the context +
 * provider co-located (sanctioned multi-export module). Consumers import
 * useCart from ../hooks/useCart.js.
 */
/** The cart context value (exported so hooks/useCart.js reads the state). */
export const CartContext = createContext(null)

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
