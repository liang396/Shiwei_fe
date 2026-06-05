<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">{{ text }}</span>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
  text: {
    type: String,
    default: '加载中...',
  },
})
</script>
