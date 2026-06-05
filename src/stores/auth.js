import { defineStore } from 'pinia'

const SESSION_KEY = 'shiwei-auth-user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user),
  },
  actions: {
    setUser(user) {
      this.user = user
      if (user) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      } else {
        window.localStorage.removeItem(SESSION_KEY)
      }
    },
    loadUser() {
      const raw = window.localStorage.getItem(SESSION_KEY)
      this.user = raw ? JSON.parse(raw) : null
    },
    clearUser() {
      this.setUser(null)
    },
  },
})
