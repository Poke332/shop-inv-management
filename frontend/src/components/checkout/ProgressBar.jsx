/** Visual progress only: the existing wizard owns the step and validation. */
export function ProgressBar({ step }) {
  const labels = ['Personal info', 'Shipping address', 'Payment']
  return (
    <div
      role="group"
      aria-label="Checkout progress"
      className="checkout-progress bg-canvas border border-blueSlate-200 rounded-xl px-4 py-3 md:px-card-padding md:py-card-padding flex items-start"
    >
      {labels.map((label, i) => {
        const n = i + 1
        const done = step > n || step === 4
        const active = step === n
        return (
          <div key={label} className="contents">
            <div
              className="flex flex-col items-center gap-2 flex-1 min-w-0 md:w-[96px] md:flex-none md:shrink-0"
              aria-current={active ? 'step' : undefined}
            >
              <div
                role="img"
                aria-label={`Step ${n} of 3: ${label} — ${active ? 'in progress' : done ? 'completed' : 'upcoming'}`}
                data-state={active ? 'current' : done ? 'complete' : 'upcoming'}
                className={`checkout-step-circle w-8 h-8 rounded-full ${
                  active || done
                    ? 'bg-atomicTangerine-600'
                    : 'border-2 border-blueSlate-200 bg-canvas'
                }`}
              >
                <span aria-hidden="true">{n}</span>
              </div>
              <div
                className={`text-meta hidden min-[390px]:block text-center md:whitespace-nowrap ${
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
