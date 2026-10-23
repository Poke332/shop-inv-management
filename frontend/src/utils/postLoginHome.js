export function postLoginHome(role) {
  if (role === 'staff') return '/ops/orders'
  if (role === 'manager' || role === 'admin') return '/ops/inventory'
  return '/'
}
