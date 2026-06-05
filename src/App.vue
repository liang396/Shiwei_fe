<template>
  <LoadingOverlay :visible="uiStore.isLoading" />
  <ErrorAlert :message="uiStore.globalError" @close="uiStore.clearError()" />
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
import LoadingOverlay from './components/LoadingOverlay.vue'
import ErrorAlert from './components/ErrorAlert.vue'
import { useUiStore } from './stores/ui'

const uiStore = useUiStore()
</script>
