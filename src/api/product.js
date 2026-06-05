import { jsonRequest } from './http'

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
