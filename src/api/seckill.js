import { jsonRequest } from './http'

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
