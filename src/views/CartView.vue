<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  checkCartItem,
  fetchCartList,
  readAuthSession,
  removeCartItem,
  saveCheckoutSelection,
  updateCartItem,
} from '../api'

const router = useRouter()
const currentUser = readAuthSession()
const cartItems = ref([])
const loading = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')

const checkedItems = computed(() => cartItems.value.filter((item) => item.checked))
const isAllChecked = computed(() => cartItems.value.length > 0 && checkedItems.value.length === cartItems.value.length)
const totalAmount = computed(() =>
  checkedItems.value.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
)

function renderPrice(price) {
  return Number(price).toFixed(2)
}

async function loadCartList() {
  loading.value = true
  errorMessage.value = ''

  try {
    cartItems.value = await fetchCartList()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '购物车加载失败'
  } finally {
    loading.value = false
  }
}

async function syncItems(task) {
  actionMessage.value = ''

  try {
    cartItems.value = await task()
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '购物车操作失败'
  }
}

function toggleAll() {
  syncItems(() =>
    checkCartItem({
      cartId: 0,
      checked: !isAllChecked.value,
    }),
  )
}

function toggleItem(item) {
  syncItems(() =>
    checkCartItem({
      cartId: item.cartId,
      checked: !item.checked,
    }),
  )
}

function changeQuantity(item, delta) {
  const next = Math.max(1, Number(item.quantity || 1) + delta)
  syncItems(() =>
    updateCartItem({
      cartId: item.cartId,
      quantity: next,
    }),
  )
}

function handleRemove(item) {
  syncItems(() => removeCartItem(item.cartId))
}

function goCategory() {
  router.push('/category')
}

function goCheckout() {
  if (!checkedItems.value.length) {
    actionMessage.value = '请先选择商品再结算。'
    return
  }

  saveCheckoutSelection(checkedItems.value)
  router.push('/checkout')
}

function goProfile() {
  router.push('/profile')
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }

  loadCartList()
})
</script>

<template>
  <main class="cart-shell">
    <section class="cart-frame">
      <header class="cart-header">
        <nav class="home-desktop-nav cart-desktop-nav" aria-label="桌面导航">
          <button class="desktop-nav__item" type="button" @click="router.push('/')">首页</button>
          <button class="desktop-nav__item" type="button" @click="goCategory">优惠活动</button>
          <button class="desktop-nav__item is-active" type="button">购物车</button>
          <button class="desktop-nav__item" type="button" @click="goProfile">我的</button>
        </nav>

        <button class="category-back" type="button" @click="goCategory" aria-label="返回活动页">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
        </button>

        <div class="cart-header__title">
          <h1>购物车</h1>
        </div>
      </header>

      <section v-if="errorMessage" class="category-status category-status--error">
        {{ errorMessage }}
      </section>

      <section v-else-if="!loading && !cartItems.length" class="cart-empty">
        <h2>购物车还是空的</h2>
        <p>先去活动页挑几件喜欢的商品吧。</p>
        <button class="detail-primary-button cart-empty__button" type="button" @click="goCategory">去逛逛</button>
      </section>

      <section v-else class="cart-list">
        <article v-for="item in cartItems" :key="item.cartId" class="cart-card">
          <button
            class="cart-check"
            :class="{ 'is-checked': item.checked }"
            type="button"
            @click="toggleItem(item)"
            :aria-label="`切换勾选：${item.productName}`"
          >
            <span v-if="item.checked">✓</span>
          </button>

          <div class="cart-thumb">
            <img v-if="item.productImage" :src="item.productImage" :alt="item.productName" />
          </div>

          <div class="cart-card__content">
            <div>
              <h3>{{ item.productName }}</h3>
              <p>数量 {{ item.quantity }}，支持直接增减</p>
            </div>

            <div class="cart-card__bottom">
              <strong>¥{{ renderPrice(item.price) }}</strong>

              <div class="cart-stepper">
                <button type="button" @click="changeQuantity(item, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button type="button" @click="changeQuantity(item, 1)">+</button>
              </div>

              <button class="cart-remove" type="button" @click="handleRemove(item)">删除</button>
            </div>
          </div>
        </article>
      </section>

      <section v-if="cartItems.length" class="cart-summary">
        <button class="cart-summary__check" type="button" @click="toggleAll">
          <span class="cart-summary__circle" :class="{ 'is-checked': isAllChecked }"></span>
          <span>{{ isAllChecked ? '取消全选' : '全选' }}</span>
        </button>

        <div class="cart-summary__total">
          <span>合计金额</span>
          <strong>¥{{ renderPrice(totalAmount) }}</strong>
        </div>

        <button class="detail-primary-button cart-summary__checkout" type="button" @click="goCheckout">去结算</button>
      </section>

      <section v-if="actionMessage" class="status-tip status-tip--info cart-action-tip">
        {{ actionMessage }}
      </section>

      <nav class="bottom-nav" aria-label="购物车底部导航">
        <button class="bottom-nav__item" type="button" @click="router.push('/')">
          <span class="bottom-nav__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </span>
          <span>首页</span>
        </button>
        <button class="bottom-nav__item" type="button" @click="goCategory">
          <span class="bottom-nav__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
              <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
              <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </span>
          <span>活动</span>
        </button>
        <button class="bottom-nav__item is-active" type="button">
          <span class="bottom-nav__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 6h2l1.2 7.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.78L19 8H8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
              <circle cx="10" cy="18.5" r="1.5" fill="currentColor" />
              <circle cx="17" cy="18.5" r="1.5" fill="currentColor" />
            </svg>
          </span>
          <span>购物车</span>
        </button>
        <button class="bottom-nav__item" type="button" @click="goProfile">
          <span class="bottom-nav__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
              <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
            </svg>
          </span>
          <span>我的</span>
        </button>
      </nav>
    </section>
  </main>
</template>
