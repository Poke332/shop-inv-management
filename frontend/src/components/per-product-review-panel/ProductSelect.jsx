import { useEffect, useState } from 'react'

import { mockApi } from '../../data'

/**
 * The product selector of the review panel: a 44px selectbox (`.input` —
 * 1px blueSlate-200 border, 8px radius) over the product catalog
 * (mockApi.getProducts id→name). Fully controlled — the selected id lives in
 * the URL (?product=), so deep-links pre-select and switching refetches.
 * @param {object} props
 * @param {string} props.value  the selected product id (never empty — the
 *   page falls back to P-231 when the URL carries no ?product=).
 * @param {(id: string) => void} props.onChange  selection change; the page
 *   writes it back into the URL.
 * @returns {object} the labeled selectbox.
 */
export function ProductSelect({ value, onChange }) {
  const [options, setOptions] = useState([])

  useEffect(() => {
    let cancelled = false
    mockApi
      .getProducts()
      .then((d) => {
        if (!cancelled) setOptions(d.items.map((p) => ({ id: p.id, name: p.name })))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  // React's controlled <select> blanks its value when the option list has
  // not loaded yet (no option matches the value), so the ?product= deep-link
  // value is kept as an explicit fallback option until the catalog arrives.
  const selected = options.find((o) => o.id === value) || (value ? [{ id: value, name: value }] : [])
  const merged = options.some((o) => o.id === value) ? options : [...selected, ...options]

  return (
    <label className="flex items-center gap-2 min-w-0 flex-1" style={{ maxWidth: '420px' }}>
      <span className="text-meta text-blueSlate-700 shrink-0">Product</span>
      <select
        className="input w-full"
        value={value}
        aria-label="Select a product"
        onChange={(e) => onChange(e.target.value)}
      >
        {merged.length === 0 ? <option value="">Loading products…</option> : null}
        {merged.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} ({o.id})
          </option>
        ))}
      </select>
    </label>
  )
}
