import { useCheckoutWizard } from '../hooks/useCheckoutWizard.js'
import { isValidPhone, isValidEmail, paymentSummaryLine } from '../utils/utils.js'
import { PersonalInfoForm } from './PersonalInfoForm.jsx'
import { ShippingForm } from './ShippingForm.jsx'
import { PaymentMethod } from './PaymentMethod.jsx'
import { Receipt } from './Receipt.jsx'
import { ProgressBar } from './ProgressBar.jsx'

/**
 * The checkout wizard builder (docs/checkout "CheckoutWizard"): the 3-step
 * form card stack (Personal info → Shipping address → Payment) + the
 * receipt view on success. The step index + all form state live in the
 * provider context ABOVE the routes (surviving "Edit cart"); this
 * component owns the per-step validation UX (blur errors, CTA enabling)
 * and hands the validated forms back to the page-level submit handler.
 * Presentational otherwise.
 * @param {{onPlace: () => void, placing: boolean,
 *   placeDisabled: boolean, placeLabel: string,
 *   onEditCart?: () => void}} props
 * @returns {object} the wizard's left column (progress + active step card).
 */
export function CheckoutWizard({ onPlace, placing, placeDisabled, placeLabel, onEditCart }) {
  const w = useCheckoutWizard()

  // ---- step-1 validation (loose rules from utils) -------------------------
  const personalErr = (k) => {
    if (k === 'name' && !w.personal.name.trim()) return 'Enter your name.'
    if (k === 'phone' && !isValidPhone(w.personal.phone)) return 'Enter a valid phone number (at least 8 digits).'
    if (k === 'email' && !isValidEmail(w.personal.email)) return 'Enter a valid email address.'
    return null
  }
  const personalBlur = (k) =>
    w.patchWizard({ personalErrors: { ...w.personalErrors, [k]: personalErr(k) } })
  const personalField = (patch) =>
    w.patchWizard({ personal: { ...w.personal, ...patch }, personalErrors: w.personalErrors })

  const continue1 = () => {
    const errors = {}
    if (!w.personal.name.trim()) errors.name = 'Enter your name.'
    if (!isValidPhone(w.personal.phone)) errors.phone = 'Enter a valid phone number (at least 8 digits).'
    if (!isValidEmail(w.personal.email)) errors.email = 'Enter a valid email address.'
    if (Object.keys(errors).length) {
      w.patchWizard({ personalErrors: errors })
      return
    }
    w.patchWizard({ personalErrors: {}, step: 2 })
  }

  // ---- step-2 validation ---------------------------------------------------
  const shippingErr = (k) => {
    if (k === 'address' && w.shipping.address.trim().length < 20) return 'Address must be at least 20 characters.'
    if (k !== 'address' && !w.shipping[k].trim()) return 'Required.'
    return null
  }
  const shippingBlur = (k) =>
    w.patchWizard({ shippingErrors: { ...w.shippingErrors, [k]: shippingErr(k) } })
  const shippingField = (patch) =>
    w.patchWizard({ shipping: { ...w.shipping, ...patch }, shippingErrors: w.shippingErrors })

  const continue2 = () => {
    const errors = {}
    if (w.shipping.address.trim().length < 20) errors.address = 'Address must be at least 20 characters.'
    for (const k of ['district', 'city', 'province', 'postalCode']) {
      if (!w.shipping[k].trim()) errors[k] = 'Required.'
    }
    if (Object.keys(errors).length) {
      w.patchWizard({ shippingErrors: errors })
      return
    }
    w.patchWizard({ shippingErrors: {}, step: 3 })
  }

  if (w.step === 4 && w.receipt) {
    return (
      <div className="flex flex-col gap-6 min-w-0 flex-1">
        <ProgressBar step={4} />
        <Receipt
          order={w.receipt.order}
          paymentLine={paymentSummaryLine(w.receipt.order.paymentMethod, w.receipt.payment)}
          estimate={w.receipt.estimate}
          onEditCart={onEditCart}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 flex-1">
      <ProgressBar step={w.step} />
      {w.step === 1 ? (
        <section className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-label="Personal information">
          <PersonalInfoForm
            value={w.personal}
            errors={w.personalErrors}
            onField={personalField}
            onFieldBlur={personalBlur}
            onContinue={continue1}
            locked={placing}
          />
        </section>
      ) : null}
      {w.step === 2 ? (
        <section className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-label="Shipping address">
          <ShippingForm
            value={w.shipping}
            errors={w.shippingErrors}
            onField={shippingField}
            onFieldBlur={shippingBlur}
            onBack={() => w.patchWizard({ step: 1 })}
            onContinue={continue2}
            locked={placing}
          />
        </section>
      ) : null}
      {w.step === 3 ? (
        <section className="bg-canvas border border-blueSlate-200 rounded-xl p-card-padding" aria-label="Payment">
          <PaymentMethod
            value={w.payment}
            errors={w.paymentErrors}
            onField={(patch) => w.patchWizard({ payment: { ...w.payment, ...patch } })}
            onMethod={(m) => w.patchWizard({ payment: { ...w.payment, method: m } })}
            onBack={() => w.patchWizard({ step: 2 })}
            onPlace={onPlace}
            placing={placing}
            placeDisabled={placeDisabled}
            placeLabel={placeLabel}
          />
        </section>
      ) : null}
    </div>
  )
}
