<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  addCartItem,
  claimPromotionCoupon,
  fetchPromotionCoupons,
  fetchPromotionSpecialProducts,
  fetchSeckillActivities,
  fetchSeckillActivityDetail,
  readAuthSession,
} from '../api'
import { catalogProducts } from '../catalog'

const router = useRouter()
const currentUser = readAuthSession()
const activeNav = ref('优惠活动')
const actionMessage = ref('')
const loading = ref(false)
const errorMessage = ref('')
const coupons = ref([])
const saleProducts = ref([])
const seckillActivity = ref(null)
const seckillGoods = ref([])
const countdownText = ref('00:00:00')
let countdownTimer = null

const navItems = [
  { label: '首页', bottomLabel: '首页', icon: 'home', route: '/' },
  { label: '优惠活动', bottomLabel: '活动', icon: 'grid', route: '/category' },
  { label: '购物车', bottomLabel: '购物车', icon: 'cart', route: '/cart' },
  { label: '我的', bottomLabel: '我的', icon: 'user', route: '/profile' },
]

const activityEntries = [
  { id: 'seckill-hall', title: '秒杀会场', desc: '整点开抢，热门商品限时秒杀。', badge: '限时疯抢' },
  { id: 'sale-zone', title: '爆款直降', desc: '精选高销量商品，活动价直接触底。', badge: '爆款低价' },
  { id: 'coupon-center', title: '领券中心', desc: '新人券、满减券、运费券一站式领取。', badge: '下单更省' },
]

const displayName = computed(() => {
  if (!currentUser) {
    return '拾味用户'
  }

  return currentUser.nickname || currentUser.username || '拾味用户'
})

function renderPrice(price) {
  return Number(price).toFixed(2)
}

function resolveProductCardImage(product) {
  const images = Array.isArray(product?.productImages)
    ? product.productImages.filter((item) => typeof item === 'string' && item.trim())
    : []

  if (images.length) {
    const seed = Number(product?.productId ?? product?.id ?? 0)
    return images[Math.abs(seed) % images.length]
  }

  return product?.productImage || ''
}

function resolveTheme(product) {
  return `theme-${product.theme || 'electronics-phone'}`
}

function withProductImages(product) {
  return {
    ...product,
    productImage: product?.productImage || '',
    productImages: Array.isArray(product?.productImages) ? product.productImages : [],
  }
}

function stopCountdown() {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function formatCountdown(target) {
  const diff = Math.max(0, target - Date.now())
  const hours = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function startCountdown(endTime) {
  stopCountdown()
  countdownText.value = formatCountdown(endTime)
  countdownTimer = window.setInterval(() => {
    countdownText.value = formatCountdown(endTime)
  }, 1000)
}

function mapSeckillGoods(goods, index) {
  const matched = catalogProducts.find((item) => String(item.id) === String(goods.productId))
  return {
    id: goods.goodsId ?? goods.productId ?? `seckill-${index}`,
    productId: goods.productId,
    name: matched?.name || goods.productName || `秒杀商品 ${index + 1}`,
    desc: matched?.desc || '限时特惠，库存有限，先到先得。',
    price: Number(goods.seckillPrice ?? matched?.price ?? 0),
    originalPrice: Number(goods.originalPrice ?? matched?.price ?? goods.seckillPrice ?? 0),
    remainStock: Number(goods.remainStock ?? goods.seckillStock ?? 0),
    seckillStock: Number(goods.seckillStock ?? goods.remainStock ?? 0),
    unit: matched?.unit || '/件',
    theme: matched?.theme || 'electronics-phone',
  }
}

function mapPromotionProduct(item) {
  return {
    id: item.productId,
    productId: item.productId,
    name: item.productName,
    desc: item.description,
    category: item.category,
    subcategory: item.subcategory,
    theme: item.theme || 'electronics-phone',
    price: Number(item.promotionPrice ?? 0),
    originalPrice: Number(item.originalPrice ?? item.promotionPrice ?? 0),
    sales: Number(item.sales ?? 0),
    popularity: Number(item.popularity ?? 0),
    stock: Number(item.stock ?? 0),
    unit: '/件',
    tag: item.tag || '特价',
  }
}

async function loadSeckillActivity() {
  loading.value = true
  errorMessage.value = ''

  try {
    const activities = await fetchSeckillActivities()
    const active = activities.find((item) => Number(item.activityStatus) === 1) || activities[0]

    if (!active?.activityId) {
      seckillActivity.value = null
      seckillGoods.value = []
      return
    }

    const detail = await fetchSeckillActivityDetail(active.activityId)
    seckillActivity.value = detail
    seckillGoods.value = Array.isArray(detail?.goodsList)
      ? detail.goodsList.slice(0, 4).map((item, index) => withProductImages(mapSeckillGoods(item, index)))
      : []

    if (detail?.endTime) {
      startCountdown(Number(detail.endTime))
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '活动数据加载失败'
    seckillActivity.value = null
    seckillGoods.value = []
  } finally {
    loading.value = false
  }
}

async function loadCoupons() {
  coupons.value = await fetchPromotionCoupons()
}

async function loadSpecialProducts() {
  const data = await fetchPromotionSpecialProducts()
  saleProducts.value = data
    .filter((item) => item.status === 'ACTIVE')
    .map((item) => withProductImages(mapPromotionProduct(item)))
}

function handleNavClick(item) {
  activeNav.value = item.label

  if (item.route) {
    router.push(item.route)
  }
}

function handleBackHome() {
  router.push('/')
}

function openProductDetail(productId) {
  router.push(`/product/${productId}`)
}

async function handleAddCart(product) {
  actionMessage.value = ''

  try {
    await addCartItem({
      productId: product.productId ?? product.id,
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

async function claimCoupon(coupon) {
  try {
    await claimPromotionCoupon(coupon.couponId)
    await loadCoupons()
    actionMessage.value = `${coupon.title}领取成功，去下单试试吧`
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '优惠券领取失败'
  }
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }

  Promise.all([loadSeckillActivity(), loadCoupons(), loadSpecialProducts()])
})

onBeforeUnmount(() => {
  stopCountdown()
})
</script>

<template>
  <main class="category-shell">
    <section class="category-frame activity-frame">
      <header class="category-topbar">
        <div class="category-heading">
          <button class="category-back" type="button" @click="handleBackHome" aria-label="返回首页">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </button>
          <div>
            <p class="category-heading__eyebrow">Promotion Hub</p>
            <h1>优惠活动</h1>
            <p class="category-heading__desc">你好，{{ displayName }}。这里汇总秒杀、优惠券和特价商品，帮你更快找到现在最值得买的活动。</p>
          </div>
        </div>

        <nav class="home-desktop-nav category-desktop-nav" aria-label="活动页导航">
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

      <section class="activity-hero">
        <div class="activity-hero__copy">
          <p class="section-heading__eyebrow">Today Deals</p>
          <h2>今日优惠主会场</h2>
          <p>限时秒杀、领券立减、爆款直降都集中在这里，热门活动一页逛完。</p>
          <div class="hero-tags">
            <span class="hero-tag">秒杀直降</span>
            <span class="hero-tag">领券更省</span>
            <span class="hero-tag">爆款低价</span>
          </div>
        </div>

        <div class="activity-hero__visual">
          <div class="hero-product-stage hero-product-stage--electronics-phone">
            <span class="hero-product-shape hero-product-shape--main"></span>
            <span class="hero-product-shape hero-product-shape--accent"></span>
            <span class="hero-product-shape hero-product-shape--detail"></span>
          </div>
        </div>
      </section>

      <section class="activity-section">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Seckill</p>
            <h3>限时秒杀</h3>
          </div>
          <div class="activity-section__meta">
            <strong>{{ seckillActivity?.activityName || '活动准备中' }}</strong>
            <span>{{ countdownText }}</span>
          </div>
        </div>

        <section v-if="errorMessage" class="category-status category-status--error">
          {{ errorMessage }}
        </section>

        <div v-if="loading" class="category-empty">
          <h3>活动加载中</h3>
          <p>正在同步秒杀活动数据，请稍候。</p>
        </div>

        <div v-else-if="seckillGoods.length" class="category-product-grid">
          <article
            v-for="product in seckillGoods"
            :key="product.id"
            class="category-product-card category-product-card--interactive"
            @click="openProductDetail(product.productId)"
          >
            <div class="category-product-card__visual" :class="resolveTheme(product)">
              <img
                v-if="resolveProductCardImage(product)"
                class="category-product-card__image"
                :src="resolveProductCardImage(product)"
                :alt="product.name"
              />
            </div>

            <div class="category-product-card__content">
              <div class="category-product-card__top">
                <div>
                  <span class="category-product-card__subcategory">秒杀专享</span>
                  <h4>{{ product.name }}</h4>
                  <p>{{ product.desc }}</p>
                </div>
                <span class="category-product-card__stock">剩余 {{ product.remainStock }}</span>
              </div>

              <div class="activity-price-row">
                <div class="product-price">
                  <span class="price-symbol">¥</span>
                  <strong>{{ renderPrice(product.price) }}</strong>
                  <span class="price-unit">{{ product.unit }}</span>
                </div>
                <div class="activity-origin-price">原价 ¥{{ renderPrice(product.originalPrice) }}</div>
              </div>

              <div class="category-product-card__meta">
                <button
                  class="hero-action hero-action--secondary"
                  type="button"
                  @click.stop="handleAddCart(product)"
                >
                  加入购物车
                </button>
                <button
                  class="hero-action hero-action--primary"
                  type="button"
                  @click.stop="openProductDetail(product.productId)"
                >
                  立即抢购
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="category-empty">
          <h3>当前暂无秒杀商品</h3>
          <p>活动会场正在准备中，稍后再来看看新的限时优惠。</p>
        </div>
      </section>

      <section class="activity-section">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Coupons</p>
            <h3>优惠券专区</h3>
          </div>
        </div>

        <div class="activity-coupon-grid">
          <article v-for="coupon in coupons" :key="coupon.couponId" class="activity-coupon-card">
            <div>
              <p class="activity-coupon-card__tag">{{ coupon.tag }}</p>
              <h4>{{ coupon.value }}</h4>
              <strong>{{ coupon.title }}</strong>
              <p>{{ coupon.description }}</p>
            </div>
            <button
              class="activity-coupon-card__action"
              :class="{ 'is-claimed': coupon.claimed }"
              type="button"
              :disabled="coupon.claimed"
              @click="claimCoupon(coupon)"
            >
              {{ coupon.claimed ? '已领取' : '立即领取' }}
            </button>
          </article>
        </div>
      </section>

      <section class="activity-section">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Sale Picks</p>
            <h3>特价商品</h3>
          </div>
        </div>

        <div class="category-product-grid">
          <article
            v-for="product in saleProducts"
            :key="product.id"
            class="category-product-card category-product-card--interactive"
            @click="openProductDetail(product.id)"
          >
            <div class="category-product-card__visual" :class="resolveTheme(product)">
              <img
                v-if="resolveProductCardImage(product)"
                class="category-product-card__image"
                :src="resolveProductCardImage(product)"
                :alt="product.name"
              />
            </div>

            <div class="category-product-card__content">
              <div class="category-product-card__top">
                <div>
                  <span class="category-product-card__subcategory">{{ product.subcategory }}</span>
                  <h4>{{ product.name }}</h4>
                  <p>{{ product.desc }}</p>
                </div>
                <span class="category-product-card__stock">{{ product.tag }}</span>
              </div>

              <div class="activity-price-row">
                <div class="product-price">
                  <span class="price-symbol">¥</span>
                  <strong>{{ renderPrice(product.price) }}</strong>
                  <span class="price-unit">{{ product.unit }}</span>
                </div>
                <div class="activity-origin-price">原价 ¥{{ renderPrice(product.originalPrice) }}</div>
              </div>

              <div class="category-product-card__meta">
                <button
                  class="product-action"
                  type="button"
                  :aria-label="`加入购物车：${product.name}`"
                  @click.stop="handleAddCart(product)"
                >
                  +
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="activity-section">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">More Events</p>
            <h3>热门活动</h3>
          </div>
        </div>

        <div class="activity-entry-grid">
          <article v-for="entry in activityEntries" :key="entry.id" class="activity-entry-card">
            <span class="activity-entry-card__badge">{{ entry.badge }}</span>
            <h4>{{ entry.title }}</h4>
            <p>{{ entry.desc }}</p>
          </article>
        </div>
      </section>

      <section v-if="actionMessage" class="status-tip status-tip--success home-action-tip">
        {{ actionMessage }}
      </section>

      <nav class="bottom-nav" aria-label="活动页底部导航">
        <button
          v-for="item in navItems"
          :key="`bottom-${item.label}`"
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
          <span>{{ item.bottomLabel }}</span>
        </button>
      </nav>
    </section>
  </main>
</template>
