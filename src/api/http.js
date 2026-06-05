import { pinia } from '../stores'
import { useUiStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8102'
const pendingRequests = new Map()
const DEFAULT_TIMEOUT = 10000
const MAX_RETRY_COUNT = 2
const RETRY_DELAY_MS = 300

function getRequestKey(path, options = {}) {
  return `${path}:${options.method || 'GET'}:${options.body || ''}`
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function shouldRetry(method, response, error, retryCount) {
  if (retryCount >= MAX_RETRY_COUNT) {
    return false
  }
  if ((method || 'GET').toUpperCase() !== 'GET') {
    return false
  }
  if (error?.name === 'AbortError') {
    return false
  }
  if (response && [502, 503, 504].includes(response.status)) {
    return true
  }
  return !response
}

async function requestWithTimeout(url, fetchOptions, timeout) {
  const timeoutController = new AbortController()
  const timerId = window.setTimeout(() => {
    timeoutController.abort()
  }, timeout)

  const signal = timeoutController.signal
  fetchOptions.signal.addEventListener('abort', () => timeoutController.abort(), { once: true })

  try {
    return await fetch(url, { ...fetchOptions, signal })
  } finally {
    window.clearTimeout(timerId)
  }
}

export async function request(path, options = {}) {
  const uiStore = useUiStore(pinia)
  const authStore = useAuthStore(pinia)
  const requestKey = getRequestKey(path, options)
  const method = (options.method || 'GET').toUpperCase()

  pendingRequests.get(requestKey)?.abort()
  const controller = new AbortController()
  pendingRequests.set(requestKey, controller)

  uiStore.startLoading()

  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...(options.headers || {}),
    }

    let attempt = 0
    let lastError = null

    while (attempt <= MAX_RETRY_COUNT) {
      let response = null
      try {
        response = await requestWithTimeout(
          `${API_BASE_URL}${path}`,
          {
            ...options,
            headers,
            signal: controller.signal,
          },
          options.timeout || DEFAULT_TIMEOUT,
        )

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (response.status === 401) {
            authStore.clearUser()
            uiStore.showError('登录状态已失效，请重新登录')
            throw new Error(data?.message || '登录状态已失效，请重新登录')
          }

          if (shouldRetry(method, response, null, attempt)) {
            attempt += 1
            await sleep(RETRY_DELAY_MS * attempt)
            continue
          }

          uiStore.showError(data?.message || `请求失败 (${response.status})`)
          throw new Error(data?.message || `请求失败 (${response.status})`)
        }

        if (data?.success === false) {
          uiStore.showError(data?.message || '操作失败')
          throw new Error(data?.message || '操作失败')
        }

        return data
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw error
        }
        lastError = error
        if (shouldRetry(method, response, error, attempt)) {
          attempt += 1
          await sleep(RETRY_DELAY_MS * attempt)
          continue
        }
        uiStore.showError(error?.message || '网络请求失败')
        throw error
      }
    }

    throw lastError || new Error('请求失败')
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
