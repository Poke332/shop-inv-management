/**
 * The 3-segment checkout progress bar pinned above the form
 * (docs/checkout "ProgressBar"): 32px status circles + labels + a 2px
 * connecting track. Active / done = tangerine-600 fill; pending =
 * blueSlate-200 border on canvas (empty circles — the numbered-glyph
 * variant was optically off-center on the 32px circle, so step number
 * rides the label + aria only). Labels blueSlate-700 13/500 (active ->
 * blueSlate-950 13/600), centered so a wrapped desktop block sits under
 * its circle. role="group", the active step carries aria-current="step";
 * each circle is role="img" with a per-step aria-label; the receipt view
 * renders all segments done. Labels hide <=389px (the mobile compression
 * in the checkout doc).
 * @param {number} step  1–3; 4 (receipt) = all done.
 * @returns {object} the progress indicator.
 */
export function ProgressBar({ step }) {
  const labels = ['Personal info', 'Shipping address', 'Payment']
  return (
    <div
      role="group"
      aria-label="Checkout progress"
      // mobile: tighter box padding (16px / 12px) so the 3 segments + 2
      // tracks fit 320; desktop restores the 24px card padding (matching
      // longhands so the override is unambiguous in the cascade)
      className="bg-canvas border border-blueSlate-200 rounded-xl px-4 py-3 md:px-card-padding md:py-card-padding flex items-start"
    >
      {labels.map((label, i) => {
        const n = i + 1
        const done = step > n || step === 4
        const active = step === n
        return (
          <div key={label} className="contents">
            {/* mobile: flex-1 min-w-0 so the 3 segments + 2 tracks share the
                available width evenly (no side clip at 390/320); the labels
                wrap under the circle. desktop: the fixed 96px layout. */}
            <div
              className="flex flex-col items-center gap-2 flex-1 min-w-0 md:w-[96px] md:flex-none md:shrink-0"
              aria-current={active ? 'step' : undefined}
            >
              {/* the digit was optically off-center in the 32px circle on
                  desktop (the 20px line box can't be centered by
                  place-items-center), so the step is marked by an empty
                  status circle: filled tangerine = done/active, hollow =
                  pending. the label under it + aria-current carry the
                  meaning; the circle itself is role="img" + a per-step
                  aria-label so the sequence stays navigable by screen readers. */}
              <div
                role="img"
                aria-label={`Step ${n} of 3: ${label} — ${active ? 'in progress' : done ? 'completed' : 'upcoming'}`}
                className={`w-8 h-8 rounded-full ${
                  active || done
                    ? 'bg-atomicTangerine-600'
                    : 'border-2 border-blueSlate-200 bg-canvas'
                }`}
              />
              <div
                className={`text-meta hidden min-[390px]:block text-center ${
                  active ? 'text-blueSlate-950 font-semibold' : 'text-blueSlate-700 font-medium'
                }`}
              >
                {label}
              </div>
            </div>
            {n < 3 ? (
              <div
                className={`flex-1 h-0.5 mt-4 mx-2 ${
                  step > n ? 'bg-atomicTangerine-600' : 'bg-blueSlate-200'
                }`}
                role="presentation"
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
