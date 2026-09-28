import { useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router'

import { ToastHost } from '../components/ToastHost.jsx'
import { ProductSelect } from '../components/per-product-review-panel/ProductSelect.jsx'
import { ReviewCard } from '../components/per-product-review-panel/ReviewCard.jsx'
import { SectionHeader } from '../components/per-product-review-panel/SectionHeader.jsx'
import { mockApi } from '../data'
import { useToasts } from '../hooks/useToasts.js'

/**
 * The per-product review panel (docs/per-product-review-panel). Route
 * /ops/reviews?product=<id> — manager/admin (requireManagerOrAdmin): the
 * moderation console over ONE review list (mockApi.getProductReviewsAll,
 * public + hidden, newest first) split into the Public section and the
 * collapsed Hidden section. The meta line ("122 public / 6 hidden · 128
 * total") is the response's stats — never recomputed from the split
 * array. Hide/Unhide + seller-comment saves are optimistic: the card
 * moves between sections / the comment lands with a willowGreen-100 row
 * flash; a failure rolls the row back and fires a strawberryRed toast.
 * No approve, no delete, no confirm dialog. The selected product lives in
 * the URL (?product= — deep-links pre-select); everything else is in-page.
 * @returns {object} the page.
 */
export function ReviewsPage() {
  const [params, setParams] = useSearchParams()
  const productId = params.get('product') || 'P-231'

  const [items, setItems] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [busy, setBusy] = useState(() => new Set())
  const [saving, setSaving] = useState(() => new Set())
  const [flashing, setFlashing] = useState(() => new Set())
  const [hiddenOpen, setHiddenOpen] = useState(false)
  const [announce, setAnnounce] = useState('')
  // per-row composer drafts keyed by review id: { open, text } — they
  // survive a Hidden-section collapse within the session, dropped on nav.
  const [drafts, setDrafts] = useState({})
  const { toasts, toast, dismiss } = useToasts()

  useEffect(() => {
    let cancelled = false
    setItems(null)
    setStats(null)
    setError(false)
    setDrafts({})
    setAnnounce('')
    mockApi
      .getProductReviewsAll(productId)
      .then((d) => {
        if (cancelled) return
        setItems(d.items)
        setStats({ public: d.publicCount, hidden: d.hiddenCount, total: d.total })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [productId, retry])

  const flash = (id, message) => {
    setFlashing((s) => new Set(s).add(id))
    setAnnounce(message)
    setTimeout(() => {
      setFlashing((cur) => {
        const cleared = new Set(cur)
        cleared.delete(id)
        return cleared
      })
    }, 2000)
  }

  const publicRows = useMemo(() => (items ? items.filter((r) => r.state === 'public') : []), [items])
  const hiddenRows = useMemo(() => (items ? items.filter((r) => r.state === 'hidden') : []), [items])

  const toggleState = (r) => {
    const nextHidden = r.state === 'public'
    // optimistic: the card flips state IN the split (and the stats row
    // adjusts with it) BEFORE the PATCH lands; a reject restores both
    // snapshots and the card rolls back to its old section.
    const prevItems = items
    const prevStats = stats
    setBusy((s) => new Set(s).add(r.id))
    setItems(items.map((x) => (x.id === r.id ? { ...x, state: nextHidden ? 'hidden' : 'public' } : x)))
    setStats({
      ...stats,
      public: nextHidden ? stats.public - 1 : stats.public + 1,
      hidden: nextHidden ? stats.hidden + 1 : stats.hidden - 1,
    })
    if (nextHidden) setHiddenOpen(true)
    mockApi
      .setReviewHidden(r.id, nextHidden)
      .then(() =>
        mockApi.getProductReviewsAll(productId).then((d) => {
          setItems(d.items)
          setStats({ public: d.publicCount, hidden: d.hiddenCount, total: d.total })
          flash(r.id, `${r.buyer}’s review moved to ${nextHidden ? 'Hidden' : 'Public'}`)
        }).catch(() => {
          // the optimistic move IS committed (the PATCH won); if the
          // reconciliation re-fetch fails, keep the optimistic split and
          // tell the user — the next action refetches again.
          toast('Change saved — the list could not refresh')
          setAnnounce(`${r.buyer}’s review moved to ${nextHidden ? 'Hidden' : 'Public'}; the list did not refresh`)
        }),
      )
      .catch(() => {
        setItems(prevItems)
        setStats(prevStats)
        toast('State change failed — the review rolled back')
        setAnnounce(`${r.buyer}’s review state change failed — rolled back`)
      })
      .finally(() => {
        setBusy((cur) => {
          const cleared = new Set(cur)
          cleared.delete(r.id)
          return cleared
        })
      })
  }

  const openDraft = (r) =>
    setDrafts((d) => ({ ...d, [r.id]: { open: true, text: r.sellerComment?.text || '' } }))
  const closeDraft = (id) =>
    setDrafts((d) => {
      const next = { ...d }
      delete next[id]
      return next
    })
  const setDraftText = (id, text) => setDrafts((d) => ({ ...d, [id]: { open: true, text } }))

  const saveComment = (r) => {
    const text = (drafts[r.id]?.text || '').trim()
    const prevItems = items
    setSaving((s) => new Set(s).add(r.id))
    // optimistic: the comment lands on the row before the PUT settles
    setItems(items.map((x) => (x.id === r.id ? { ...x, sellerComment: text ? { text, at: '' } : undefined } : x)))
    mockApi
      .setSellerComment(r.id, text)
      .then(() =>
        mockApi.getProductReviewsAll(productId).then((d) => {
          setItems(d.items)
          closeDraft(r.id)
          flash(r.id, `Seller comment ${text ? 'saved' : 'cleared'} for ${r.buyer}`)
        }),
      )
      .catch(() => {
        setItems(prevItems)
        toast('Comment save failed — retry')
        setAnnounce(`Comment for ${r.buyer} failed to save`)
      })
      .finally(() => {
        setSaving((cur) => {
          const cleared = new Set(cur)
          cleared.delete(r.id)
          return cleared
        })
      })
  }

  const card = (r) => {
    const draft = drafts[r.id] || { open: false, text: '' }
    return (
      <ReviewCard
        key={r.id}
        review={r}
        flashing={flashing.has(r.id)}
        busy={busy.has(r.id)}
        composerOpen={draft.open}
        draft={draft.text}
        onDraft={(t) => setDraftText(r.id, t)}
        onCommentAction={() => (draft.open ? closeDraft(r.id) : openDraft(r))}
        onStateToggle={() => toggleState(r)}
        onCommentSave={() => saveComment(r)}
        onCommentCancel={() => closeDraft(r.id)}
        saving={saving.has(r.id)}
      />
    )
  }

  return (
    <div className="ops-page max-w-content">
      <h1 className="text-h1 font-h1 text-ink">Reviews</h1>

      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <ProductSelect value={productId} onChange={(id) => setParams({ product: id })} />
        {stats ? (
          <p className="text-body text-blueSlate-700" aria-live="polite">
            {stats.public} public / {stats.hidden} hidden · {stats.total} total
          </p>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {error ? (
        <div className="state-error mt-5 flex items-center gap-3" role="alert">
          <span>Reviews could not be loaded.</span>
          <button type="button" className="underline font-semibold" onClick={() => setRetry((n) => n + 1)}>
            Retry
          </button>
        </div>
      ) : !items ? (
        <div className="mt-5 flex flex-col gap-5" aria-busy="true">
          <section aria-label="Public reviews" className="flex flex-col gap-3">
            <div className="skeleton skeleton-line-sm w-40" />
            {[0, 1].map((i) => (
              <div key={i} className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-3">
                <div className="skeleton skeleton-line-sm" />
                <div className="skeleton skeleton-line" />
              </div>
            ))}
          </section>
          <section aria-label="Hidden reviews" className="flex flex-col gap-3">
            <div className="skeleton skeleton-line-sm w-40" />
            <div className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex flex-col gap-3">
              <div className="skeleton skeleton-line-sm" />
              <div className="skeleton skeleton-line" />
            </div>
          </section>
        </div>
      ) : stats.total === 0 ? (
        <div className="state-empty mt-5">
          <h2>No reviews for this product</h2>
          <p>Pick another product above.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          <section aria-label="Public reviews" className="flex flex-col gap-3">
            <SectionHeader kind="public" count={publicRows.length} />
            {publicRows.map(card)}
          </section>

          <section aria-label="Hidden reviews" className="flex flex-col gap-3">
            <SectionHeader
              kind="hidden"
              count={hiddenRows.length}
              expanded={hiddenOpen}
              onToggle={() => setHiddenOpen((o) => !o)}
            />
            {hiddenOpen ? (
              hiddenRows.length === 0 ? (
                <div className="state-empty bg-canvas border border-blueSlate-200 rounded-xl">
                  <h2 className="!text-willowGreen-700">
                    <span aria-hidden="true">✓ </span>No hidden reviews
                  </h2>
                  <p>Everything is public.</p>
                </div>
              ) : (
                hiddenRows.map(card)
              )
            ) : null}
          </section>
        </div>
      )}

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
