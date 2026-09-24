/**
 * mockApi section: categories (ARCHITECTURE §4.3 — the future Express table has no
 * categories endpoint, so this section module is the one extra: the 6 Category records
 * are static domain content the main-store tiles render from). Shaped like the other
 * sections (Promise-returning, simulated latency, optional failure injection) so the
 * swap pattern stays uniform. Categories are static seed content — no mutation, no
 * store clone — so this reads the seed directly (the §4.3 "one shared store" ruling
 * covers the mutable record arrays only).
 */

import { categories } from '../seed/categories.js';

/** Simulated latency so every page's loading states are exercisable. */
const delay = () => new Promise((res) => setTimeout(res, 150 + Math.floor(Math.random() * 200)));

/** Optional failure injection: set `failure.on = true` to make the NEXT call reject. */
export const failure = { on: false };
function injected() {
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (categories)');
    err.mockInjected = true;
    return err;
  }
  return null;
}

export const mockApiCategories = {
  /** GET /categories (static seed; §4.3 "used by": main-store category tiles) */
  async getCategories() {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    return categories.map((c) => ({ ...c }));
  },
};
