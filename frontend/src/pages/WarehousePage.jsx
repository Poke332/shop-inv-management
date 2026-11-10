import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { mockApi } from '../data'
import { useAuth } from '../hooks/useAuth.js'
import WarehouseWorkspace from './WarehouseWorkspace.jsx'
import { useWarehouseDialog } from '../hooks/useWarehouseDialog.js'
import { confirmedTransfer } from '../components/warehouse/transferAnimation.js'

function Badge({ status }) {
  const cls = {
    full: 'text-xs font-bold px-2 py-0.5 rounded bg-red-700 text-white',
    partial: 'text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-ink',
    empty: 'text-xs font-bold px-2 py-0.5 rounded bg-blueSlate-700 text-blueSlate-50',
    pool: 'text-xs font-bold px-2 py-0.5 rounded bg-ink text-canvas',
    inactive: 'text-xs font-bold px-2 py-0.5 rounded bg-blueSlate-300 text-blueSlate-700',
  }
  const label = { full: 'Full', partial: 'In use', empty: 'Empty', pool: 'Unassigned', inactive: 'Inactive' }
  return <span className={cls[status] || cls.empty}>{label[status] || status?.toUpperCase()}</span>
}

function BinDetailModal({ location, onClose, onEdit, canWrite }) {
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useWarehouseDialog(onClose)
  if (!location) return null

  const contents = location.contents || []
  const isPool = location.id === 'POOL'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      {...dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bin-detail-title"
    >
      <div className="w-full max-w-2xl max-h-[85vh] overflow-auto bg-canvas rounded-2xl shadow-xl border border-blueSlate-200">
        <div className="flex items-center justify-between p-4 border-b border-blueSlate-200 sticky top-0 bg-canvas z-10">
          <h3 id="bin-detail-title" className="text-lg font-semibold text-ink">
            {isPool ? 'Unassigned' : `${location.code} · ${location.label}`}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-blueSlate-100 text-blueSlate-600 focus:outline-none focus:ring-2 focus:ring-ink"
            aria-label="Close details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4">
          {!isPool && (
            <div className="grid grid-cols-2 gap-3 text-sm mb-4 p-3 bg-blueSlate-50 rounded-lg">
              <div><span className="text-blueSlate-500">Zone:</span> <span className="text-ink ml-1">{location.zone}</span></div>
              <div><span className="text-blueSlate-500">Rack:</span> <span className="text-ink ml-1">{location.rack || '—'}</span></div>
              <div><span className="text-blueSlate-500">Bay:</span> <span className="text-ink ml-1">{location.bay ?? '—'}</span></div>
              <div><span className="text-blueSlate-500">Status:</span> <Badge status={location.status} /></div>
              <div className="col-span-2"><span className="text-blueSlate-500">Capacity:</span> <span className="text-ink ml-1">{location.capacity}</span> · <span className="text-blueSlate-500">Used:</span> <span className="text-ink ml-1">{location.used}</span> · <span className="text-blueSlate-500">Available:</span> <span className="text-ink ml-1">{location.capacity - location.used}</span></div>
              <div className="col-span-2"><span className="text-blueSlate-500">Utilization:</span> <span className="text-ink ml-1">{location.capacity > 0 ? Math.round((location.used / location.capacity) * 100) : 0}%</span></div>
              {location.isTemplate && <div className="col-span-2 text-xs text-blueSlate-500">Template layout · not a surveyed warehouse</div>}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              id="bin-search"
              placeholder="Search products in this location…"
              className="flex-1 rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              aria-label="Search products in this location"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="rounded-lg px-3 py-2 border border-blueSlate-300 text-sm text-blueSlate-600 hover:bg-blueSlate-50"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {contents.length === 0 ? (
            <div className="text-center py-8 text-blueSlate-500">
              {isPool ? 'All stock is allocated.' : 'This location is empty.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {contents
                .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((c) => (
                  <div
                    key={c.productId}
                    className="flex items-center justify-between p-3 bg-blueSlate-50 rounded-lg border border-blueSlate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink truncate">{c.name}</div>
                      <div className="text-xs text-blueSlate-500">Qty: {c.qty}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      c.qty >= 10 ? 'bg-green-100 text-green-800' :
                      c.qty >= 5 ? 'bg-amber-100 text-amber-800' :
                      'bg-blueSlate-100 text-blueSlate-800'
                    }`}>
                      {c.qty} units
                    </span>
                  </div>
                ))}
              {searchTerm && contents.every(c => !c.name.toLowerCase().includes(searchTerm.toLowerCase())) && (
                <div className="text-center py-4 text-blueSlate-500">No matching products: "{searchTerm}"</div>
              )}
            </div>
          )}

          {canWrite && !isPool && onEdit && (
            <div className="mt-4 pt-4 border-t border-blueSlate-200">
              <button
                onClick={() => { onClose(); onEdit(location); }}
                className="w-full rounded-lg px-4 py-2 bg-ink text-canvas text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ink"
              >
                Edit capacity / label / status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LocationConfigModal({ location, data, onClose, onSave, mode }) {
  const [form, setForm] = useState({
    code: location?.code || '',
    zone: location?.zone || '',
    rack: location?.rack || '',
    bay: location?.bay ?? '',
    label: location?.label || '',
    capacity: location?.capacity ?? '',
    active: location?.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const dialog = useWarehouseDialog(onClose, saving)

  const isEdit = mode === 'edit'

  const validate = () => {
    const newErrors = {}
    if (!form.code.trim()) newErrors.code = 'A location code is required.'
    else if (!/^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}$/.test(form.code.toUpperCase())) newErrors.code = 'Use a two-part code such as A1-01.'
    if (!form.zone.trim()) newErrors.zone = 'A zone is required.'
    const cap = Number(form.capacity)
    if (form.capacity === '' || !Number.isInteger(cap) || cap < 0) newErrors.capacity = 'Capacity must be a non-negative whole number.'
    else if (location && cap < location.used) newErrors.capacity = `Capacity cannot be below allocated stock (${location.used})`
    if (!isEdit && data.items.some(l => l.code.toUpperCase() === form.code.toUpperCase() && l.id !== location?.id)) {
      newErrors.code = 'This location code already exists.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    if (!confirm(isEdit ? `Save changes for ${form.code}?` : `Create location ${form.code}?`)) return

    setSaving(true)
    setSaveError(null)
    try {
      if (isEdit) {
        await mockApi.updateWarehouseLocation(location.id, {
          label: form.label.trim() || `Bay ${form.code}`,
          capacity: Number(form.capacity),
          active: form.active,
        })
      } else {
        await mockApi.createWarehouseLocation({
          code: form.code.toUpperCase(),
          zone: form.zone.trim(),
          rack: form.rack.trim() || null,
          bay: form.bay === '' ? null : Number(form.bay),
          label: form.label.trim() || `Bay ${form.code}`,
          capacity: Number(form.capacity),
        })
      }
      await onSave()
      onClose()
    } catch (err) {
      setSaveError(err.message || String(err))
      if (err.code) setSaveError((prev) => `${prev} (code: ${err.code})`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      {...dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-title"
    >
      <div className="wh-modal-card w-full max-w-md max-h-[90dvh] overflow-auto bg-canvas rounded-2xl shadow-xl border border-blueSlate-200">
        <div className="flex items-center justify-between p-4 border-b border-blueSlate-200">
          <h3 id="config-title" className="text-lg font-semibold text-ink">
            {isEdit ? `Edit location: ${location?.code}` : 'Create location'}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-blueSlate-100 text-blueSlate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
              {saveError}
            </div>
          )}

          {!isEdit && (
            <div>
              <label htmlFor="cfg-code" className="block text-xs text-blueSlate-600 mb-1">Code <span className="text-red-500">*</span></label>
              <input
                id="cfg-code"
                type="text"
                value={form.code.toUpperCase()}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="A1-01"
                maxLength={9}
                disabled={saving}
                required
              />
              {errors.code && <p className="mt-1 text-xs text-red-600" role="alert">{errors.code}</p>}
            </div>
          )}

          {isEdit && (
            <div>
              <label className="block text-xs text-blueSlate-600 mb-1">Code (read-only)</label>
              <input
                type="text"
                value={form.code}
                className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-blueSlate-50 text-blueSlate-600 cursor-not-allowed"
                readOnly
              />
            </div>
          )}

          <div>
            <label htmlFor="cfg-zone" className="block text-xs text-blueSlate-600 mb-1">Zone <span className="text-red-500">*</span></label>
            <input
              readOnly={isEdit}
              id="cfg-zone"
              type="text"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="Zone A"
              maxLength={40}
              disabled={saving}
              required
            />
            {errors.zone && <p className="mt-1 text-xs text-red-600" role="alert">{errors.zone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cfg-rack" className="block text-xs text-blueSlate-600 mb-1">Rack</label>
              <input
                readOnly={isEdit}
              id="cfg-rack"
                type="text"
                value={form.rack}
                onChange={(e) => setForm({ ...form, rack: e.target.value })}
                className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="A1"
                maxLength={10}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="cfg-bay" className="block text-xs text-blueSlate-600 mb-1">Bay</label>
              <input
                readOnly={isEdit}
              id="cfg-bay"
                type="number"
                value={form.bay === '' ? '' : form.bay}
                onChange={(e) => setForm({ ...form, bay: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                placeholder="1"
                min={1}
                max={9999}
                step={1}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cfg-label" className="block text-xs text-blueSlate-600 mb-1">Label</label>
            <input
              id="cfg-label"
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="Bay A1-01"
              maxLength={80}
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="cfg-capacity" className="block text-xs text-blueSlate-600 mb-1">Capacity <span className="text-red-500">*</span></label>
            <input
              id="cfg-capacity"
              type="number"
              value={form.capacity === '' ? '' : form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value === '' ? '' : Number(e.target.value) })}
              className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              placeholder="12"
              min={0}
              max={1000000}
              step={1}
              disabled={saving}
              required
            />
            {errors.capacity && <p className="mt-1 text-xs text-red-600" role="alert">{errors.capacity}</p>}
            {location && (
              <p className="mt-1 text-xs text-blueSlate-500">Currently allocated: {location.used} units — capacity cannot be below allocated stock</p>
            )}
          </div>

          {isEdit && location?.id !== 'POOL' ? (
            <div className="flex items-center gap-2">
              <input
                id="cfg-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 text-ink border-blueSlate-300 rounded focus:ring-ink"
                disabled={saving || (location && location.used > 0)}
              />
              <label htmlFor="cfg-active" className="text-sm text-ink cursor-pointer select-none">
                Active
              </label>
              {location && location.used > 0 && (
                <span className="text-xs text-red-600">Transfer all stock out before deactivating this location.</span>
              )}
            </div>
          ) : (
            <input type="hidden" name="active" value="true" />
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg px-4 py-2 border border-blueSlate-300 text-sm font-medium text-blueSlate-700 hover:bg-blueSlate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg px-4 py-2 bg-ink text-canvas text-sm font-semibold hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ink"
            >
              {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create location')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MoveForm({ data, onMove, canWrite, animationActive }) {
  const [form, setForm] = useState({ productId: '', from: '', to: '', qty: 1 })
  const [status, setStatus] = useState(null)
  const [sourceType, setSourceType] = useState('pool')

  const productsInPool = useMemo(() => data?.unallocated?.filter(p => p.unallocated > 0) || [], [data])

  const productsInBin = useMemo(() => {
    if (!data || form.from === '' || form.from === 'POOL') return []
    const loc = data.items.find(i => i.id === form.from)
    return loc?.contents || []
  }, [data, form.from])

  const availableProducts = sourceType === 'pool' ? productsInPool : productsInBin

  const selectedProduct = availableProducts.find(p => p.productId === form.productId)
  const availableQty = selectedProduct ? Number(sourceType === 'pool' ? selectedProduct.unallocated : selectedProduct.qty) : 0
  const destination = data?.items?.find(i => i.id === form.to)
  const destinationRoom = form.to === 'POOL' ? Infinity : Math.max(0, (destination?.capacity || 0) - (destination?.used || 0))
  const source = sourceType === 'pool' ? 'POOL' : form.from
  const limit = Math.min(availableQty, destinationRoom)
  const validMove = !!selectedProduct && !!source && !!form.to && source !== form.to && Number.isInteger(Number(form.qty)) && Number(form.qty) > 0 && Number(form.qty) <= limit

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validMove || status === 'saving' || animationActive) return

    const payload = {
      productId: form.productId,
      from: sourceType === 'pool' ? 'POOL' : form.from,
      to: form.to === 'POOL' ? 'POOL' : form.to,
      qty: Number(form.qty),
    }

    if (payload.from === payload.to) {
      setStatus({ error: 'Source and destination must be different.', code: 'INVALID_MOVE' })
      return
    }

    const productName = availableProducts.find(p => p.productId === form.productId)?.name || form.productId
    const fromLabel = payload.from === 'POOL' ? 'Unassigned' : data.items.find(i => i.id === payload.from)?.code || payload.from
    const toLabel = payload.to === 'POOL' ? 'Unassigned' : data.items.find(i => i.id === payload.to)?.code || payload.to

    if (!confirm(`Move ${form.qty} units of ${productName} from ${fromLabel} to ${toLabel}?`)) {
      return
    }

    setStatus('saving')
    try {
      await onMove(payload)
      setStatus('ok')
      setForm({ productId: '', from: '', to: '', qty: 1 })
      setSourceType('pool')
    } catch (err) {
      setStatus({ error: err.message || String(err), code: err.code })
    }
  }

  if (!canWrite) return null

  const bays = data?.items?.filter(i => i.id !== 'POOL' && i.active) || []

  return (
    <form onSubmit={handleSubmit} className="wh-move wh-panel" aria-label="Stock allocation and transfers">
      <div className="wh-move-heading"><span className="wh-step">01 → 02</span><div><h2>{sourceType === 'pool' ? 'Allocate stock' : 'Transfer stock'}</h2><p>Choose a source, product and destination. Review the quantity before confirming.</p></div></div>

      <div className="flex flex-wrap gap-3 items-end mb-3">
        <div>
          <label htmlFor="move-source" className="block text-xs text-blueSlate-600 mb-1">Stock source</label>
          <select
            id="move-source"
            disabled={status === 'saving'}
            value={sourceType}
            onChange={(e) => { setSourceType(e.target.value); setForm({ productId: '', from: '', to: '', qty: 1 }); setStatus(null); }}
            className="rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink"
            required
          >
            <option value="pool">Unassigned stock (new allocation)</option>
            <option value="bin">Storage location (transfer / return)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {sourceType === 'bin' && (
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="move-from" className="block text-xs text-blueSlate-600 mb-1">Source location <span className="text-red-500">*</span></label>
            <select
              id="move-from"
              value={form.from}
              onChange={(e) => { setForm({ ...form, from: e.target.value, productId: '', qty: 1, to: form.to === e.target.value ? '' : form.to }); setStatus(null); }}
              className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink"
              required
              disabled={status === 'saving' || bays.length === 0}
            >
              <option value="">— select source location —</option>
              {bays.map(b => (
                <option key={b.id} value={b.id}>{b.code} ({b.used}/{b.capacity})</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="move-product" className="block text-xs text-blueSlate-600 mb-1">Product <span className="text-red-500">*</span></label>
          <select
            id="move-product"
            value={form.productId}
            onChange={(e) => { setForm({ ...form, productId: e.target.value, qty: 1 }); setStatus(null); }}
            className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink"
            required
            disabled={status === 'saving' || availableProducts.length === 0}
          >
            <option value="">— select product —</option>
            {availableProducts.map(p => (
              <option key={p.productId} value={p.productId}>
                {p.name} {sourceType === 'pool' ? `(pool: ${p.unallocated})` : `(at location: ${p.qty})`}
              </option>
            ))}
            {availableProducts.length === 0 && (
              <option value="" disabled>No products available at this source</option>
            )}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label htmlFor="move-to" className="block text-xs text-blueSlate-600 mb-1">Destination location <span className="text-red-500">*</span></label>
          <select
            disabled={status === 'saving'}
            id="move-to"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink"
            required
          >
            <option value="">— select destination —</option>
            {sourceType === 'bin' && <option value="POOL">Unassigned stock (return)</option>}
            {bays.map(b => (
              <option key={b.id} value={b.id}>{b.code} ({b.used}/{b.capacity})</option>
            ))}
          </select>
        </div>

        <div className="w-24">
          <label htmlFor="move-qty" className="block text-xs text-blueSlate-600 mb-1">Quantity (units) <span className="text-red-500">*</span></label>
          <input
            disabled={status === 'saving'}
            id="move-qty"
            type="number"
            min={1}
            max={limit || 1}
            step={1}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
            className="w-full rounded-lg px-3 py-2 border border-blueSlate-300 text-sm bg-canvas text-ink"
            required
          />
        </div>
      </div>

      <p className="warehouse-availability" aria-live="polite">Available at source: {availableQty} units · Destination space: {form.to === 'POOL' ? 'unlimited' : `${destinationRoom} units`}. {selectedProduct && Number(form.qty) > limit ? 'Quantity exceeds source stock or destination space.' : 'Transfers do not change total stock.'}</p>
      {animationActive && <p className="wh-animation-lock">Finish or skip the current visual playback before submitting another move.</p>}
      <div className="flex items-center gap-3 mt-3">
        <button
          type="submit"
          disabled={status === 'saving' || !validMove || animationActive}
          className="rounded-lg px-4 py-2 bg-ink text-canvas text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ink"
        >
          {status === 'saving' ? 'Saving…' : sourceType === 'pool' ? 'Allocate stock' : 'Transfer stock'}
        </button>

        {status === 'saving' && <span className="text-xs text-blueSlate-600">Saving…</span>}
        {status === 'ok' && <span className="text-xs text-green-700 font-semibold">Saved. Inventory refreshed.</span>}
        {status?.error && (
          <div className="text-xs text-red-700 font-semibold flex-1" role="alert">
            {status.error} {status.code ? `(code: ${status.code})` : ''}
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="ml-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </form>
  )
}

export function WarehousePage() {
  const { user } = useAuth()
  const role = user?.role || 'staff'
  const canWrite = role === 'manager' || role === 'admin'
  const [data, setData] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoadError, setInitialLoadError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [configLocation, setConfigLocation] = useState(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [configMode, setConfigMode] = useState('create')
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightLocation, setHighlightLocation] = useState(null)
  const [transferEvent,setTransferEvent]=useState(null)
  const [transferNotice,setTransferNotice]=useState('')
  const activeTransfer=useRef(null)
  const finishTransfer=useCallback((id,reason)=>{
    if(activeTransfer.current?.id!==id)return
    activeTransfer.current=null;setTransferEvent(null)
    const note=reason==='complete'?'Visualization complete.':reason==='reduced-motion'?'Reduced motion: visualization skipped.':reason==='unavailable'?'Visualization unavailable; use Locations for details.':'Visualization skipped.'
    setTransferNotice('Transfer saved. '+note)
  },[])

  const refresh = useCallback(async () => {
    try {
      setInitialLoadError(null)
      const [ov, mv] = await Promise.all([
        mockApi.getWarehouseOverview(),
        mockApi.getWarehouseMovements({ limit: 20 })
      ])
      setData(ov)
      setMovements(mv.items || [])
      return true
    } catch (err) {
      setInitialLoadError(err.message || String(err))
      return false
    }
  }, [])

  useEffect(() => {
    let alive = true
    Promise.all([mockApi.getWarehouseOverview(), mockApi.getWarehouseMovements({ limit: 20 })])
      .then(([ov, mv]) => {
        if (!alive) return
        setData(ov)
        setMovements(mv.items || [])
        setLoading(false)
        setInitialLoadError(null)
      })
      .catch((err) => {
        if (alive) {
          setLoading(false)
          setInitialLoadError(err.message || String(err))
        }
      })
    return () => { alive = false }
  }, [])

  const handleMove = async (payload) => {
    if(activeTransfer.current)throw new Error('Finish or skip the current visualization first.')
    setTransferNotice('')
    const result=await mockApi.moveWarehouseStock(payload)
    const refreshed=await refresh()
    const event=refreshed?confirmedTransfer(result):null
    if(event){activeTransfer.current=event;setTransferEvent(event)}
  }

  const handleCreateLocation = () => {
    setConfigOpen(true)
    setConfigMode('create')
    setConfigLocation(null)
  }

  const handleEditLocation = (loc) => {
    setConfigOpen(true)
    setConfigMode('edit')
    setConfigLocation(loc)
    setSelectedLocation(null)
  }

  const handleConfigSaved = async () => {
    await refresh()
  }

  const handleLocationClick = (loc) => {
    if (loc === null) {
      setHighlightLocation(null)
      setSearchTerm('')
      return
    }
    setSelectedLocation(loc)
    setHighlightLocation(loc.id)
  }

  return (
    <div className="ops-page warehouse-page">
      {loading ? (
        <div className="mt-6 text-blueSlate-500 animate-pulse">Loading warehouse…</div>
      ) : initialLoadError ? (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700" role="alert">
          <div className="font-semibold">Unable to load warehouse data:</div>
          <div className="text-sm mt-1">{initialLoadError}</div>
          <button
            onClick={refresh}
            className="mt-3 rounded-lg px-4 py-2 bg-red-600 text-white text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try again
          </button>
        </div>
      ) : data ? (
        <>
          <WarehouseWorkspace data={data} movements={movements} role={role} canWrite={canWrite}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} highlightLocation={highlightLocation}
            onLocationClick={handleLocationClick} onCreate={handleCreateLocation}
            transferEvent={transferEvent} transferNotice={transferNotice} onTransferEnd={finishTransfer}>
            <MoveForm data={data} onMove={handleMove} canWrite={canWrite} animationActive={Boolean(transferEvent)} />
          </WarehouseWorkspace>

          {selectedLocation && <BinDetailModal
            key={selectedLocation.id}
            location={selectedLocation}
            data={data}
            onClose={() => { setSelectedLocation(null); setHighlightLocation(null); }}
            onEdit={handleEditLocation}
            canWrite={canWrite}
          />}

          {canWrite && configOpen && <LocationConfigModal
            key={`${configMode}-${configLocation?.id || 'new'}`}
            location={configLocation}
            data={data}
            onClose={() => { setConfigOpen(false); setConfigLocation(null); }}
            onSave={handleConfigSaved}
            canWrite={canWrite}
            mode={configMode}
          />}
        </>
      ) : (
        <div className="mt-6 text-red-700">Warehouse data is unavailable.</div>
      )}
    </div>
  )
}