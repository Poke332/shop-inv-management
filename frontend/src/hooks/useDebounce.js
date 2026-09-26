import { useEffect, useState } from 'react'

/**
 * useDebounce — returns `value` only after it has been stable for
 * `delay` ms (the search inputs of the inventory + user tables, the
 * search-browse pattern).
 * @param {any} value  the raw value to debounce.
 * @param {number} [delay]  ms of stability required (default 300).
 * @returns {any} the debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
