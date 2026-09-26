/**
 * Smoke test: import the mockApi facade + exercise the §4.3 contract +
 * cross-check every mockup value the task's "adjust to what the web needs"
 * paragraph enumerates. Run: `node src/data/smoke.test.js` from frontend/.
 * (Development aid — not part of the app's import surface.)
 */
import { mockApi } from './index.js';

let pass = 0;
let fail = 0;
function check(label, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`  ok  ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// ---- products: getProducts + P-231 product-details values ----
const { total } = await mockApi.getProducts();
check('getProducts returns the 48-product catalog', total === 48, `total=${total}`);
const p = await mockApi.getProduct('P-231');
check('P-231 sale price 1 290 000 / was 1 518 000', p.price === 1290000 && p.originalPrice === 1518000 && p.onSale === true);
check('P-231 34 in stock, featured', p.stock === 34 && p.featured === true);
check('P-231 specs = the 6 spec pairs', p.specs.length === 6 && p.specs[0].key === 'Model' && p.specs[5].value === '5.4 g per bud');
const anker = await mockApi.getProduct('P-198');
check('P-198 Anker 735 PB stock 5 → LOW', anker.stock === 5 && anker.featured === true);
const router = await mockApi.getProduct('P-064');
check('P-064 ASUS RT-AX58 stock 0 → OUT', router.stock === 0);

// ---- categories: the 6 tiles ----
const cats = await mockApi.getCategories();
check('6 categories, deep-link slugs', cats.length === 6 && cats[1].slug === 'smart-home' && cats[3].slug === 'laptops');

// ---- reviews: 122 / 6 / 128 / avg 4.3 on P-231 ----
const rev = await mockApi.getProductReviews('P-231');
check('reviews 122 public + 6 hidden = 128 total', rev.publicCount === 122 && rev.hiddenCount === 6 && rev.total === 128, `${rev.publicCount}/${rev.hiddenCount}/${rev.total}`);
check('review average 4.3 (incl. hidden)', rev.average === 4.3, String(rev.average));
check('public list excludes hidden', rev.items.length === 122 && !rev.items.some((r) => r.id === 'R-0004'));
const all = await mockApi.getProductReviewsAll('P-231');
check('reviewsAll = 128 incl. hidden', all.items.length === 128);
const r1 = all.items.find((r) => r.id === 'R-0001');
check('R-0001 buyer_102 4★ + seller comment', r1.rating === 4 && r1.sellerComment?.text === 'Thanks — firmware 2.1 improved ANC.');
const r4 = all.items.find((r) => r.id === 'R-0004');
check('R-0004 buyer_311 2★ hidden + replacement comment', r4.state === 'hidden' && r4.rating === 2 && r4.sellerComment?.text === 'Replacement shipped — order #WB-0901.');

// ---- cart mock session: P-231 ×1 + P-198 ×1 = 1.670.000 ----
const cart = await mockApi.getCart();
check('cart session P-231 ×1 + P-198 ×1 = 1 670 000', cart.subtotal === 1670000 && cart.count === 2, `subtotal=${cart.subtotal}`);

// ---- orders: WB-1042 receipt table + mutation visibility ----
const ord = await mockApi.getOrders('pending');
const wb1042 = ord.items.find((o) => o.id === 'WB-1042');
check(
  'WB-1042: 2 lines, 1 570 000 + 100 000 = 1 670 000, pending, jordan.wjy',
  wb1042.lines.length === 2 && wb1042.subtotal === 1570000 && wb1042.shipping === 100000 &&
    wb1042.total === 1670000 && wb1042.status === 'pending' && wb1042.buyer === 'jordan.wjy',
);
check('WB-1042 Anker line @ 280 000 (order-time snapshot)', wb1042.lines[1].unitPrice === 280000);
check('WB-1042 shipping address Jl. Kemang Selatan 12', wb1042.shippingAddress.address === 'Jl. Kemang Selatan 12');
const adv = await mockApi.advanceOrderStatus('WB-1042', 'processing');
check('advance WB-1042 pending → processing', adv.status === 'processing');
const pending2 = await mockApi.getOrders('pending');
check('mutation visible: WB-1042 no longer pending', !pending2.items.some((o) => o.id === 'WB-1042'));

// createOrder: stock decrement + 409 conflict + idempotent retry
const c1 = await mockApi.createOrder({
  id: 'WB-1043',
  lines: [{ productId: 'P-231', qty: 1 }, { productId: 'P-198', qty: 1 }],
  paymentMethod: 'card',
  shipping: 0,
});
check('createOrder WB-1043 lands pending', c1.id === 'WB-1043' && c1.status === 'pending');
const prod231 = await mockApi.getProduct('P-231');
check('createOrder decremented P-231 stock', prod231.stock === 33, `34 → ${prod231.stock}`);
try {
  await mockApi.createOrder({ id: 'WB-1044', lines: [{ productId: 'P-064', qty: 1 }], shipping: 0 });
  check('createOrder 409 on out-of-stock P-064', false);
} catch (e) {
  check('createOrder 409 on out-of-stock P-064', e.status === 409 && e.code === 'STOCK_CONFLICT');
}
const c1b = await mockApi.createOrder({ id: 'WB-1043', lines: [{ productId: 'P-231', qty: 1 }], shipping: 0 });
check('idempotent retry: same id returns existing order', c1b.id === 'WB-1043' && c1b.lines.length === 2);

// ---- users: dashboard 5 rows + credentials table ----
const users = await mockApi.getUsers();
const names = users.items.map((u) => u.username);
check('user dashboard has the 5 named rows', ['buyer_102', 'ops_marta', 'ops_dan', 'rian_w', 'admin_ria'].every((n) => names.includes(n)));
const dan = users.items.find((u) => u.username === 'ops_dan');
check('ops_dan row = disabled manager', dan.role === 'manager' && dan.active === false);
const marta = await mockApi.setUserRole('ops_marta', 'manager');
check('setUserRole ops_marta → manager', marta.role === 'manager');
const lg = await mockApi.login('buyer_102@mock.local', 'sunset123');
check('login buyer → 200 role buyer', lg.role === 'buyer');
try {
  await mockApi.login('dan@mock.local', 'sunset123');
  check('login ops_dan → 403 disabled', false);
} catch (e) {
  check('login ops_dan → 403 disabled', e.status === 403 && e.message.startsWith('Account not available'));
}
try {
  await mockApi.register({ username: 'x', email: 'rian@mock.local', password: 'sunset123' });
  check('register duplicate email → 409', false);
} catch (e) {
  check('register duplicate email → 409', e.status === 409);
}

// ---- stock: overview + setStock audit row ----
const ov = await mockApi.getStockOverview();
check('stock overview: out-of-stock first, then low', ov.items[0].productId === 'P-064' && ov.items[0].status === 'out' && ov.items[1].status === 'low');
const set = await mockApi.setStock('P-087', 50);
check('setStock P-087 → 50', set.stock === 50);

// ---- search-browse filter path ----
const audio = await mockApi.getProducts({ category: 'audio', query: 'sony' });
check(
  'search filter category=audio + query=sony → Sony audio items',
  audio.items.length === 3 && audio.items.every((i) => i.category === 'audio' && i.brand === 'Sony'),
  audio.items.map((i) => i.name).join(', '),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
