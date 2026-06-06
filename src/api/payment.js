import { jsonRequest } from './http'

export async function createAlipayPayment(orderId, orderNo) {
  const response = await jsonRequest('/pay/mock/create', {
    method: 'POST',
    body: JSON.stringify({ orderNo }),
  })
  return response?.data || ''
}

export async function notifyMockPayment(payload) {
  const response = await jsonRequest('/pay/mock/notify', {
    method: 'POST',
    body: new URLSearchParams(payload).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  })
  return response?.data || null
}

export async function completeMockPayment({ orderNo, payAmount }) {
  const tradeNo = `MOCK-${Date.now()}`
  await notifyMockPayment({
    out_trade_no: orderNo,
    trade_no: tradeNo,
    trade_status: 'TRADE_SUCCESS',
    total_amount: Number(payAmount || 0).toFixed(2),
  })
  return tradeNo
}
