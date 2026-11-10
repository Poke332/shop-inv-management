import { useEffect, useRef } from 'react'

/** Shared keyboard lifecycle for the two warehouse dialogs. The keyed parent
 * unmounts on close, so local form/search state never leaks between locations. */
export function useWarehouseDialog(onClose, blocked = false) {
  const ref = useRef(null)
  useEffect(() => {
    const trigger = document.activeElement
    const root = ref.current
    const initial = root?.querySelector('input:not([disabled]):not([type="hidden"])') || root?.querySelector('button:not([disabled])')
    initial?.focus()
    return () => { if (trigger?.isConnected) trigger.focus() }
  }, [])
  const onKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (!blocked) onClose()
    }
    if (event.key !== 'Tab') return
    const controls = [...ref.current.querySelectorAll('button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex="0"]')].filter(el => el.getClientRects().length)
    const first = controls[0]
    const last = controls.at(-1)
    if (!first) { event.preventDefault(); return }
    if (event.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) {
      event.preventDefault(); last.focus()
    } else if (!event.shiftKey && (document.activeElement === last || !ref.current.contains(document.activeElement))) {
      event.preventDefault(); first.focus()
    }
  }
  return { ref, onKeyDown }
}
