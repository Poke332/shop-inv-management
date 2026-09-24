/**
 * P1: the ops-nav data (docs/control-panel/IMPLEMENTATION.md "Components"
 * table + docs/IMPLEMENTATION.md §route table are the sources of truth —
 * this mirror drives the OpsShell sidebar).
 *
 * Role gates (visibility, not disabled state):
 *   staff    -> Ongoing Orders, Inventory (read), Products (read)
 *   manager  -> + Reviews
 *   admin    -> + Users
 *
 * Note (decision #8 / sheet inconsistency): the route table grants
 * /ops/products to manager/admin only, but the control-panel spec gives
 * staff a read-only Products item. Until the team resolves it, the staff
 * Products link opens the /ops/products list; P5's page guard may tighten
 * it to redirect staff back to /ops/inventory — no 403, per P1.
 */
export const OPS_NAV_ITEMS = [
  { label: 'Ongoing Orders', to: '/ops/orders', roles: ['staff', 'manager', 'admin'], badge: 'orders' },
  { label: 'Inventory', to: '/ops/inventory', roles: ['staff', 'manager', 'admin'], badge: 'stock', readOnlyFor: ['staff'] },
  { label: 'Products', to: '/ops/products', roles: ['staff', 'manager', 'admin'], badge: null, readOnlyFor: ['staff'] },
  { label: 'Reviews', to: '/ops/reviews', roles: ['manager', 'admin'], badge: null },
  { label: 'Users', to: '/ops/users', roles: ['admin'], badge: null },
]
