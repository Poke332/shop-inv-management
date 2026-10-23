import { request } from './httpClient.js'
import { saveAuth } from './authStorage.js'
import { httpCart } from './httpCart.js'

const id = encodeURIComponent
const post = (path, body) => request(path, { method: 'POST', body })
const patch = (path, body) => request(path, { method: 'PATCH', body })

export const httpApi = {
  ...httpCart,
  async login(email, password) {
    const result = await post('/auth/login', { email, password })
    saveAuth(result)
    return { user: result.user, role: result.role }
  },
  async register(payload) {
    const result = await post('/auth/register', payload)
    saveAuth(result)
    return result.user
  },
  me: () => request('/auth/me'),
  logout: () => post('/auth/logout'),
  getCategories: () => request('/categories'),
  getProducts: (filter = {}) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filter)) if (value != null && value !== '') params.set(key, String(value))
    return request('/products?' + params.toString())
  },
  getProduct: productId => request('/products/' + id(productId)),
  getProductReviews: productId => request('/products/' + id(productId) + '/reviews'),
  getProductReviewsAll: productId => request('/ops/products/' + id(productId) + '/reviews'),
  createOrder: payload => post('/orders', payload),
  getMyOrders: () => request('/orders/mine'),
  submitReview: (orderId, productId, rating, comment) => post('/orders/' + id(orderId) + '/reviews', { productId, rating, comment }),
  getOrders: status => request('/ops/orders?' + new URLSearchParams({ status: status || 'all' })),
  advanceOrderStatus: (orderId, status) => patch('/ops/orders/' + id(orderId) + '/status', { status }),
  getStockOverview: () => request('/ops/stock'),
  setStock: (productId, qty) => patch('/ops/stock/' + id(productId), { qty }),
  createProduct: payload => post('/ops/products', payload),
  updateProduct: (productId, payload) => patch('/ops/products/' + id(productId), payload),
  setReviewHidden: (reviewId, hidden) => patch('/ops/reviews/' + id(reviewId) + '/hidden', { hidden }),
  setSellerComment: (reviewId, text) => patch('/ops/reviews/' + id(reviewId) + '/comment', { text }),
  getUsers: () => request('/ops/users'),
  setUserRole: (username, role) => patch('/ops/users/' + id(username) + '/role', { role }),
  setUserActive: (username, active) => patch('/ops/users/' + id(username) + '/active', { active }),
}
