import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    loadingCount: 0,
    globalError: '',
  }),
  getters: {
    isLoading: (state) => state.loadingCount > 0,
  },
  actions: {
    startLoading() {
      this.loadingCount += 1
    },
    stopLoading() {
      this.loadingCount = Math.max(0, this.loadingCount - 1)
    },
    showError(message) {
      this.globalError = message || '请求失败，请稍后重试'
    },
    clearError() {
      this.globalError = ''
    },
  },
})
