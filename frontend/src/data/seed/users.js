/**
 * Seed: 128 User records (ARCHITECTURE §4.2) — 3 staff · 2 managers · 1 admin, rest buyers.
 *
 * The named 5 are the mockup set (user-dashboard table); `ops_rina` is added from the
 * §4.2 mock-credentials table (the manager login home is Inventory Dashboard).
 *
 * @typedef {Object} User
 * @property {string} username  "buyer_102", "ops_marta", "admin_ria" …
 * @property {string} email
 * @property {string} role  "buyer" | "staff" | "manager" | "admin"
 * @property {boolean} active  false → login shows "Account not available"
 * @property {string} lastActiveAt  "2h" style relative display
 * @property {string} password  mock-only; every v1 mock password is "sunset123" (≥8 chars,
 *                              satisfies the login form's min-length validation)
 */

/** @type {User[]} */
export const users = [
  // ---- the 5 named mockup users (§4.2 table, verbatim) ----
  { username: 'buyer_102', email: 'buyer_102@mock.local', role: 'buyer', active: true, lastActiveAt: '2d', password: 'sunset123' },
  { username: 'ops_marta', email: 'marta@mock.local', role: 'staff', active: true, lastActiveAt: '1h', password: 'sunset123' },
  { username: 'ops_dan', email: 'dan@mock.local', role: 'manager', active: false, lastActiveAt: '40d', password: 'sunset123' },
  { username: 'rian_w', email: 'rian@mock.local', role: 'buyer', active: true, lastActiveAt: '6d', password: 'sunset123' },
  { username: 'admin_ria', email: 'ria@mock.local', role: 'admin', active: true, lastActiveAt: '2h', password: 'sunset123' },
  // ---- the credentials-table manager (staff+ login → Inventory Dashboard) ----
  { username: 'ops_rina', email: 'rina@mock.local', role: 'manager', active: true, lastActiveAt: '3d', password: 'sunset123' },
];

// +2 staff (crew of 3 with ops_marta) and 122 synthesized buyers → 128 total.
// (users array is the seed; the store clones it, so extending here is safe.)
users.push(
  { username: 'ops_sari', email: 'sari@mock.local', role: 'staff', active: true, lastActiveAt: '5d', password: 'sunset123' },
  { username: 'ops_bimo', email: 'bimo@mock.local', role: 'staff', active: true, lastActiveAt: '12d', password: 'sunset123' },
);

// buyer_102 · rian_w are already in the array — synthesize 120 more buyers.
const DAYS = ['2d', '3d', '5d', '8d', '12d', '19d', '30d'];
for (let i = 2; i <= 120; i += 1) {
  const num = String(i * 7 + 101).padStart(3, '0');
  users.push({
    username: `buyer_${num}`,
    email: `buyer_${num}@mock.local`,
    role: 'buyer',
    active: true,
    lastActiveAt: DAYS[i % DAYS.length],
    password: 'sunset123',
  });
}

// The §4.2 mock LOGIN CREDENTIALS table (role → email → password) + edge cases.
// mockApi.login/register resolve against this: one active login per role, ops_dan
// disabled → 403 "Account not available", register with any existing email (e.g.
// rian@mock.local) → 409 duplicate.
/**
 * @typedef {Object} CredentialRow
 * @property {string} case
 * @property {string} username
 * @property {string} role
 * @property {string} email
 * @property {string} password
 * @property {string} result
 */
/** @type {CredentialRow[]} */
export const credentials = [
  { case: 'buyer', username: 'buyer_102', role: 'buyer', email: 'buyer_102@mock.local', password: 'sunset123', result: '200 → Main Store' },
  { case: 'staff', username: 'ops_marta', role: 'staff', email: 'marta@mock.local', password: 'sunset123', result: '200 → Ongoing Orders' },
  { case: 'manager', username: 'ops_rina', role: 'manager', email: 'rina@mock.local', password: 'sunset123', result: '200 → Inventory Dashboard' },
  { case: 'admin', username: 'admin_ria', role: 'admin', email: 'ria@mock.local', password: 'sunset123', result: '200 → Inventory Dashboard' },
  { case: 'disabled account', username: 'ops_dan', role: 'manager', email: 'dan@mock.local', password: 'sunset123', result: '403 "Account not available — contact an administrator"' },
  { case: 'duplicate email (register 409)', username: 'rian_w', role: 'buyer', email: 'rian@mock.local', password: 'sunset123', result: 'register with any existing email (e.g. rian@mock.local) → 409 duplicate' },
];

export const USERS_CONTRACT = {
  total: users.length, // 128
  staff: users.filter((u) => u.role === 'staff').length, // 3
  managers: users.filter((u) => u.role === 'manager').length, // 2
  admin: users.filter((u) => u.role === 'admin').length, // 1
};
