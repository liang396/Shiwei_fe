<template>
  <nav class="category-tabs category-tabs--macro" aria-label="首页大类导航">
    <div class="category-tabs__main">
      <div v-for="category in categoryTree" :key="category.id" class="category-tab-wrap">
        <button
          class="category-tab"
          :class="{ 'is-active': activeMainCategory === category.name }"
          type="button"
          @click="$emit('main-change', category.name)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <div class="category-sort">
      <button class="category-sort__trigger" type="button" @click="$emit('toggle-sort')">
        <span class="category-sort__value">{{ sortLabel }}</span>
        <span class="category-sort__caret">▾</span>
      </button>

      <div v-if="sortMenuOpen" class="category-sort__menu">
        <button class="category-sort__option" :class="{ 'is-active': sortKey === 'price' }" type="button" @click="$emit('sort-change', 'price')">价格</button>
        <button class="category-sort__option" :class="{ 'is-active': sortKey === 'sales' }" type="button" @click="$emit('sort-change', 'sales')">销量</button>
        <button class="category-sort__option" :class="{ 'is-active': sortKey === 'popularity' }" type="button" @click="$emit('sort-change', 'popularity')">热度</button>
      </div>
    </div>
  </nav>

  <section class="home-subcategory-inline">
    <span class="home-subcategory-inline__label">{{ activeMainCategory }}</span>
    <div class="home-subcategory-inline__list">
      <button
        v-for="sub in activeSubcategories"
        :key="sub"
        class="home-subcategory-inline__chip"
        :class="{ 'is-active': activeSubcategory === sub }"
        type="button"
        @click="$emit('subcategory-change', sub)"
      >
        {{ sub }}
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  categoryTree: Array,
  activeMainCategory: String,
  activeSubcategory: String,
  activeSubcategories: Array,
  sortMenuOpen: Boolean,
  sortKey: String,
  sortLabel: String,
})

defineEmits(['main-change', 'subcategory-change', 'toggle-sort', 'sort-change'])
</script>
