<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  addCartItem,
  fetchProductDetail,
  fetchSeckillActivities,
  fetchSeckillActivityDetail,
  fetchSeckillResult,
  readAuthSession,
  submitSeckillOrder,
} from '../api'

const route = useRoute()
const router = useRouter()
const currentUser = readAuthSession()
const loading = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')
const detail = ref(null)
const seckillActivity = ref(null)
const matchedSeckillGoods = ref(null)
const countdownText = ref('00:00:00')
const activeImageIndex = ref(0)
let countdownTimer = null
let galleryTimer = null

const gallery = computed(() => {
  const images = detail.value?.productImages || []
  if (!images.length) {
    return detail.value?.productImage
      ? [{ id: 1, image: detail.value.productImage, label: `${detail.value.productName} 图 1` }]
      : []
  }
  return images.slice(0, 5).map((image, index) => ({
    id: index + 1,
    image,
    label: `${detail.value?.productName || '商品'} 图 ${index + 1}`,
  }))
})

const activeImage = computed(() => gallery.value[activeImageIndex.value]?.image || detail.value?.productImage || '')

const detailTitle = computed(() => detail.value?.productName || '商品详情')
const detailDesc = computed(() => {
  if (matchedSeckillGoods.value) {
    return `${detailTitle.value} 当前已进入特价秒杀活动，可直接查看秒杀价、剩余库存与抢购倒计时。`
  }
  return detail.value?.description || detailTitle.value
})

const originPrice = computed(() => {
  if (matchedSeckillGoods.value?.originalPrice != null) {
    return Number(matchedSeckillGoods.value.originalPrice)
  }
  return Number(detail.value?.price ?? 0)
})

const displayPrice = computed(() => {
  if (matchedSeckillGoods.value?.seckillPrice != null) {
    return Number(matchedSeckillGoods.value.seckillPrice)
  }
  return Number(detail.value?.price ?? 0)
})

const remainStock = computed(() => {
  if (matchedSeckillGoods.value?.remainStock != null) {
    return Number(matchedSeckillGoods.value.remainStock)
  }
  return Number(detail.value?.stock ?? 0)
})

const isSeckill = computed(() => Boolean(seckillActivity.value && matchedSeckillGoods.value))

const progressPercent = computed(() => {
  const current = remainStock.value
  const total = Number(matchedSeckillGoods.value?.seckillStock ?? detail.value?.stock ?? 0)
  if (!total) {
    return 0
  }
  return Math.max(6, Math.min(100, Math.round((current / total) * 100)))
})

function renderPrice(price) {
  return Number(price).toFixed(2)
}

function stopCountdown() {
  if (countdownTimer) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function stopGalleryLoop() {
  if (galleryTimer) {
    window.clearInterval(galleryTimer)
    galleryTimer = null
  }
}

function prevImage() {
  if (!gallery.value.length) {
    return
  }
  activeImageIndex.value = (activeImageIndex.value - 1 + gallery.value.length) % gallery.value.length
}

function nextImage() {
  if (!gallery.value.length) {
    return
  }
  activeImageIndex.value = (activeImageIndex.value + 1) % gallery.value.length
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

function startGalleryLoop() {
  stopGalleryLoop()
  if (gallery.value.length <= 1) {
    return
  }
  galleryTimer = window.setInterval(() => {
    activeImageIndex.value = (activeImageIndex.value + 1) % gallery.value.length
  }, 2800)
}

function chooseImage(index) {
  activeImageIndex.value = index
  startGalleryLoop()
}

async function loadProductDetail() {
  loading.value = true
  errorMessage.value = ''
  actionMessage.value = ''
  stopCountdown()
  stopGalleryLoop()

  try {
    const productId = route.params.productId
    detail.value = await fetchProductDetail(productId)
    activeImageIndex.value = 0
    startGalleryLoop()

    const activities = await fetchSeckillActivities()
    const matchedActivity = activities.find((activity) =>
      Array.isArray(activity.goodsList) && activity.goodsList.some((goods) => String(goods.productId) === String(productId)),
    )

    if (matchedActivity?.activityId) {
      const activityDetail = await fetchSeckillActivityDetail(matchedActivity.activityId)
      seckillActivity.value = activityDetail
      matchedSeckillGoods.value = activityDetail?.goodsList?.find((goods) => String(goods.productId) === String(productId)) || null

      if (activityDetail?.endTime) {
        startCountdown(Number(activityDetail.endTime))
      }
    } else {
      seckillActivity.value = null
      matchedSeckillGoods.value = null
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '商品详情加载失败'
  } finally {
    loading.value = false
  }
}

async function handleAddCart() {
  if (!detail.value) {
    return
  }

  try {
    await addCartItem({
      productId: Number(route.params.productId),
      productName: detail.value.productName,
      productImage: detail.value.productImage || gallery.value[0]?.image || '',
      price: displayPrice.value,
      quantity: 1,
    })
    actionMessage.value = `${detail.value.productName} 已加入购物车`
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '加入购物车失败'
  }
}

async function handleSeckillBuy() {
  if (!isSeckill.value || !seckillActivity.value || !matchedSeckillGoods.value) {
    actionMessage.value = '当前商品暂无秒杀活动，已为你保留普通购买入口。'
    return
  }

  actionMessage.value = '正在提交秒杀订单...'

  try {
    await submitSeckillOrder({
      activityId: seckillActivity.value.activityId,
      goodsId: matchedSeckillGoods.value.goodsId,
      buyNum: 1,
    })

    const result = await fetchSeckillResult(seckillActivity.value.activityId)
    actionMessage.value = typeof result === 'string' ? result : '秒杀请求已提交，请稍后在订单结果中查看状态。'
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '秒杀提交失败'
  }
}

function handleBack() {
  router.back()
}

function goCategory() {
  router.push('/category')
}

function goCart() {
  router.push('/cart')
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }

  loadProductDetail()
})

onBeforeUnmount(() => {
  stopCountdown()
  stopGalleryLoop()
})
</script>

<template>
  <main class="detail-shell">
    <section class="detail-frame" v-if="!errorMessage">
      <header class="detail-topbar">
        <div class="detail-topbar__left">
          <button class="category-back" type="button" @click="handleBack" aria-label="返回上一页">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </button>
          <div>
            <p class="category-heading__eyebrow">Product Detail</p>
            <h1>商品详情</h1>
          </div>
        </div>

        <nav class="home-desktop-nav" aria-label="详情页导航">
          <button class="desktop-nav__item" type="button" @click="router.push('/')">首页</button>
          <button class="desktop-nav__item is-active" type="button">商品详情</button>
          <button class="desktop-nav__item" type="button" @click="goCategory">优惠活动</button>
          <button class="desktop-nav__item" type="button" @click="goCart">购物车</button>
        </nav>
      </header>

      <section class="detail-gallery">
        <article
          v-for="(item, index) in gallery"
          :key="item.id"
          class="detail-gallery__item"
          :class="{ 'is-active': activeImageIndex === index }"
          @click="chooseImage(index)"
        >
          <img class="detail-gallery__thumb" :src="item.image" :alt="item.label" />
        </article>
      </section>

      <section class="detail-summary-card">
        <div class="detail-summary-card__header">
          <div>
            <h2>{{ detailTitle }}</h2>
            <p>{{ detailDesc }}</p>
          </div>
          <div v-if="isSeckill" class="detail-countdown">
            <span>秒杀倒计时</span>
            <strong>{{ countdownText }}</strong>
          </div>
        </div>

        <div class="detail-pricing">
          <div class="detail-price-primary">
            <span class="price-symbol">¥</span>
            <strong>{{ renderPrice(displayPrice) }}</strong>
            <small>剩余 {{ remainStock }} 件</small>
          </div>

          <div class="detail-progress">
            <div class="detail-progress__track">
              <span class="detail-progress__value" :style="{ width: `${progressPercent}%` }"></span>
            </div>
          </div>

          <div class="detail-price-secondary">
            <span class="price-symbol">¥</span>
            <strong>{{ renderPrice(originPrice) }}</strong>
            <small>{{ isSeckill ? '原价展示' : '当前售价' }}</small>
          </div>
        </div>
      </section>

      <section class="detail-content-card">
        <div class="detail-content-card__media">
          <div class="detail-badge" v-if="isSeckill">
            秒杀
            <small>{{ countdownText }}</small>
          </div>
          <div class="detail-main-visual" @mouseenter="stopGalleryLoop" @mouseleave="startGalleryLoop">
            <button class="detail-main-visual__arrow is-prev" type="button" @click="prevImage" aria-label="上一张">
              ‹
            </button>
            <img v-if="activeImage" class="detail-main-visual__image" :src="activeImage" :alt="detailTitle" />
            <button class="detail-main-visual__arrow is-next" type="button" @click="nextImage" aria-label="下一张">
              ›
            </button>
          </div>
        </div>

        <div class="detail-content-card__text">
          <h3>图文介绍</h3>
          <p>
            {{ detailTitle }} 使用统一商品详情页展示逻辑承接，当前会根据接口自动判断是否显示秒杀模块。电脑端采用图文分栏，
            手机端会收拢成单列布局，并保留清晰的价格信息、倒计时和底部操作区。
          </p>
          <hr />
          <p>
            当前商品库存为 {{ detail?.stock ?? 0 }} 件；若参与活动，则同步展示秒杀库存
            {{ matchedSeckillGoods?.remainStock ?? detail?.stock ?? 0 }} 件。后续只要后端补充更完整的商品图片和介绍，这个页面就可以直接复用。
          </p>
          <div v-if="actionMessage" class="status-tip status-tip--info detail-action-tip">
            {{ actionMessage }}
          </div>
        </div>
      </section>

      <section class="detail-action-bar">
        <button class="detail-secondary-button" type="button" @click="handleAddCart">加入购物车</button>
        <button class="detail-primary-button" type="button" @click="handleSeckillBuy">
          {{ isSeckill ? '立即抢购' : '立即购买' }}
        </button>
      </section>
    </section>

    <section v-else class="detail-error-card">
      <h2>商品详情加载失败</h2>
      <p>{{ errorMessage }}</p>
      <button class="detail-primary-button" type="button" @click="goCategory">返回活动页</button>
    </section>
  </main>
</template>
