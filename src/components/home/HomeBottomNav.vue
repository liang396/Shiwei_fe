<template>
  <nav class="bottom-nav" aria-label="底部导航">
    <button
      v-for="item in navItems"
      :key="item.label"
      class="bottom-nav__item"
      :class="{ 'is-active': activeNav === item.label }"
      type="button"
      @click="$emit('nav-click', item)"
    >
      <span class="bottom-nav__icon">
        <svg v-if="item.icon === 'home'" viewBox="0 0 24 24" fill="none">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
        </svg>
        <svg v-else-if="item.icon === 'grid'" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
        </svg>
        <svg v-else-if="item.icon === 'cart'" viewBox="0 0 24 24" fill="none">
          <path d="M5 6h2l1.2 7.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.78L19 8H8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          <circle cx="10" cy="18.5" r="1.5" fill="currentColor" />
          <circle cx="17" cy="18.5" r="1.5" fill="currentColor" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
          <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
        </svg>
      </span>
      <span>{{ item.bottomLabel || item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  navItems: Array,
  activeNav: String,
})

defineEmits(['nav-click'])
</script>
