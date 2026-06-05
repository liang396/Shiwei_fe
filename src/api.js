const API_BASE_URL = 'http://127.0.0.1:8102'
const SESSION_KEY = 'shiwei-auth-user'
const CHECKOUT_KEY = 'shiwei-checkout-selection'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || '请求失败，请稍后重试')
  }

  if (data?.success === false) {
    throw new Error(data?.message || '操作失败')
  }

  return data
}

function toFormBody(payload) {
  return new URLSearchParams(
    Object.entries(payload).reduce((result, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result[key] = value
      }
      return result
    }, {}),
  ).toString()
}

function jsonRequest(path, options = {}) {
  return request(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      ...(options.headers || {}),
    },
  })
}

export function sendMobileCode(mobile) {
  return request('/front/sys/captcha/mobile', {
    method: 'POST',
    body: toFormBody({ phone: mobile }),
  })
}

export function registerByMobile(payload) {
  return request('/front/account/login/register', {
    method: 'POST',
    body: toFormBody(payload),
  })
}

export function loginByPassword(payload) {
  return request('/front/account/login/login', {
    method: 'POST',
    body: toFormBody(payload),
  })
}

export function loginBySms(payload) {
  return request('/front/account/login/doSmsLogin', {
    method: 'POST',
    body: toFormBody(payload),
  })
}

export async function fetchProductList() {
  const response = await jsonRequest('/product/list', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function fetchProductPage({ lastId, size } = {}) {
  const query = new URLSearchParams()
  if (lastId !== undefined && lastId !== null && lastId !== '') {
    query.set('lastId', String(lastId))
  }
  if (size !== undefined && size !== null && size !== '') {
    query.set('size', String(size))
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await jsonRequest(`/product/page${suffix}`, { method: 'GET' })
  return response?.data || { records: [], nextLastId: null, hasMore: false }
}

export async function fetchProductDetail(productId) {
  const response = await jsonRequest(`/product/${productId}`, { method: 'GET' })
  return response?.data || null
}

export async function fetchSeckillActivities() {
  const response = await jsonRequest('/seckill/activity/list', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function fetchSeckillActivityDetail(activityId) {
  const response = await jsonRequest(`/seckill/activity/${activityId}`, { method: 'GET' })
  return response?.data || null
}

export async function submitSeckillOrder(payload) {
  return jsonRequest('/seckill/order/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchSeckillResult(activityId) {
  const response = await jsonRequest(`/seckill/order/result?activityId=${activityId}`, { method: 'GET' })
  return response?.data
}

export async function fetchPromotionCoupons() {
  const response = await jsonRequest('/promotion/coupons', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function claimPromotionCoupon(couponId) {
  const response = await jsonRequest(`/promotion/coupons/${couponId}/claim`, { method: 'POST' })
  return response?.data || null
}

export async function fetchAvailableCoupons() {
  const response = await jsonRequest('/promotion/coupons/available', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function fetchPromotionSpecialProducts() {
  const response = await jsonRequest('/promotion/special-products', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function savePromotionSpecialProduct(payload) {
  const response = await jsonRequest('/promotion/special-products/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response?.data || null
}

export async function togglePromotionSpecialProduct(productId) {
  const response = await jsonRequest(`/promotion/special-products/${productId}/toggle`, { method: 'POST' })
  return response?.data || null
}

export async function fetchCartList() {
  const response = await jsonRequest('/cart/list', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function addCartItem(payload) {
  const response = await jsonRequest('/cart/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function updateCartItem(payload) {
  const response = await jsonRequest('/cart/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function removeCartItem(cartId) {
  const response = await jsonRequest('/cart/remove', {
    method: 'POST',
    body: JSON.stringify({ cartId }),
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function checkCartItem(payload) {
  const response = await jsonRequest('/cart/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return Array.isArray(response?.data) ? response.data : []
}

export async function submitOrder(payload) {
  const response = await jsonRequest('/order/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response?.data || null
}

export async function fetchOrderList() {
  const response = await jsonRequest('/order/list', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function fetchOrderPage({ lastId, size } = {}) {
  const query = new URLSearchParams()
  if (lastId !== undefined && lastId !== null && lastId !== '') {
    query.set('lastId', String(lastId))
  }
  if (size !== undefined && size !== null && size !== '') {
    query.set('size', String(size))
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await jsonRequest(`/order/page${suffix}`, { method: 'GET' })
  return response?.data || { records: [], nextLastId: null, hasMore: false }
}

export async function fetchOrderDetail(orderId) {
  const response = await jsonRequest(`/order/${orderId}`, { method: 'GET' })
  return response?.data || null
}

export async function fetchAddressList() {
  const response = await jsonRequest('/address/list', { method: 'GET' })
  return Array.isArray(response?.data) ? response.data : []
}

export async function saveAddress(payload) {
  const response = await jsonRequest('/address/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response?.data || null
}

export async function deleteAddress(addressId) {
  const response = await jsonRequest(`/address/${addressId}`, { method: 'DELETE' })
  return response?.data || null
}

export async function fetchProfileOverview() {
  const response = await jsonRequest('/profile/overview', { method: 'GET' })
  return response?.data || null
}

export async function deletePromotionSpecialProduct(productId) {
  const response = await jsonRequest(`/promotion/special-products/${productId}`, { method: 'DELETE' })
  return response?.data || null
}

export async function saveProfileUser(payload) {
  const response = await jsonRequest('/profile/user/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response?.data || null
}

export async function createAlipayPayment(orderId) {
  const response = await jsonRequest('/pay/mock/create', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  })
  return response?.data || ''
}

export function saveCheckoutSelection(items) {
  window.localStorage.setItem(CHECKOUT_KEY, JSON.stringify(items))
}

export function readCheckoutSelection() {
  const raw = window.localStorage.getItem(CHECKOUT_KEY)
  return raw ? JSON.parse(raw) : []
}

export function clearCheckoutSelection() {
  window.localStorage.removeItem(CHECKOUT_KEY)
}

export function saveAuthSession(user) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function readAuthSession() {
  const raw = window.localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearAuthSession() {
  window.localStorage.removeItem(SESSION_KEY)
}
