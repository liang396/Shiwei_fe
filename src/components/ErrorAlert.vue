<template>
  <Transition name="slide">
    <div v-if="message" class="error-alert">
      <span class="error-alert__icon">!</span>
      <span class="error-alert__message">{{ message }}</span>
      <button class="error-alert__close" type="button" @click="$emit('close')">×</button>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})

defineEmits(['close'])
</script>
