<template>
  <header class="home-topbar">
    <div class="home-brand">
      <span class="home-brand__logo">拾</span>
      <div>
        <p class="home-brand__eyebrow">Fresh Market</p>
        <h1>拾味商城</h1>
      </div>
    </div>

    <nav class="home-desktop-nav" aria-label="顶部导航">
      <button
        v-for="item in navItems"
        :key="item.label"
        class="desktop-nav__item"
        :class="{ 'is-active': activeNav === item.label }"
        type="button"
        @click="$emit('nav-click', item)"
      >
        {{ item.label }}
      </button>
    </nav>
  </header>

  <section class="search-row">
    <label class="search-box">
      <span class="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
        </svg>
      </span>
      <input :placeholder="`搜索${activeMainCategory}`" type="text" />
    </label>

    <button class="notice-button" type="button" @click="$emit('logout')" aria-label="退出登录">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
        <path d="M10 12h10" stroke="currentColor" stroke-linecap="round" stroke-width="1.7" />
        <path d="m17 8 4 4-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
      </svg>
    </button>
  </section>
</template>

<script setup>
defineProps({
  navItems: Array,
  activeNav: String,
  activeMainCategory: String,
})

defineEmits(['nav-click', 'logout'])
</script>
