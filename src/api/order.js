import { jsonRequest } from './http'

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

export async function fetchOrderPage({ lastId, size, lastCreatedTime } = {}) {
  const query = new URLSearchParams()
  if (lastId !== undefined && lastId !== null && lastId !== '') {
    query.set('lastId', String(lastId))
  }
  if (size !== undefined && size !== null && size !== '') {
    query.set('size', String(size))
  }
  if (lastCreatedTime !== undefined && lastCreatedTime !== null && lastCreatedTime !== '') {
    query.set('lastCreatedTime', String(lastCreatedTime))
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await jsonRequest(`/order/page${suffix}`, { method: 'GET' })
  return response?.data || { records: [], nextLastId: null, nextCreatedTime: null, hasMore: false }
}

export async function fetchOrderDetail(orderId) {
  const response = await jsonRequest(`/order/${orderId}`, { method: 'GET' })
  return response?.data || null
}
