/**
 * The 3-segment checkout progress bar pinned above the form
 * (docs/checkout "ProgressBar"): 32px numbered circles + labels + a 2px
 * connecting track. Active / done = tangerine-600 fill + white 14/600
 * digit; pending = blueSlate-200 border + blueSlate-500 digit; labels
 * blueSlate-700 13/500 (active -> blueSlate-950 13/600). role="group",
 * the active step carries aria-current="step"; the receipt view renders
 * all segments done. Labels hide <=389px (the mobile compression in the
 * checkout doc).
 * @param {number} step  1–3; 4 (receipt) = all done.
 * @returns {object} the progress indicator.
 */
export function ProgressBar({ step }) {
  const labels = ['Personal info', 'Shipping address', 'Payment']
  return (
    <div
      role="group"
      aria-label="Checkout progress"
      className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding flex items-start"
    >
      {labels.map((label, i) => {
        const n = i + 1
        const done = step > n || step === 4
        const active = step === n
        return (
          <div key={label} className="contents">
            <div
              className="flex flex-col items-center gap-2 w-12 min-[390px]:w-[96px] shrink-0"
              aria-current={active ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full grid place-items-center text-price font-semibold ${
                  active || done
                    ? 'bg-atomicTangerine-600 text-white'
                    : 'border-2 border-blueSlate-200 bg-canvas text-blueSlate-500'
                }`}
              >
                {n}
              </div>
              <div
                className={`text-meta hidden min-[390px]:block ${
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
