import { pinia } from '../stores'
import { useUiStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8102'
const pendingRequests = new Map()

function getRequestKey(path, options = {}) {
  return `${path}:${options.method || 'GET'}:${options.body || ''}`
}

export async function request(path, options = {}) {
  const uiStore = useUiStore(pinia)
  const authStore = useAuthStore(pinia)
  const requestKey = getRequestKey(path, options)

  pendingRequests.get(requestKey)?.abort()
  const controller = new AbortController()
  pendingRequests.set(requestKey, controller)

  uiStore.startLoading()

  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...(options.headers || {}),
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      if (response.status === 401) {
        authStore.clearUser()
        uiStore.showError('登录状态已失效，请重新登录')
      } else {
        uiStore.showError(data?.message || '请求失败，请稍后重试')
      }
      throw new Error(data?.message || '请求失败，请稍后重试')
    }

    if (data?.success === false) {
      uiStore.showError(data?.message || '操作失败')
      throw new Error(data?.message || '操作失败')
    }

    return data
  } catch (error) {
    if (error?.name === 'AbortError') {
      return
    }
    throw error
  } finally {
    uiStore.stopLoading()
    pendingRequests.delete(requestKey)
  }
}

export function toFormBody(payload) {
  return new URLSearchParams(
    Object.entries(payload).reduce((result, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result[key] = value
      }
      return result
    }, {}),
  ).toString()
}

export function jsonRequest(path, options = {}) {
  return request(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      ...(options.headers || {}),
    },
  })
}
