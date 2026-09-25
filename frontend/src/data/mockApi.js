/**
 * mockApi facade — the SINGLE module the future Express + SQL backend replaces.
 *
 * This object's full function list equals the ARCHITECTURE §4.3 "mockApi function"
 * column, assembled from the section modules (api/*.js), one .js per future API
 * section + the CartStore exception:
 *
 *   getProducts, getProduct, createProduct, updateProduct          (api/products.js)
 *   getProductReviews, getProductReviewsAll, setReviewHidden,     (api/reviews.js)
 *   setSellerComment
 *   addToCart, setQty, removeLine, getCart, clearCart             (api/cart.js —
 *                                                                   CartStore exception:
 *                                                                   client session state,
 *                                                                   NOT the shared store)
 *   createOrder, getMyOrders, submitReview, getOrders,            (api/orders.js)
 *   advanceOrderStatus
 *   getStockOverview, setStock                                     (api/stock.js)
 *   getUsers, setUserRole, setUserActive, login, register         (api/users.js)
 *   getCategories                                                  (api/categories.js —
 *                                                                   the static one extra)
 *
 * Simulated latency + optional failure injection live on each section (see its
 * `failure` export); the store.js shared store is the single source of truth
 * every read/write reflects (one shared store, durable via the versioned
 * localStorage snapshot — ARCHITECTURE §4.5).
 *
 * `resetData()` — the durable-store escape hatch: removes the storage key,
 * re-clones the seeds in place, and re-emits the pristine snapshot. API-ONLY
 * for now (no UI affordance; a dev-only reset button may hook it later).
 */

import { mockApiCategories } from './api/categories.js';
import { mockApiProducts } from './api/products.js';
import { mockApiOrders } from './api/orders.js';
import { mockApiReviews } from './api/reviews.js';
import { mockApiUsers } from './api/users.js';
import { mockApiStock } from './api/stock.js';
import { mockApiCart } from './api/cart.js';
import { resetStore } from './store.js';

/**
 * The one object the app imports (`import { mockApi } from '@/data'`). Every method
 * simulates latency (per-section `delay`) and rejects with a 4xx/5xx `.status`
 * on failure — the shape the future Express backend will return.
 * @type {object}
 */
export const mockApi = {
  // categories
  ...mockApiCategories,
  // products
  ...mockApiProducts,
  // orders
  ...mockApiOrders,
  // reviews
  ...mockApiReviews,
  // users + auth
  ...mockApiUsers,
  // stock
  ...mockApiStock,
  // cart (CartStore exception — session state, NOT the durable shared store)
  ...mockApiCart,
  /**
   * Reset the durable mock store to the pristine seeds (ARCHITECTURE §4.5) —
   * clears the versioned localStorage key, re-clones the seed arrays in place,
   * and re-emits the pristine snapshot so the key mirrors the re-seeded store.
   * A dev/test escape hatch only; the app has no reset UI.
   * @returns {void}
   */
  resetData() {
    resetStore();
  },
};

// Exposed so a page or test can arm the NEXT section call to reject (the
// "error" mockup states are exercisable per section; each section module also
// exports its own `failure` flag).
/**
 * Per-section failure flags: each arms the NEXT call of its section to reject.
 * @type {object} categoriesFailure  the api/categories.js `failure` flag.
 * @type {object} productsFailure    the api/products.js `failure` flag.
 * @type {object} ordersFailure      the api/orders.js `failure` flag.
 * @type {object} reviewsFailure     the api/reviews.js `failure` flag.
 * @type {object} usersFailure       the api/users.js `failure` flag.
 * @type {object} stockFailure       the api/stock.js `failure` flag.
 * @type {object} cartFailure        the api/cart.js `failure` flag.
 */
/** The categories section's `failure` flag, re-exported as categoriesFailure. */
export {
  failure as categoriesFailure,
} from './api/categories.js';
/** The products section's `failure` flag, re-exported as productsFailure. */
export {
  failure as productsFailure,
} from './api/products.js';
/** The orders section's `failure` flag, re-exported as ordersFailure. */
export {
  failure as ordersFailure,
} from './api/orders.js';
/** The reviews section's `failure` flag, re-exported as reviewsFailure. */
export {
  failure as reviewsFailure,
} from './api/reviews.js';
/** The users section's `failure` flag, re-exported as usersFailure. */
export {
  failure as usersFailure,
} from './api/users.js';
/** The stock section's `failure` flag, re-exported as stockFailure. */
export {
  failure as stockFailure,
} from './api/stock.js';
/** The cart section's `failure` flag, re-exported as cartFailure. */
export {
  failure as cartFailure,
} from './api/cart.js';
