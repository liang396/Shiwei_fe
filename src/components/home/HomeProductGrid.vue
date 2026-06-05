<template>
  <section class="section-heading">
    <div>
      <p class="section-heading__eyebrow">Hot Picks</p>
      <h3>{{ activeMainCategory }}</h3>
    </div>
    <button class="section-heading__action" type="button" @click="$emit('open-category')">查看全部</button>
  </section>

  <section class="product-grid">
    <article
      v-for="product in featuredProducts"
      :key="product.id"
      class="product-card product-card--interactive"
      @click="$emit('open-product', product.id)"
    >
      <div class="product-visual" :class="`theme-${product.theme}`">
        <div class="plate">
          <div class="plate-item"></div>
          <div class="plate-item"></div>
          <div class="plate-item"></div>
        </div>
      </div>

      <div class="product-content">
        <div class="product-content__topline">
          <span class="product-subcategory">{{ product.subcategory }}</span>
        </div>
        <h4>{{ product.name }}</h4>
        <p>{{ product.desc }}</p>

        <div class="product-meta">
          <div class="product-price">
            <span class="price-symbol">￥</span>
            <strong>{{ renderPrice(product.price) }}</strong>
            <span class="price-unit">{{ product.unit }}</span>
          </div>

          <button class="product-action" type="button" :aria-label="`加入购物车：${product.name}`" @click.stop="$emit('add-cart', product)">+</button>
        </div>
      </div>
    </article>
  </section>

  <div v-if="productHasMore" class="section-heading section-heading--load-more">
    <button class="section-heading__action" type="button" :disabled="loadingMoreProducts" @click="$emit('load-more')">
      {{ loadingMoreProducts ? '加载中...' : '加载更多商品' }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  activeMainCategory: String,
  featuredProducts: Array,
  renderPrice: Function,
  productHasMore: Boolean,
  loadingMoreProducts: Boolean,
})

defineEmits(['open-category', 'open-product', 'add-cart', 'load-more'])
</script>
