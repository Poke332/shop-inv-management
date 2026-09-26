import { useCallback, useRef, useState } from 'react'

/**
 * useToasts — the ops pages' toast list (fire a toast, it auto-dismisses
 * after 4s). Pages render the returned list with ToastHost and call
 * `toast(text, tone)` from their failure paths (e.g. the status-advance
 * revert, the role/disable failure). Kept hook-local so no navigation
 * state survives a reload (the page re-queries on navigation anyway).
 * @returns {{toasts: {id: string, tone: string, text: string}[],
 *   toast: (text: string, tone?: string) => void, dismiss: (id: string) => void}}
 */
export function useToasts() {
  const [toasts, setToasts] = useState([])
  const seq = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (text, tone = 'error') => {
      seq.current += 1
      const id = `t-${seq.current}`
      setToasts((ts) => [...ts, { id, text, tone }])
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4000)
    },
    [],
  )

  return { toasts, toast, dismiss }
}
