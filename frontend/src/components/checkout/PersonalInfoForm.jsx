/**
 * Step 1 of the checkout wizard — personal info (docs/checkout
 * "PersonalInfoForm"): name / phone / email (loose-validated, rules in
 * utils) + an optional note. Errors surface under-field on blur
 * (strawberryRed-600, aria-describedby); the CTA row is "Continue" only.
 * Presentational — the wizard state above the routes owns the values.
 * @param {{value: {name: string, phone: string, email: string, note: string},
 *   errors: object, onField: (patch: object) => void,
 *   onFieldBlur: (k: string) => void, onContinue: () => void,
 *   locked: boolean}} props
 * @returns {object} the step-1 card body (fields + Continue row).
 */
export function PersonalInfoForm({ value, errors, onField, onFieldBlur, onContinue, locked }) {
  const inputCls = (bad) =>
    `h-11 w-full rounded-lg border bg-canvas px-3 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 ${
      bad ? 'border-strawberryRed-600' : 'border-blueSlate-200'
    }`
  const err = (k) =>
    errors[k] ? (
      <span id={`personal-${k}-error`} className="text-meta text-strawberryRed-600">
        {errors[k]}
      </span>
    ) : null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-[26px] h-[26px] rounded-full bg-atomicTangerine-600 text-white text-meta font-semibold grid place-items-center">
          1
        </span>
        <h2 className="text-section text-ink font-semibold">Personal information</h2>
      </div>

      <div className="mb-4">
        <label htmlFor="co-name" className="text-meta font-semibold text-ink block">Name</label>
        <input
          id="co-name"
          type="text"
          autoComplete="name"
          value={value.name}
          disabled={locked}
          placeholder="Your full name"
          onChange={(e) => onField({ name: e.target.value })}
          onBlur={() => onFieldBlur('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'co-name-error' : undefined}
          className={`mt-2 ${inputCls(!!errors.name)}`}
        />
        {err('name')}
      </div>

      <div className="mb-4">
        <label htmlFor="co-phone" className="text-meta font-semibold text-ink block">Phone</label>
        <input
          id="co-phone"
          type="tel"
          autoComplete="tel"
          value={value.phone}
          disabled={locked}
          placeholder="+62 812-3456-7890"
          onChange={(e) => onField({ phone: e.target.value })}
          onBlur={() => onFieldBlur('phone')}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'co-phone-error' : undefined}
          className={`mt-2 ${inputCls(!!errors.phone)}`}
        />
        {err('phone')}
      </div>

      <div className="mb-4">
        <label htmlFor="co-email" className="text-meta font-semibold text-ink block">Email</label>
        <input
          id="co-email"
          type="email"
          autoComplete="email"
          value={value.email}
          disabled={locked}
          placeholder="you@example.com"
          onChange={(e) => onField({ email: e.target.value })}
          onBlur={() => onFieldBlur('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'co-email-error' : undefined}
          className={`mt-2 ${inputCls(!!errors.email)}`}
        />
        {err('email')}
      </div>

      <div className="mb-4">
        <label htmlFor="co-note" className="text-meta font-semibold text-ink block">
          Note (optional)
        </label>
        <textarea
          id="co-note"
          rows={2}
          value={value.note}
          disabled={locked}
          placeholder="Delivery or packaging notes, e.g. fragile item, extra packaging"
          onChange={(e) => onField({ note: e.target.value })}
          className="mt-2 w-full rounded-lg border border-blueSlate-200 bg-canvas px-3 py-2.5 text-body text-ink placeholder:text-blueSlate-500 focus:outline-none focus:ring-2 focus:ring-atomicTangerine-500 focus:ring-offset-2 resize-y min-h-11"
        />
      </div>

      <div className="flex items-center justify-between gap-6 mt-6">
        <div />
        <button type="button" onClick={onContinue} className="btn-primary">
          Continue
        </button>
      </div>
    </div>
  )
}
