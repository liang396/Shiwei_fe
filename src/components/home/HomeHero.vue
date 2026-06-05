<template>
  <section v-if="activeHeroProduct" class="hero-card" :class="`hero-card--${activeHeroProduct.theme}`">
    <div class="hero-copy">
      <span class="hero-badge">{{ displayName }}，热门推荐</span>
      <h2>{{ activeHeroProduct.name }}</h2>
      <p>{{ activeHeroProduct.desc }}</p>

      <div class="hero-tags">
        <span class="hero-tag hero-tag--price">￥{{ renderPrice(activeHeroProduct.price) }}{{ activeHeroProduct.unit }}</span>
        <span v-for="badge in activeHeroProduct.badges" :key="badge" class="hero-tag">{{ badge }}</span>
      </div>

      <div class="hero-actions">
        <button class="hero-action hero-action--primary" type="button" @click="$emit('open-product', activeHeroProduct.id)">查看商品</button>
        <button class="hero-action hero-action--secondary" type="button" @click="$emit('open-category')">进入活动</button>
      </div>
    </div>

    <div class="hero-visual" aria-hidden="true">
      <div class="hero-product-stage" :class="`hero-product-stage--${activeHeroProduct.theme}`">
        <span class="hero-product-shape hero-product-shape--main"></span>
        <span class="hero-product-shape hero-product-shape--accent"></span>
        <span class="hero-product-shape hero-product-shape--detail"></span>
      </div>
    </div>
  </section>

  <div v-if="heroProducts.length > 1" class="hero-dots" aria-label="热门商品轮播切换">
    <button
      v-for="(product, index) in heroProducts"
      :key="product.id"
      class="hero-dot"
      :class="{ 'is-active': activeSlideIndex === index }"
      type="button"
      :aria-label="`切换到热门商品 ${index + 1}`"
      @click="$emit('dot-click', index)"
    ></button>
  </div>
</template>

<script setup>
defineProps({
  activeHeroProduct: Object,
  heroProducts: Array,
  activeSlideIndex: Number,
  displayName: String,
  renderPrice: Function,
})

defineEmits(['open-product', 'open-category', 'dot-click'])
</script>
