/**
 * P2b durable mock store (ARCHITECTURE §4.5 ruling): hydrate + commit helpers
 * over localStorage under a VERSIONED key.
 *
 * Snapshot shape (JSON under STORAGE_KEY):
 *   { version: 1, savedAt: "<ISO timestamp>", slices: { products, orders,
 *     reviews, users, stock } }
 *
 * The 5 mutable slices are the ones store.js owns. What is deliberately NOT
 * persisted (v1):
 *  - categories (seed/categories.js) — static domain content, no category CRUD
 *    in v1 (the §4.3 "one extra static" section), so there is nothing to save.
 *  - cart — CartStore keeps session semantics (client-session state, P4's
 *    concern; see api/cart.js), not the durable mock store.
 *
 * No new dependencies: browser built-ins only (localStorage + JSON). In
 * non-browser environments (the node smoke test) localStorage is absent and
 * every helper no-ops — the store degrades to in-memory-only there.
 */

export const STORAGE_KEY = 'sunset-mock-data-v1';
export const SNAPSHOT_VERSION = 1;

/** The slice names persisted — must stay in lockstep with store.js's 5 arrays. */
const SLICES = ['products', 'orders', 'reviews', 'users', 'stock'];

function storage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

/** True when the parsed snapshot matches the version + shape contract. */
function isValidSnapshot(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== SNAPSHOT_VERSION) return false;
  if (typeof data.savedAt !== 'string') return false;
  for (const name of SLICES) {
    const rows = data.slices && data.slices[name];
    if (!Array.isArray(rows)) return false;
    // row-shape check: every record is an object (a null/undefined row means
    // the snapshot was hand-edited or truncated — treat it as corrupt).
    if (!rows.every((row) => row && typeof row === 'object')) return false;
  }
  return true;
}

/**
 * Hydration read at store module load (store.js): the parsed snapshot when
 * version match + shape check + JSON.parse all succeed, else null.
 * @returns {null | {version:number, savedAt:string, slices:object}}
 */
export function readSnapshot() {
  const ls = storage();
  if (!ls) return null;
  let raw = null;
  try {
    raw = ls.getItem(STORAGE_KEY);
  } catch {
    return null; // storage inaccessible — degrade to in-memory only
  }
  if (!raw) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null; // corrupt JSON → the caller clears the key and falls back to seed
  }
  if (!isValidSnapshot(data)) return null;
  return data;
}

/** Remove the storage key (resetData() escape hatch + the stale-key clear). */
export function clearSnapshot() {
  const ls = storage();
  if (!ls) return;
  try {
    ls.removeItem(STORAGE_KEY);
  } catch {
    // storage inaccessible — nothing to clear
  }
}

/**
 * Commit the 5 mutable slices to the versioned key (synchronous — the payload
 * is small: 48 products, ~6 orders, 128 reviews, 128 users, ~20 audit rows).
 * @param {{products:object[], orders:object[], reviews:object[], users:object[], stock:object[]}} slices
 */
export function writeSnapshot(slices) {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify({
      version: SNAPSHOT_VERSION,
      savedAt: new Date().toISOString(),
      slices,
    }));
  } catch {
    // QuotaExceeded / private-mode storage failure — the store stays in-memory
  }
}
