import { jsonRequest } from './http'

export async function createAlipayPayment(orderId) {
  const response = await jsonRequest('/pay/mock/create', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  })
  return response?.data || ''
}
