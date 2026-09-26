/**
 * The section header of the review panel (docs/per-product-review-panel
 * "Section headers"): the 4×20 accent bar (Public = willowGreen-500, Hidden
 * = blueSlate-400) + the section name + the count badge (blueSlate-100 bg,
 * blueSlate-700 text). The Hidden header doubles as the collapse toggle —
 * a bordered 44px button that flips the expanded state, carrying the
 * "not public · still counts in total" hint when collapsed. The Public
 * section is always expanded. aria-expanded mirrors the toggle.
 * @param {object} props
 * @param {'public' | 'hidden'} props.kind  which section this header rules.
 * @param {number} props.count  the section's live count.
 * @param {boolean} [expanded]  the Hidden section's expanded state.
 * @param {(() => void) | null} [onToggle]  the expand/collapse handler.
 * @returns {object} the header row.
 */
export function SectionHeader({ kind, count, expanded = true, onToggle }) {
  const publicSection = kind === 'public'
  const label = publicSection ? 'Public' : 'Hidden'
  const hint = publicSection ? null : 'not public · still counts in total'

  const accent = publicSection ? 'willowGreen-500' : 'blueSlate-400'

  const content = (
    <>
      <span
        aria-hidden="true"
        className="inline-block shrink-0"
        style={{ width: 4, height: 20, borderRadius: 2, background: `var(--${accent})` }}
      />
      <h2 className="text-section text-blueSlate-950">{label}</h2>
      <span className="rounded-full bg-blueSlate-100 text-blueSlate-700 text-meta font-medium px-2.5 py-0.5">
        {count}
      </span>
    </>
  )

  if (publicSection || !onToggle) {
    return (
      <div className="flex items-center gap-2.5 min-h-[44px]">
        {content}
        {hint ? <span className="text-meta text-blueSlate-700 ml-auto">{hint}</span> : null}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="flex items-center gap-2.5 min-h-[44px] w-full bg-canvas border border-blueSlate-200 rounded-lg px-3 text-left hover:bg-blueSlate-100"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      {content}
      {hint ? <span className="text-meta text-blueSlate-700 ml-auto">{hint}</span> : null}
      <span className="text-meta text-blueSlate-700 shrink-0" aria-hidden="true">
        {expanded ? '▴' : '▾'}
      </span>
    </button>
  )
}
