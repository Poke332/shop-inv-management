import { Link } from 'react-router'

import { PAYMENT_METHODS, formatCardNumber } from '../utils/utils.js'
import { PaymentMethodIcon } from './PaymentMethodIcon.jsx'

/**
 * Step 3 of the checkout wizard — payment (docs/checkout "PaymentMethod"):
 * three radio-cards (Card / Bank transfer / QRIS, 44px rows; selected =
 * blueSlate-100 tint + tangerine radio dot + icon) with per-method
 * conditional inputs in a dashed blueSlate-200 block on blueSlate-50
 * (card number auto-masked, expiry + CVV; bank VA number; QRIS
 * placeholder note). CTA row "Back" + the step-3-only "Place order"
 * (PlaceOrderButton) + the "Edit cart" link. Presentational — the
 * wizard state above the routes owns the values.
 * @param {{value: {method: string, [k: string]: any},
 *   errors: object, onField: (patch: object) => void,
 *   onMethod: (m: string) => void, onBack: () => void,
 *   onPlace: () => void, placing: boolean, placeDisabled: boolean,
 *   placeLabel: string}} props
 * @returns {object} the step-3 card body.
 */
export function PaymentMethod({
  value,
  errors,
  onField,
  onMethod,
  onBack,
  onPlace,
  placing,
  placeDisabled,
  placeLabel,
}) {
  const inputCls = (bad) =>
    `h-11 w-full rounded-lg border bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 ${
      bad ? 'border-strawberryRed-600' : 'border-blueSlate-200'
    }`

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-[26px] h-[26px] rounded-full bg-atomicTangerine-600 text-white text-meta font-semibold grid place-items-center">
          3
        </span>
        <h2 className="text-section text-ink font-semibold">Payment</h2>
      </div>

      <fieldset className="border-0 p-0 m-0">
        <legend className="text-meta font-semibold text-ink block mb-2">Payment method</legend>
        <div className="flex flex-col gap-2">
          {Object.entries(PAYMENT_METHODS).map(([key, meta]) => {
            const selected = value.method === key
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={placing}
                onClick={() => onMethod(key)}
                className={`min-h-11 rounded-lg border flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  selected
                    ? 'border-blueSlate-200 bg-blueSlate-100'
                    : 'border-blueSlate-200 bg-canvas hover:bg-blueSlate-50'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`relative w-4 h-4 rounded-full border-2 shrink-0 ${
                    selected ? 'border-atomicTangerine-600' : 'border-blueSlate-300'
                  }`}
                >
                  {selected ? (
                    <span className="absolute inset-[3px] rounded-full bg-atomicTangerine-600" />
                  ) : null}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <PaymentMethodIcon method={key} />
                    <span className="text-body font-medium text-ink">{meta.label}</span>
                  </span>
                  <span className="text-meta text-blueSlate-700 block mt-1">{meta.sub}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* the per-method conditional inputs: dashed block on blueSlate-50 */}
      <div className="mt-4 p-6 rounded-lg border border-dashed border-blueSlate-200 bg-surface">
        {value.method === 'card' ? (
          <div>
            <div className="mb-4">
              <label htmlFor="co-card-number" className="text-meta font-semibold text-ink block">
                Card number
              </label>
              <input
                id="co-card-number"
                inputMode="numeric"
                autoComplete="off"
                value={formatCardNumber(value.cardNumber || '')}
                disabled={placing}
                placeholder="4444 2222 1111 9999"
                onChange={(e) => onField({ cardNumber: e.target.value.replace(/\D/g, '') })}
                aria-describedby={errors.cardNumber ? 'co-card-error' : undefined}
                className={`mt-2 ${inputCls(!!errors.cardNumber)}`}
              />
              {errors.cardNumber ? (
                <span id="co-card-error" className="text-meta text-strawberryRed-600">
                  {errors.cardNumber}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="co-expiry" className="text-meta font-semibold text-ink block">
                  Expiry
                </label>
                <input
                  id="co-expiry"
                  value={value.expiry || ''}
                  disabled={placing}
                  placeholder="MM/YY"
                  autoComplete="off"
                  onChange={(e) => onField({ expiry: e.target.value })}
                  className={`mt-2 ${inputCls(false)}`}
                />
              </div>
              <div>
                <label htmlFor="co-cvv" className="text-meta font-semibold text-ink block">
                  CVV
                </label>
                <input
                  id="co-cvv"
                  inputMode="numeric"
                  value={value.cvv || ''}
                  disabled={placing}
                  placeholder="•••"
                  autoComplete="off"
                  onChange={(e) => onField({ cvv: e.target.value.replace(/\D/g, '') })}
                  className={`mt-2 ${inputCls(false)}`}
                />
              </div>
            </div>
          </div>
        ) : null}

        {value.method === 'bank_transfer' ? (
          <div className="mb-4">
            <label htmlFor="co-va" className="text-meta font-semibold text-ink block">
              Bank VA number
            </label>
            <input
              id="co-va"
              value={value.vaNumber || ''}
              disabled={placing}
              placeholder="VA number (generated after the order is placed)"
              onChange={(e) => onField({ vaNumber: e.target.value })}
              className={`mt-2 ${inputCls(false)}`}
            />
            <p className="text-meta text-blueSlate-700 mt-2">
              The VA number is issued once the order is placed — this field is optional.
            </p>
          </div>
        ) : null}

        {value.method === 'qris' ? (
          <div>
            <div className="grid place-items-center my-2 w-16 h-16 border border-dashed border-blueSlate-300 rounded-lg bg-canvas">
              <PaymentMethodIcon method="qris" />
            </div>
            <p className="text-meta text-blueSlate-700">
              A QRIS code is generated after the order is placed — pay from any e-wallet app.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-6 mt-6">
        <button type="button" onClick={onBack} className="btn-secondary" disabled={placing}>
          Back
        </button>
        <button
          type="button"
          onClick={onPlace}
          disabled={placeDisabled || placing}
          aria-busy={placing}
          className="btn-primary"
        >
          {placing ? (
            <span className="inline-flex items-center gap-2">
              <span className="spinner" aria-hidden="true" />
              Placing order…
            </span>
          ) : (
            placeLabel
          )}
        </button>
      </div>

      <div className="text-center mt-6">
        <Link to="/cart" className="text-meta font-medium text-atomicTangerine-600 hover:underline">
          Edit cart
        </Link>
      </div>
    </div>
  )
}
