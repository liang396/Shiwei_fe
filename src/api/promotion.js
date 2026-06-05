import { jsonRequest } from './http'

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

export async function deletePromotionSpecialProduct(productId) {
  const response = await jsonRequest(`/promotion/special-products/${productId}`, { method: 'DELETE' })
  return response?.data || null
}
