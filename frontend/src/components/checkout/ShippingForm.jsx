/**
 * Step 2 of the checkout wizard — shipping address (docs/checkout
 * "ShippingForm"): the street address (required, min ~20 chars) full
 * width, then the district / city / province / postal code fields in a
 * 2-column grid. Inline errors under-field on blur; CTA row "Back" +
 * "Continue". Presentational — the wizard state above the routes owns
 * the values.
 * @param {{value: {address: string, district: string, city: string,
 *   province: string, postalCode: string},
 *   errors: object, onField: (patch: object) => void,
 *   onFieldBlur: (k: string) => void, onBack: () => void,
 *   onContinue: () => void, locked: boolean}} props
 * @returns {object} the step-2 card body (fields + Back/Continue row).
 */
export function ShippingForm({ value, errors, onField, onFieldBlur, onBack, onContinue, locked }) {
  const inputCls = (bad) =>
    `h-11 w-full rounded-lg border bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 ${
      bad ? 'border-strawberryRed-600' : 'border-blueSlate-200'
    }`
  const field = (k, label, opts = {}) => (
    <div className={opts.mb ? 'mb-4' : ''}>
      <label htmlFor={`co-${k}`} className="text-meta font-semibold text-ink block">
        {label}
      </label>
      <input
        id={`co-${k}`}
        type={opts.type || 'text'}
        value={value[k]}
        disabled={locked}
        placeholder={opts.placeholder}
        onChange={(e) => onField({ [k]: e.target.value })}
        onBlur={() => onFieldBlur(k)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `co-${k}-error` : undefined}
        className={`mt-2 ${inputCls(!!errors[k])}`}
      />
      {errors[k] ? (
        <span id={`co-${k}-error`} className="text-meta text-strawberryRed-600 block">
          {errors[k]}
        </span>
      ) : null}
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-[26px] h-[26px] rounded-full bg-atomicTangerine-600 text-white text-meta font-semibold grid place-items-center">
          2
        </span>
        <h2 className="text-section text-ink font-semibold">Shipping address</h2>
      </div>

      {field('address', 'Address', {
        placeholder: 'Street, number, RT / RW, city',
        mb: true,
      })}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {field('district', 'District', { placeholder: 'Kemang' })}
        {field('city', 'City', { placeholder: 'Jakarta Selatan' })}
        {field('province', 'Province', { placeholder: 'DKI Jakarta' })}
        {field('postalCode', 'Postal code', { placeholder: '12730' })}
      </div>

      <div className="flex items-center justify-between gap-6 mt-6">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="button" onClick={onContinue} className="btn-primary">
          Continue
        </button>
      </div>
    </div>
  )
}
