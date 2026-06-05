import { jsonRequest } from './http'

export async function fetchProfileOverview() {
  const response = await jsonRequest('/profile/overview', { method: 'GET' })
  return response?.data || null
}

export async function saveProfileUser(payload) {
  const response = await jsonRequest('/profile/user/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response?.data || null
}
