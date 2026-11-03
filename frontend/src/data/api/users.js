/**
 * mockApi section: users + auth (ARCHITECTURE §4.3 rows getUsers / setUserRole /
 * setUserActive / login / register). Wired to the shared store.
 *
 * login/register resolve against the §4.2 mock-credentials table: one active login
 * per role, ops_dan disabled → 403 "Account not available — contact an
 * administrator", register with any existing email (e.g. rian@mock.local) → 409
 * duplicate. The login response carries `role` so the router can send the session
 * to the per-role home (staff → Ongoing Orders, manager/admin → Inventory
 * Dashboard, buyer → Main Store).
 */

import { storeRegisterUser, storeSetUserActive, storeSetUserRole, storeUsers, userByUsername } from '../store.js';

const delay = () => new Promise((res) => setTimeout(res, 150 + Math.floor(Math.random() * 200)));

/** Per-section failure-injection flag: set `.on = true` to make the NEXT
 * call of this section reject (the "error" mockup states are exercisable).
 * @type {{on: boolean}}
 */
export const failure = { on: false };
function injected() {
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (users)');
    err.mockInjected = true;
    return err;
  }
  return null;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/**
 * The users + auth section of the mockApi facade (ARCHITECTURE §4.3):
 * getUsers / setUserRole / setUserActive / login / register.
 * @type {object}
 */
export const mockApiUsers = {
  /**
   * POST /auth/login (returns role → routing).
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user:object, role:string}>} rejects 401 (bad credentials) /
   *   403 (disabled account, err.message = "Account not available — contact an administrator").
   */
  async login(email, password) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const u = storeUsers.find((row) => row.email === email);
    if (!u || u.password !== password) {
      const err = new Error('Email or password is incorrect.');
      err.status = 401;
      throw err;
    }
    if (!u.active) {
      const err = new Error('Account not available — contact an administrator');
      err.status = 403;
      throw err;
    }
    return { user: clone(u), role: u.role };
  },

  /**
   * POST /users — register (409 duplicate email).
   * @param {{username:string, email:string, password:string}} payload
   * @returns {Promise<object>} rejects 409 (err.message "An account with this email
   *   already exists.") — the §4.2 rian@mock.local duplicate-email case.
   */
  async register(payload) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const u = storeRegisterUser(payload);
    if (u.error) {
      const err = new Error(u.message);
      err.status = u.error; // 409
      throw err;
    }
    return clone(u);
  },

  /**
   * GET /ops/users — user-dashboard (admin).
   * @returns {Promise<{items: object[], counts: {staff:number, managers:number, admin:number}}>}
   */
  async getUsers() {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const items = clone(storeUsers);
    const counts = {
      staff: storeUsers.filter((u) => u.role === 'staff').length,
      managers: storeUsers.filter((u) => u.role === 'manager').length,
      admin: storeUsers.filter((u) => u.role === 'admin').length,
    };
    return { items, counts };
  },

  /**
   * PATCH /users/:id/role — user-dashboard role select (ConfirmDialog-gated UI).
   * @param {string} id  the username
   * @param {string} role
   * @returns {Promise<object>}
   */
  async setUserRole(id, role) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const u = storeSetUserRole(id, role);
    if (!u) {
      const err = new Error(`User not found: ${id}`);
      err.status = 404;
      throw err;
    }
    return clone(u);
  },

  /**
   * PATCH /users/:id/active — user-dashboard disable toggle.
   * @param {string} id
   * @param {boolean} active
   * @returns {Promise<object>}
   */
  async setUserActive(id, active) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const u = storeSetUserActive(id, active);
    if (!u) {
      const err = new Error(`User not found: ${id}`);
      err.status = 404;
      throw err;
    }
    return clone(u);
  },
};

// Keep userByUsername referenced for tooling (ops pages look users up by name).
/** The user lookup helper, re-exported for the ops pages. */
export { userByUsername };
