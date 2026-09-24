/**
 * mockApi section: stock (ARCHITECTURE §4.3 rows getStockOverview / setStock).
 * Wired to the shared store. setStock appends a StockSnapshot audit row
 * (source "manual-set") via store.storeSetStock.
 *
 * getStockOverview = the Inventory Dashboard "Needs attention" data: every product
 * with stock 0 (out of stock, first) or stock ≤ lowStockThreshold (5, low), plus
 * the product's current price for the row.
 */

import { nowStamp, productById, storeProducts, storeSetStock, storeStock } from '../store.js';

const delay = () => new Promise((res) => setTimeout(res, 150 + Math.floor(Math.random() * 200)));

export const failure = { on: false };
function injected() {
  if (failure.on) {
    failure.on = false;
    const err = new Error('Injected mock failure (stock)');
    err.mockInjected = true;
    return err;
  }
  return null;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

export const mockApiStock = {
  /**
   * GET /ops/products — inventory-dashboard "Needs attention" rows.
   * @returns {Promise<{items: Array<{productId:string, name:string, category:string, price:number, stock:number, status:"out"|"low"}>, total:number}>}
   *   out-of-stock first, then low stock (ascending).
   */
  async getStockOverview() {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const items = storeProducts
      .filter((p) => p.stock === 0 || p.stock <= p.lowStockThreshold)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        status: p.stock === 0 ? 'out' : 'low',
      }))
      .sort((a, b) => (a.status === b.status ? a.stock - b.stock : a.status === 'out' ? -1 : 1));
    return { items: clone(items), total: items.length };
  },

  /**
   * PATCH /products/:id/stock — inventory-dashboard StockStepper (manager+/admin).
   * Appends a "manual-set" StockSnapshot audit row.
   * @param {string} id
   * @param {number} qty
   * @returns {Promise<import('../seed/products.js').Product>}
   */
  async setStock(id, qty) {
    const fail = injected();
    await delay();
    if (fail) throw fail;
    const q = Number(qty);
    if (!Number.isInteger(q) || q < 0) {
      const err = new Error('Stock quantity must be a non-negative integer');
      err.status = 400;
      throw err;
    }
    const p = storeSetStock(id, q);
    if (!p) {
      const err = new Error(`Product not found: ${id}`);
      err.status = 404;
      throw err;
    }
    return clone(p);
  },
};

// audit rows are exported for the inventory "history" affordance (optional UI)
export { storeStock, nowStamp, productById };
