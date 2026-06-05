<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import {
  addCartItem,
  clearAuthSession,
  fetchProductPage,
  fetchPromotionSpecialProducts,
  readAuthSession,
} from '../api'
import { catalogProducts, categoryTree, getFeaturedProducts } from '../catalog'

const router = useRouter()
const currentUser = readAuthSession()
const activeNav = ref('首页')
const actionMessage = ref('')
const activeMainCategory = ref(categoryTree[0].name)
const activeSubcategory = ref('全部')
const activeSlideIndex = ref(0)
const carouselInterval = ref(null)
const sortMenuOpen = ref(false)
const sortKey = ref('popularity')
const sortDirection = ref('desc')
const promotionHeroProducts = ref([])
const remoteProducts = ref([])
const productPageCursor = ref(null)
const productHasMore = ref(true)
const loadingMoreProducts = ref(false)
const PRODUCT_PAGE_SIZE = 6

const CAROUSEL_DELAY = 5000

const navItems = [
  { label: '首页', bottomLabel: '首页', icon: 'home', route: '/' },
  { label: '优惠活动', bottomLabel: '活动', icon: 'grid', route: '/category' },
  { label: '购物车', bottomLabel: '购物车', icon: 'cart', route: '/cart' },
  { label: '我的', bottomLabel: '我的', icon: 'user', route: '/profile' },
]

const displayName = computed(() => {
  if (!currentUser) {
    return '拾味用户'
  }

  return currentUser.nickname || currentUser.username || '拾味用户'
})

const currentCategory = computed(() => {
  return categoryTree.find((item) => item.name === activeMainCategory.value) || categoryTree[0]
})

const activeSubcategories = computed(() => ['全部', ...currentCategory.value.subcategories])

const productSource = computed(() => (remoteProducts.value.length ? remoteProducts.value : catalogProducts))

const selectedProducts = computed(() => {
  const matched = productSource.value.filter((item) => item.category === activeMainCategory.value)
  const filtered = activeSubcategory.value === '全部'
    ? matched
    : matched.filter((item) => item.subcategory === activeSubcategory.value)

  return [...filtered].sort((left, right) => {
    const factor = sortDirection.value === 'asc' ? 1 : -1
    return (Number(left[sortKey.value] ?? 0) - Number(right[sortKey.value] ?? 0)) * factor
  })
})

const sortLabel = computed(() => {
  const labelMap = {
    price: '价格',
    sales: '销量',
    popularity: '热度',
  }
  const directionMap = {
    asc: '升序',
    desc: '降序',
  }

  return `${labelMap[sortKey.value]} ${directionMap[sortDirection.value]}`
})

const heroProducts = computed(() => {
  const promotionMatched = promotionHeroProducts.value.filter((item) => item.category === activeMainCategory.value)
  const fallbackFeatured = remoteProducts.value.length
    ? remoteProducts.value.filter((item) => item.category === activeMainCategory.value && item.featured)
    : getFeaturedProducts(activeMainCategory.value)
  const featured = promotionMatched.length ? promotionMatched : fallbackFeatured

  if (activeSubcategory.value === '全部') {
    return featured.length ? featured : selectedProducts.value.slice(0, 4)
  }

  const subFeatured = featured.filter((item) => item.subcategory === activeSubcategory.value)
  if (subFeatured.length) {
    return subFeatured
  }

  const subProducts = selectedProducts.value.slice(0, 4)
  return subProducts.length ? subProducts : featured
})

const activeHeroProduct = computed(() => heroProducts.value[activeSlideIndex.value] || heroProducts.value[0] || null)

const featuredProducts = computed(() => {
  const heroIds = new Set(heroProducts.value.map((item) => item.id))
  const preferred = selectedProducts.value.filter((item) => !heroIds.has(item.id))
  return [...heroProducts.value, ...preferred].slice(0, 8)
})

function renderPrice(price) {
  return Number(price || 0).toFixed(2)
}

function mapPromotionHeroProduct(item) {
  return {
    id: item.productId,
    name: item.productName,
    desc: item.description,
    price: Number(item.promotionPrice ?? 0),
    unit: '/件',
    theme: item.theme || 'electronics-phone',
    category: item.category,
    subcategory: item.subcategory,
    sales: Number(item.sales ?? 0),
    popularity: Number(item.popularity ?? 0),
    badges: [item.tag || '活动特价'],
    featured: true,
  }
}

function mapRemoteProduct(item) {
  return {
    id: item.productId,
    name: item.productName,
    desc: item.description,
    price: Number(item.price ?? 0),
    unit: '/件',
    theme: item.theme || 'electronics-phone',
    category: item.category,
    subcategory: item.subcategory,
    sales: Number(item.sales ?? 0),
    popularity: Number(item.popularity ?? 0),
    badges: item.featured ? ['后端热卖'] : ['商品在售'],
    featured: Boolean(item.featured),
  }
}

function clearCarouselInterval() {
  if (carouselInterval.value) {
    window.clearInterval(carouselInterval.value)
    carouselInterval.value = null
  }
}

function setSlide(index) {
  activeSlideIndex.value = index
}

function nextSlide() {
  activeSlideIndex.value = (activeSlideIndex.value + 1) % heroProducts.value.length
}

function startCarousel() {
  clearCarouselInterval()
  if (heroProducts.value.length <= 1) {
    return
  }

  carouselInterval.value = window.setInterval(() => {
    nextSlide()
  }, CAROUSEL_DELAY)
}

function resetCarousel() {
  activeSlideIndex.value = 0
  startCarousel()
}

function handleMainCategoryClick(categoryName) {
  activeMainCategory.value = categoryName
  activeSubcategory.value = '全部'
  resetCarousel()
}

function handleSubcategorySelect(mainCategory, subcategory) {
  activeMainCategory.value = mainCategory
  activeSubcategory.value = subcategory
  resetCarousel()
}

function toggleSortMenu() {
  sortMenuOpen.value = !sortMenuOpen.value
}

function handleSortChange(nextSortKey) {
  if (sortKey.value === nextSortKey) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = nextSortKey
    sortDirection.value = 'desc'
  }
  sortMenuOpen.value = false
}

function handleDotClick(index) {
  setSlide(index)
  startCarousel()
}

function openCategoryPage() {
  router.push({
    path: '/category',
    query: {
      main: activeMainCategory.value,
      sub: activeSubcategory.value,
    },
  })
}

function handleNavClick(item) {
  activeNav.value = item.label
  if (item.route) {
    router.push(item.route)
  }
}

function openProductDetail(productId) {
  router.push(`/product/${productId}`)
}

async function handleAddCart(product) {
  actionMessage.value = ''
  try {
    await addCartItem({
      productId: product.id,
      productName: product.name,
      productImage: '',
      price: product.price,
      quantity: 1,
    })
    actionMessage.value = `${product.name} 已加入购物车`
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '加入购物车失败'
  }
}

async function loadPromotionHeroProducts() {
  try {
    const data = await fetchPromotionSpecialProducts()
    promotionHeroProducts.value = data
      .filter((item) => item.status === 'ACTIVE')
      .map(mapPromotionHeroProduct)
  } catch {
    promotionHeroProducts.value = []
  }
}

async function loadRemoteProducts() {
  try {
    const data = await fetchProductPage({ size: PRODUCT_PAGE_SIZE })
    remoteProducts.value = Array.isArray(data.records) ? data.records.map(mapRemoteProduct) : []
    productPageCursor.value = data.nextLastId ?? null
    productHasMore.value = Boolean(data.hasMore)
  } catch {
    remoteProducts.value = []
    productPageCursor.value = null
    productHasMore.value = false
  }
}

async function loadMoreProducts() {
  if (loadingMoreProducts.value || !productHasMore.value) {
    return
  }
  loadingMoreProducts.value = true
  try {
    const data = await fetchProductPage({
      lastId: productPageCursor.value,
      size: PRODUCT_PAGE_SIZE,
    })
    const nextProducts = Array.isArray(data.records) ? data.records.map(mapRemoteProduct) : []
    remoteProducts.value = [...remoteProducts.value, ...nextProducts]
    productPageCursor.value = data.nextLastId ?? null
    productHasMore.value = Boolean(data.hasMore)
  } finally {
    loadingMoreProducts.value = false
  }
}

function handleLogout() {
  clearAuthSession()
  router.push('/login')
}

watch(heroProducts, () => {
  activeSlideIndex.value = 0
  startCarousel()
})

onMounted(async () => {
  if (!currentUser) {
    router.replace('/login')
    return
  }

  await Promise.all([loadPromotionHeroProducts(), loadRemoteProducts()])
  startCarousel()
})

onBeforeUnmount(() => {
  clearCarouselInterval()
})
</script>

<template>
  <main class="home-shell">
    <section class="home-frame">
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
            @click="handleNavClick(item)"
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

        <button class="notice-button" type="button" @click="handleLogout" aria-label="退出登录">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
            <path d="M10 12h10" stroke="currentColor" stroke-linecap="round" stroke-width="1.7" />
            <path d="m17 8 4 4-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" />
          </svg>
        </button>
      </section>

      <nav class="category-tabs category-tabs--macro" aria-label="首页大类导航">
        <div class="category-tabs__main">
          <div v-for="category in categoryTree" :key="category.id" class="category-tab-wrap">
            <button
              class="category-tab"
              :class="{ 'is-active': activeMainCategory === category.name }"
              type="button"
              @click="handleMainCategoryClick(category.name)"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <div class="category-sort">
          <button class="category-sort__trigger" type="button" @click="toggleSortMenu">
            <span class="category-sort__value">{{ sortLabel }}</span>
            <span class="category-sort__caret">▾</span>
          </button>

          <div v-if="sortMenuOpen" class="category-sort__menu">
            <button class="category-sort__option" :class="{ 'is-active': sortKey === 'price' }" type="button" @click="handleSortChange('price')">价格</button>
            <button class="category-sort__option" :class="{ 'is-active': sortKey === 'sales' }" type="button" @click="handleSortChange('sales')">销量</button>
            <button class="category-sort__option" :class="{ 'is-active': sortKey === 'popularity' }" type="button" @click="handleSortChange('popularity')">热度</button>
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
            @click="handleSubcategorySelect(activeMainCategory, sub)"
          >
            {{ sub }}
          </button>
        </div>
      </section>

      <section v-if="activeHeroProduct" class="hero-card" :class="`hero-card--${activeHeroProduct.theme}`">
        <div class="hero-copy">
          <span class="hero-badge">{{ displayName }}，热门推荐</span>
          <h2>{{ activeHeroProduct.name }}</h2>
          <p>{{ activeHeroProduct.desc }}</p>

          <div class="hero-tags">
            <span class="hero-tag hero-tag--price">¥{{ renderPrice(activeHeroProduct.price) }}{{ activeHeroProduct.unit }}</span>
            <span v-for="badge in activeHeroProduct.badges" :key="badge" class="hero-tag">{{ badge }}</span>
          </div>

          <div class="hero-actions">
            <button class="hero-action hero-action--primary" type="button" @click="openProductDetail(activeHeroProduct.id)">查看商品</button>
            <button class="hero-action hero-action--secondary" type="button" @click="openCategoryPage">进入活动</button>
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
          @click="handleDotClick(index)"
        ></button>
      </div>

      <section class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Hot Picks</p>
          <h3>{{ activeMainCategory }}</h3>
        </div>
        <button class="section-heading__action" type="button" @click="openCategoryPage">查看全部</button>
      </section>

      <section class="product-grid">
        <article
          v-for="product in featuredProducts"
          :key="product.id"
          class="product-card product-card--interactive"
          @click="openProductDetail(product.id)"
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
                <span class="price-symbol">¥</span>
                <strong>{{ renderPrice(product.price) }}</strong>
                <span class="price-unit">{{ product.unit }}</span>
              </div>

              <button class="product-action" type="button" :aria-label="`加入购物车：${product.name}`" @click.stop="handleAddCart(product)">+</button>
            </div>
          </div>
        </article>
      </section>

      <div v-if="productHasMore" class="section-heading section-heading--load-more">
        <button class="section-heading__action" type="button" :disabled="loadingMoreProducts" @click="loadMoreProducts">
          {{ loadingMoreProducts ? '加载中...' : '加载更多商品' }}
        </button>
      </div>

      <section v-if="actionMessage" class="status-tip status-tip--success home-action-tip">
        {{ actionMessage }}
      </section>

      <nav class="bottom-nav" aria-label="底部导航">
        <button
          v-for="item in navItems"
          :key="item.label"
          class="bottom-nav__item"
          :class="{ 'is-active': activeNav === item.label }"
          type="button"
          @click="handleNavClick(item)"
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
    </section>
  </main>
</template>
