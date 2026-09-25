import { useContext } from 'react'

import { CheckoutWizardContext } from '../contexts/CartContext.jsx'

/**
 * The useCheckoutWizard accessor (code-org rule: one custom hook per file):
 * reads the checkout wizard state the CartProvider keeps ABOVE the routes
 * (the step index + the three form states + the post-success receipt
 * snapshot survive "Edit cart" at any step and drop when the user leaves
 * the order flow; not in the URL, not in the cart store).
 * @returns {{active: boolean, step: number,
 *   personal: object, personalErrors: object,
 *   shipping: object, shippingErrors: object,
 *   payment: object, paymentErrors: object,
 *   receipt: ({order: object, payment: object, estimate: string}|null),
 *   beginWizard: () => void,
 *   patchWizard: (patch: object) => void,
 *   finishWizard: () => void,
 *   placeOrder: (extra?: object) => Promise<object>,
 *   orderNumber: (string|null)}}
 * @throws {Error} when called outside <CartProvider>
 */
export function useCheckoutWizard() {
  const ctx = useContext(CheckoutWizardContext)
  if (!ctx) throw new Error('useCheckoutWizard must be used inside <CartProvider>')
  return ctx
}
