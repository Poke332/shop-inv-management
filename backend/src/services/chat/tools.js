import sql from '../../db.js'

/**
 * Tools the chat model can call. Every handler reads the live Postgres tables
 * (products, product_specs, categories, reviews) — there is no mock data here.
 *
 * Only data that is already public through GET /api/products is exposed:
 * catalog fields, stock, specs and *public* reviews. Orders, users and hidden
 * reviews are never queried by the chatbot.
 */

const MAX_TEXT = 200
const idr = value => 'Rp ' + Number(value).toLocaleString('id-ID')

// ---- tool definitions (Anthropic tool-use format) --------------------------

export const toolDefinitions = [
  {
    name: 'search_products',
    description:
      'Search the store catalog. Use this to find products by name, brand, category, feature or price range, '
      + 'and to answer questions like "do you have X?" or "what laptops are under Rp 15.000.000?". '
      + 'Each returned item includes live stock, price, rating and a product page URL. '
      + 'Keep `query` to 1-3 key words (e.g. "earbuds", "sony", "keyboard"); put category and price limits in their own fields.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text keywords matched against name, brand, description, category and specs.' },
        category: { type: 'string', description: 'Category slug or name (e.g. "audio", "laptops", "smart-home"). Call list_categories if unsure.' },
        min_price: { type: 'integer', description: 'Minimum price in IDR.' },
        max_price: { type: 'integer', description: 'Maximum price in IDR.' },
        in_stock_only: { type: 'boolean', description: 'Only return products that are currently in stock.' },
        sort: { type: 'string', enum: ['featured', 'price_asc', 'price_desc', 'rating'], description: 'Result order. Default: featured.' },
        limit: { type: 'integer', description: 'Max results, 1-10. Default 6.' },
      },
    },
  },
  {
    name: 'check_stock',
    description:
      'Get the exact current stock for a product. Pass `product_id` (e.g. "P-231") when known, otherwise `query` '
      + 'with the product name. Returns stock units and status (in_stock, low_stock, out_of_stock). '
      + 'Always use this for stock questions — never guess availability.',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Exact product id, e.g. "P-231".' },
        query: { type: 'string', description: 'Product name or keywords, used when the id is unknown.' },
      },
    },
  },
  {
    name: 'get_product_details',
    description:
      'Full details for one product: description, every spec (key/value), price, discount, stock, '
      + 'average rating and a few recent customer reviews. Use it for spec questions and to compare products '
      + '(call it once per product).',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string', description: 'Exact product id, e.g. "P-231".' } },
      required: ['product_id'],
    },
  },
  {
    name: 'recommend_products',
    description:
      'Get ranked recommendations from products that are IN STOCK, best candidates first. Ranking uses customer ratings, '
      + 'featured status and discounts. Each result lists the data-backed `reasons` it was picked. '
      + 'Use it for "what should I buy?", "best X under Y", "gift ideas". Narrow with category, budget and keywords.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category slug or name.' },
        min_price: { type: 'integer', description: 'Minimum budget in IDR.' },
        max_price: { type: 'integer', description: 'Maximum budget in IDR.' },
        keywords: { type: 'string', description: 'Use-case or feature keywords, e.g. "noise cancelling" or "wireless".' },
        limit: { type: 'integer', description: 'Max results, 1-6. Default 4.' },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'List all product categories with how many products each has and how many are in stock.',
    input_schema: { type: 'object', properties: {} },
  },
]

// ---- input helpers ---------------------------------------------------------

function str(value, max = MAX_TEXT) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed || undefined
}

function int(value) {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined
}

function clamp(value, fallback, min, max) {
  const n = int(value)
  return n === undefined ? fallback : Math.min(max, Math.max(min, n))
}

/** Escape LIKE wildcards so user text is matched literally. */
const like = token => `%${token.replace(/[\\%_]/g, '\\$&')}%`

const tokenize = text => (text ? text.toLowerCase().split(/[^\p{L}\p{N}.+-]+/u).filter(t => t.length >= 2).slice(0, 6) : [])

// Every fragment is parenthesised: AND binds tighter than OR, so an unwrapped OR-group would silently
// swallow the category / price / stock filters it is combined with.
const all = parts => parts.reduce((acc, part) => sql`${acc} AND (${part})`, sql`TRUE`)
const any = parts => parts.reduce((acc, part, i) => (i === 0 ? sql`(${part})` : sql`${acc} OR (${part})`), sql`FALSE`)

const matchesToken = token => sql`(
  p.name ILIKE ${like(token)} OR p.brand ILIKE ${like(token)} OR p.category_slug ILIKE ${like(token)}
  OR c.label ILIKE ${like(token)} OR p.description ILIKE ${like(token)}
  OR EXISTS (SELECT 1 FROM product_specs s WHERE s.product_id = p.id AND (s.value ILIKE ${like(token)} OR s.key ILIKE ${like(token)}))
)`

// ---- shared query + row shaping --------------------------------------------

function catalogQuery({ where, order, limit }) {
  return sql`
    SELECT p.id, p.name, p.brand, p.category_slug AS category, p.price, p.original_price,
           p.stock, p.low_stock_threshold, p.featured, p.on_sale,
           r.avg_rating, COALESCE(r.review_count, 0) AS review_count
    FROM products p
    LEFT JOIN categories c ON c.slug = p.category_slug
    LEFT JOIN (
      SELECT product_id, AVG(rating)::float8 AS avg_rating, COUNT(*) AS review_count
      FROM reviews WHERE state = 'public' GROUP BY product_id
    ) r ON r.product_id = p.id
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ${limit}`
}

function stockStatus(row) {
  if (row.stock === 0) return 'out_of_stock'
  return row.stock <= row.low_stock_threshold ? 'low_stock' : 'in_stock'
}

function shape(row) {
  const onSale = Boolean(row.on_sale) && row.original_price > row.price
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: row.price,
    priceFormatted: idr(row.price),
    ...(onSale ? {
      originalPriceFormatted: idr(row.original_price),
      discountPercent: Math.round((1 - row.price / row.original_price) * 100),
    } : {}),
    stock: row.stock,
    stockStatus: stockStatus(row),
    rating: row.avg_rating == null ? null : Math.round(row.avg_rating * 10) / 10,
    reviewCount: row.review_count,
    url: `/products/${row.id}`,
  }
}

const sorts = {
  featured: sql`p.featured DESC, p.on_sale DESC, p.price ASC, p.catalog_position ASC`,
  price_asc: sql`p.price ASC, p.catalog_position ASC`,
  price_desc: sql`p.price DESC, p.catalog_position ASC`,
  rating: sql`r.avg_rating DESC NULLS LAST, COALESCE(r.review_count, 0) DESC, p.catalog_position ASC`,
}

function filters({ category, min_price, max_price, in_stock_only }) {
  const parts = []
  const cat = str(category, 60)
  if (cat) parts.push(sql`(lower(p.category_slug) = lower(${cat}) OR lower(c.label) = lower(${cat}))`)
  const min = int(min_price)
  const max = int(max_price)
  if (min !== undefined) parts.push(sql`p.price >= ${min}`)
  if (max !== undefined) parts.push(sql`p.price <= ${max}`)
  if (in_stock_only === true) parts.push(sql`p.stock > 0`)
  return parts
}

/** AND-match every keyword; if that finds nothing, relax to OR so a verbose query still gets candidates. */
async function findProducts({ keywords, parts, order, limit }) {
  const tokens = tokenize(keywords)
  const strict = await catalogQuery({ where: all([...parts, ...tokens.map(matchesToken)]), order, limit })
  if (strict.length || tokens.length < 2) return { rows: strict, relaxed: false }
  const loose = await catalogQuery({ where: all([...parts, any(tokens.map(matchesToken))]), order, limit })
  return { rows: loose, relaxed: loose.length > 0 }
}

// ---- handlers ---------------------------------------------------------------

async function searchProducts(input) {
  const limit = clamp(input.limit, 6, 1, 10)
  const order = sorts[input.sort] || sorts.featured
  const { rows, relaxed } = await findProducts({ keywords: str(input.query), parts: filters(input), order, limit })
  return {
    count: rows.length,
    ...(relaxed ? { note: 'No product matched every keyword; these match at least one.' } : {}),
    products: rows.map(shape),
  }
}

async function checkStock(input) {
  const id = str(input.product_id, 60)
  let rows
  if (id) {
    rows = await catalogQuery({ where: sql`upper(p.id) = upper(${id})`, order: sql`p.id`, limit: 1 })
  } else if (str(input.query)) {
    rows = (await findProducts({ keywords: str(input.query), parts: [], order: sorts.featured, limit: 5 })).rows
  } else {
    return { error: 'Provide product_id or query.' }
  }
  if (!rows.length) return { found: false, message: 'No matching product in the catalog.' }
  return {
    found: true,
    products: rows.map(row => ({
      id: row.id, name: row.name, stock: row.stock, stockStatus: stockStatus(row),
      lowStockThreshold: row.low_stock_threshold, priceFormatted: idr(row.price), url: `/products/${row.id}`,
    })),
  }
}

async function getProductDetails(input) {
  const id = str(input.product_id, 60)
  if (!id) return { error: 'product_id is required.' }
  const [row] = await catalogQuery({ where: sql`upper(p.id) = upper(${id})`, order: sql`p.id`, limit: 1 })
  if (!row) return { found: false, message: 'No product with that id.' }
  const [{ description }] = await sql`SELECT description FROM products WHERE id = ${row.id}`
  const specs = await sql`SELECT key, value FROM product_specs WHERE product_id = ${row.id} ORDER BY position`
  const reviews = await sql`SELECT rating, body FROM reviews WHERE product_id = ${row.id} AND state = 'public'
    ORDER BY created_at DESC, id DESC LIMIT 3`
  return {
    found: true,
    ...shape(row),
    description,
    specs: specs.map(s => ({ [s.key]: s.value })),
    // Customer-written text: shown as data only, truncated to keep the context small.
    customerReviews: reviews.map(r => ({ rating: r.rating, text: String(r.body).slice(0, 300) })),
  }
}

async function recommendProducts(input) {
  const limit = clamp(input.limit, 4, 1, 6)
  const prior = 4.0 // pseudo-rating weight so a single review doesn't dominate and unreviewed items aren't buried
  const order = sql`
    ((COALESCE(r.avg_rating * r.review_count, 0) + ${prior} * 2) / (COALESCE(r.review_count, 0) + 2)
      + CASE WHEN p.featured = 1 THEN 0.3 ELSE 0 END
      + CASE WHEN p.on_sale = 1 THEN 0.1 ELSE 0 END) DESC,
    p.catalog_position ASC`
  const { rows, relaxed } = await findProducts({
    keywords: str(input.keywords),
    parts: [...filters({ ...input, in_stock_only: true })],
    order, limit,
  })
  return {
    count: rows.length,
    ...(relaxed ? { note: 'No product matched every keyword; these match at least one.' } : {}),
    recommendations: rows.map(row => {
      const item = shape(row)
      const reasons = []
      if (item.rating != null) reasons.push(`rated ${item.rating}/5 from ${item.reviewCount} review${item.reviewCount === 1 ? '' : 's'}`)
      else reasons.push('no customer reviews yet')
      if (row.featured) reasons.push('featured product')
      if (item.discountPercent) reasons.push(`${item.discountPercent}% off`)
      if (item.stockStatus === 'low_stock') reasons.push(`only ${item.stock} left`)
      return { ...item, reasons }
    }),
  }
}

async function listCategories() {
  const rows = await sql`
    SELECT c.slug, c.label, COUNT(p.id) AS products, COUNT(p.id) FILTER (WHERE p.stock > 0) AS in_stock
    FROM categories c LEFT JOIN products p ON p.category_slug = c.slug
    GROUP BY c.slug, c.label ORDER BY c.slug`
  return { categories: rows.map(r => ({ slug: r.slug, name: r.label, products: r.products, inStock: r.in_stock })) }
}

const handlers = {
  search_products: searchProducts,
  check_stock: checkStock,
  get_product_details: getProductDetails,
  recommend_products: recommendProducts,
  list_categories: listCategories,
}

/**
 * Run one tool call from the model.
 * @param {string} name  tool name from `toolDefinitions`.
 * @param {object} input  the model-supplied arguments (validated/clamped per tool).
 * @returns {Promise<object>} JSON-serialisable result.
 */
export async function executeTool(name, input) {
  const handler = Object.hasOwn(handlers, name) ? handlers[name] : null
  if (!handler) throw new Error(`Unknown tool: ${name}`)
  return handler(input && typeof input === 'object' ? input : {})
}
