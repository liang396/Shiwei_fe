import { jsonRequest } from './http'

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
