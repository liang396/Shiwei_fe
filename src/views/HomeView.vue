<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import {
  addCartItem,
  fetchProductPage,
  fetchPromotionSpecialProducts,
} from '../api'
import { catalogProducts, categoryTree, getFeaturedProducts } from '../catalog'
import HomeTopBar from '../components/home/HomeTopBar.vue'
import HomeCategoryTabs from '../components/home/HomeCategoryTabs.vue'
import HomeHero from '../components/home/HomeHero.vue'
import HomeProductGrid from '../components/home/HomeProductGrid.vue'
import HomeBottomNav from '../components/home/HomeBottomNav.vue'

const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)
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
  if (!currentUser.value) {
    return '拾味用户'
  }
  return currentUser.value.nickname || currentUser.value.username || '拾味用户'
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
    badges: item.featured ? ['当前热卖'] : ['商品在售'],
    featured: Boolean(item.featured),
  }
}

function clearCarouselInterval() {
  if (carouselInterval.value) {
    window.clearInterval(carouselInterval.value)
    carouselInterval.value = null
  }
}

function nextSlide() {
  activeSlideIndex.value = (activeSlideIndex.value + 1) % heroProducts.value.length
}

function startCarousel() {
  clearCarouselInterval()
  if (heroProducts.value.length <= 1) {
    return
  }
  carouselInterval.value = window.setInterval(nextSlide, CAROUSEL_DELAY)
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

function handleSubcategorySelect(subcategory) {
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
  authStore.clearUser()
  router.push('/login')
}

watch(heroProducts, () => {
  activeSlideIndex.value = 0
  startCarousel()
})

onMounted(async () => {
  if (!currentUser.value) {
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
      <HomeTopBar
        :nav-items="navItems"
        :active-nav="activeNav"
        :active-main-category="activeMainCategory"
        @nav-click="handleNavClick"
        @logout="handleLogout"
      />

      <HomeCategoryTabs
        :category-tree="categoryTree"
        :active-main-category="activeMainCategory"
        :active-subcategory="activeSubcategory"
        :active-subcategories="activeSubcategories"
        :sort-menu-open="sortMenuOpen"
        :sort-key="sortKey"
        :sort-label="sortLabel"
        @main-change="handleMainCategoryClick"
        @subcategory-change="handleSubcategorySelect"
        @toggle-sort="toggleSortMenu"
        @sort-change="handleSortChange"
      />

      <HomeHero
        :active-hero-product="activeHeroProduct"
        :hero-products="heroProducts"
        :active-slide-index="activeSlideIndex"
        :display-name="displayName"
        :render-price="renderPrice"
        @open-product="openProductDetail"
        @open-category="openCategoryPage"
        @dot-click="activeSlideIndex = $event"
      />

      <HomeProductGrid
        :active-main-category="activeMainCategory"
        :featured-products="featuredProducts"
        :render-price="renderPrice"
        :product-has-more="productHasMore"
        :loading-more-products="loadingMoreProducts"
        @open-category="openCategoryPage"
        @open-product="openProductDetail"
        @add-cart="handleAddCart"
        @load-more="loadMoreProducts"
      />

      <section v-if="actionMessage" class="status-tip status-tip--success home-action-tip">
        {{ actionMessage }}
      </section>

      <HomeBottomNav :nav-items="navItems" :active-nav="activeNav" @nav-click="handleNavClick" />
    </section>
  </main>
</template>
