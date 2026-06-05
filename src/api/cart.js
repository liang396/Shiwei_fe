import { jsonRequest } from './http'

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
