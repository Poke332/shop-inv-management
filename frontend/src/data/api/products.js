/**
 * mockApi section: products (ARCHITECTURE §4.3 rows getProducts / getProduct /
 * createProduct / updateProduct). Wired to the shared store (../store.js).
 *
 * Note on "128 results": the search-browse mockup renders "128 results" as an
 * illustrative count (docs/search-browse/IMPLEMENTATION.md flags it "illustrative,
 * per mockup"). ARCHITECTURE §4 makes the data layer the single source of truth,
 * and the catalog is 48 products (§4.2). `getProducts` therefore reports the REAL
 * filtered count (`total`); a no-filter search renders "48 results", not "128".
 * The page derives its count from this number — it never hard-codes the mockup's 128.
 */

import {
  productById,
  storeProducts,
  storeCreateProduct,
  storeUpdateProduct,
} from '../store.js';

/** Simulated latency so every page's loading states are exercisable. */
const delay = () => new Promise((res) => setTimeout(res, 150 + Math.floor(Math.random() * 200)));

/** Optional failure injection: set `failure.on = true` to make the NEXT call reject. */
export const failure = { on: false };
function injected() {
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (products)');
    err.mockInjected = true;
    return err;
  }
  return null;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

/**
 * @param {{query?:string, category?:string, brand?:string, priceMin?:number,
 *         priceMax?:number, sort?:string}} [filter]
 * @returns {Promise<{items: Array<import('../seed/products.js').Product>, total:number, hasMore:boolean}>}
 */
function applyFilter(filter) {
  let items = [...storeProducts];
  if (filter.category) items = items.filter((p) => p.category === filter.category);
  if (filter.brand) items = items.filter((p) => p.brand === filter.brand);
  if (filter.query) {
    const q = String(filter.query).toLowerCase();
    items = items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    );
  }
  if (filter.priceMin != null) items = items.filter((p) => p.price >= filter.priceMin);
  if (filter.priceMax != null) items = items.filter((p) => p.price <= filter.priceMax);

  const sort = filter.sort || 'featured';
  if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
  else {
    // default "Featured": featured first, then on-sale, then cheaper first
    items.sort(
      (a, b) =>
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
        (b.onSale ? 1 : 0) - (a.onSale ? 1 : 0) ||
        a.price - b.price,
    );
  }
  return items;
}

export const mockApiProducts = {
  /**
   * GET /products?query&category&brand&priceMin&priceMax&sort
   * used by main-store, search-browse.
   * @param {object} [filter]
   * @returns {Promise<{items: object[], total:number, hasMore:boolean}>}
   */
  async getProducts(filter = {}) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const items = applyFilter(filter);
    return { items: clone(items), total: items.length, hasMore: false };
  },

  /**
   * GET /products/:id — product-details.
   * @param {string} id
   * @returns {Promise<import('../seed/products.js').Product>}
   */
  async getProduct(id) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const p = productById(id);
    if (!p) {
      const err = new Error(`Product not found: ${id}`);
      err.status = 404;
      throw err;
    }
    return clone(p);
  },

  /**
   * POST /products (per-product-dashboard create). Form includes specs pairs + stock.
   * @param {object} form
   * @returns {Promise<import('../seed/products.js').Product>}
   */
  async createProduct(form) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    return clone(storeCreateProduct(form));
  },

  /**
   * PATCH /products/:id (per-product-dashboard edit, incl. round-9 specs + stock).
   * @param {string} id
   * @param {object} form
   * @returns {Promise<import('../seed/products.js').Product>}
   */
  async updateProduct(id, form) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const p = storeUpdateProduct(id, form);
    if (!p) {
      const err = new Error(`Product not found: ${id}`);
      err.status = 404;
      throw err;
    }
    return clone(p);
  },
};
