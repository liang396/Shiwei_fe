const SESSION_KEY = 'shiwei-auth-user'
const CHECKOUT_KEY = 'shiwei-checkout-selection'

export function saveCheckoutSelection(items) {
  window.localStorage.setItem(CHECKOUT_KEY, JSON.stringify(items))
}

export function readCheckoutSelection() {
  const raw = window.localStorage.getItem(CHECKOUT_KEY)
  return raw ? JSON.parse(raw) : []
}

export function clearCheckoutSelection() {
  window.localStorage.removeItem(CHECKOUT_KEY)
}

export function saveAuthSession(user) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function readAuthSession() {
  const raw = window.localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearAuthSession() {
  window.localStorage.removeItem(SESSION_KEY)
}
