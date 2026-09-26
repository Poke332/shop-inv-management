import { useEffect, useRef, useState } from 'react'

import { ConfirmDialog } from '../../components/ConfirmDialog.jsx'
import { mockApi } from '../../data'
import { CATEGORY_LABEL } from '../../utils/utils.js'
import { ImageDropzone } from './ImageDropzone.jsx'
import { SpecsCard } from './SpecsCard.jsx'

/**
 * ProductForm — the add/edit editor (docs/per-product-dashboard
 * "ProductForm"): one form for both paths. Add (POST /products — "New
 * product" opens it with an empty spec list; zero pairs is a valid,
 * publishable listing) and Edit (PATCH /products/:id, pre-filled from the
 * record, including the name/value spec pairs). Locked field set: name,
 * price, description, image, category, initial stock + the Specs card.
 * Save stays disabled until the required fields are valid (name, price >
 * 0, category, image, stock ≥ 0); the stock helper reads
 * "Auto-decremented on each order — enter actual shelf count". Dirty
 * tracking: leaving with unsaved changes shows the confirm dialog.
 * No delete button (the matrix has no delete-product permission).
 * @param {{product: object | null, onSaved: (p: object, isCreate: boolean) => void,
 *   onCancel: (() => void) | null}} props  product null = the add form;
 *   onCancel = the dirty-leave escape (the deep-link edit page passes a
 *   navigate-back, the list split passes the "+ New product" reset).
 * @returns {object} the editor card.
 */
export function ProductForm({ product, onSaved, onCancel }) {
  const isCreate = !product
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [description, setDescription] = useState(product?.description || '')
  const [category, setCategory] = useState(product?.category || '')
  const [stock, setStock] = useState(product != null ? String(product.stock) : '')
  const [image, setImage] = useState(product?.image || '')
  const [specs, setSpecs] = useState(product ? product.specs.map((s) => ({ ...s })) : [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [leavePrompt, setLeavePrompt] = useState(false)
  const lastSaved = useRef(null)

  // re-hydrate when a different product arrives (deep-link navigation);
  // the result of a just-completed save is NOT re-hydrated (the fields
  // already show it and the success flash stays visible)
  useEffect(() => {
    if (product && product === lastSaved.current) {
      setDirty(false)
      return
    }
    lastSaved.current = null
    setName(product?.name || '')
    setPrice(product ? String(product.price) : '')
    setDescription(product?.description || '')
    setCategory(product?.category || '')
    setStock(product != null ? String(product.stock) : '')
    setImage(product?.image || '')
    setSpecs(product ? product.specs.map((s) => ({ ...s })) : [])
    setFieldErrors({})
    setSaved(false)
    setDirty(false)
  }, [product])

  // dirty-leave guard: reload/close while unsaved changes prompts (the
  // in-app "Back" affordances ask via the ConfirmDialog above)
  useEffect(() => {
    if (!dirty) return undefined
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const priceNum = Number(price)
  const stockNum = Number(stock)
  const valid =
    name.trim() !== '' && priceNum > 0 && category !== '' && image !== '' && stock !== '' && stockNum >= 0

  const markDirty = () => {
    setDirty(true)
    setSaved(false)
  }

  const buildPayload = () => ({
    name: name.trim(),
    price: priceNum,
    description: description.trim(),
    category,
    stock: Math.max(0, Math.floor(stockNum) || 0),
    image,
    specs: specs.filter((s) => s.key.trim() || s.value.trim()),
    brand: product?.brand || name.trim().split(' ')[0] || 'Sunset',
  })

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    const payload = buildPayload()
    try {
      const p = isCreate ? await mockApi.createProduct(payload) : await mockApi.updateProduct(product.id, payload)
      lastSaved.current = p
      setSaved(true)
      setDirty(false)
      onSaved(p, isCreate)
    } catch {
      setFieldErrors({ form: 'Save failed — retry.' })
    } finally {
      setSaving(false)
    }
  }

  const askLeave = () => {
    if (dirty && !saving) setLeavePrompt(true)
  }

  return (
    <section
      aria-label={isCreate ? 'New product editor' : `Edit product ${product.id}`}
      className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-5"
      data-saved={saved || undefined}
    >
      <header className="flex items-center gap-3 flex-wrap">
        <h2 className="text-section font-semibold text-ink">
          {isCreate ? 'New product' : `Product editor · ${product.id}`}
        </h2>
        {onCancel ? (
          <button type="button" className="text-meta text-atomicTangerine-600 hover:underline" onClick={askLeave}>
            ← Back
          </button>
        ) : null}
      </header>

      {saved ? (
        <div className="flash-banner" role="status">
          {isCreate ? 'Product created — new row highlighted in the list.' : 'Changes saved.'}
        </div>
      ) : null}
      {fieldErrors.form ? (
        <div className="state-error" role="alert">
          {fieldErrors.form}
        </div>
      ) : null}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="block text-meta font-semibold text-ink mb-1" htmlFor="pf-name">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="pf-name"
            className="input w-full"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              markDirty()
            }}
            required
          />
          {name.trim() === '' && !isCreate ? (
            <p className="text-meta text-strawberryRed-600 mt-1" style={{ background: 'var(--strawberryRed-100)', padding: '2px 8px', borderRadius: 4 }}>
              Name is required.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-meta font-semibold text-ink mb-1" htmlFor="pf-price">
              Price (IDR) <span aria-hidden="true">*</span>
            </label>
            <input
              id="pf-price"
              className="input w-full"
              inputMode="numeric"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value.replace(/[^0-9]/g, ''))
                markDirty()
              }}
            />
            {price !== '' && !(Number(price) > 0) ? (
              <p className="text-meta text-strawberryRed-600 mt-1">Price must be greater than 0.</p>
            ) : null}
          </div>
          <div>
            <label className="block text-meta font-semibold text-ink mb-1" htmlFor="pf-stock">
              {isCreate ? 'Initial stock' : 'Stock'} <span aria-hidden="true">*</span>
            </label>
            <input
              id="pf-stock"
              className="input w-full"
              inputMode="numeric"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value.replace(/[^0-9]/g, ''))
                markDirty()
              }}
            />
            <p className="text-meta text-blueSlate-700 mt-1">
              Auto-decremented on each order — enter actual shelf count
            </p>
          </div>
        </div>

        <div>
          <label className="block text-meta font-semibold text-ink mb-1" htmlFor="pf-category">
            Category <span aria-hidden="true">*</span>
          </label>
          <select
            id="pf-category"
            className="input w-full"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              markDirty()
            }}
          >
            <option value="">Select a category…</option>
            {Object.entries(CATEGORY_LABEL).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-meta font-semibold text-ink mb-1">
            Image <span aria-hidden="true">*</span>
          </span>
          <ImageDropzone
            image={image}
            category={category}
            name={name || 'product'}
            onReplace={(src) => {
              setImage(src)
              markDirty()
            }}
          />
        </div>

        <div>
          <label className="block text-meta font-semibold text-ink mb-1" htmlFor="pf-desc">
            Description
          </label>
          <textarea
            id="pf-desc"
            className="input w-full"
            rows={3}
            style={{ minHeight: 88, padding: '10px 12px', resize: 'vertical' }}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              markDirty()
            }}
          />
        </div>

        <SpecsCard specs={specs} onChange={(s) => {
          setSpecs(s)
          markDirty()
        }} />

        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" className="btn-primary" disabled={!valid || saving} aria-busy={saving || undefined}>
            {saving ? 'Saving…' : isCreate ? 'Create product' : 'Save changes'}
          </button>
          {!valid ? (
            <span className="text-meta text-blueSlate-700">Fill the required fields to enable save.</span>
          ) : null}
        </div>
      </form>

      <ConfirmDialog
        open={leavePrompt}
        title="Discard unsaved changes?"
        body="You have edits that have not been saved. Leaving now will drop them."
        confirmLabel="Discard"
        tone="danger"
        onConfirm={() => {
          setLeavePrompt(false)
          setDirty(false)
          if (onCancel) onCancel()
        }}
        onCancel={() => setLeavePrompt(false)}
      />
    </section>
  )
}
