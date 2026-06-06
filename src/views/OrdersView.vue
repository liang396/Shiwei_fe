<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import { completeMockPayment, createAlipayPayment, fetchOrderPage } from '../api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)
const orders = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const nextLastId = ref(null)
const nextCreatedTime = ref(null)
const hasMore = ref(true)
const payingOrderNo = ref('')

const ORDER_PAGE_SIZE = 6
const createdOrderId = computed(() => route.query.created)
const orderStatusFilter = computed(() => {
  if (route.query.status === undefined || route.query.status === null || route.query.status === '') {
    return null
  }
  return Number(route.query.status)
})

function renderPrice(price) {
  return Number(price || 0).toFixed(2)
}

function paymentSummary(order) {
  if (order.orderStatusCode === 0) {
    return `待支付 ￥${renderPrice(order.payAmount)}`
  }
  if (order.orderStatusCode === 1) {
    return order.cancelReason ? `已取消 · ${order.cancelReason}` : '已取消'
  }
  return `实付 ￥${renderPrice(order.payAmount)}`
}

function paymentSummaryToneClass(order) {
  if (order.orderStatusCode === 0) {
    return 'is-red'
  }
  if (order.orderStatusCode === 1) {
    return 'is-gray'
  }
  return 'is-green'
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const page = await fetchOrderPage({ size: ORDER_PAGE_SIZE, status: orderStatusFilter.value })
    orders.value = Array.isArray(page.records) ? page.records : []
    nextLastId.value = page.nextLastId ?? null
    nextCreatedTime.value = page.nextCreatedTime ?? null
    hasMore.value = Boolean(page.hasMore)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单列表加载失败'
  } finally {
    loading.value = false
  }
}

async function loadMoreOrders() {
  if (loadingMore.value || !hasMore.value) {
    return
  }

  loadingMore.value = true
  try {
    const page = await fetchOrderPage({
      lastId: nextLastId.value,
      lastCreatedTime: nextCreatedTime.value,
      size: ORDER_PAGE_SIZE,
      status: orderStatusFilter.value,
    })
    const records = Array.isArray(page.records) ? page.records : []
    orders.value = [...orders.value, ...records]
    nextLastId.value = page.nextLastId ?? null
    nextCreatedTime.value = page.nextCreatedTime ?? null
    hasMore.value = Boolean(page.hasMore)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单分页加载失败'
  } finally {
    loadingMore.value = false
  }
}

function backHome() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}

function openOrderDetail(orderNo) {
  router.push({ path: `/orders/${orderNo}`, query: { from: 'orders' } })
}

async function handlePay(order) {
  payingOrderNo.value = order.orderNo
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const paymentPage = await createAlipayPayment(order.orderId, order.orderNo)
    if (typeof paymentPage === 'string' && paymentPage.trim()) {
      const paymentWindow = window.open('', '_blank')
      if (paymentWindow) {
        paymentWindow.document.open()
        paymentWindow.document.write(paymentPage)
        paymentWindow.document.close()
      }
    }
    await completeMockPayment({
      orderNo: order.orderNo,
      payAmount: order.payAmount,
    })
    await loadOrders()
    successMessage.value = `订单 ${order.orderNo} 支付成功`
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '发起支付失败'
  } finally {
    payingOrderNo.value = ''
  }
}

onMounted(() => {
  if (!currentUser.value) {
    router.replace('/login')
    return
  }

  loadOrders()
})
</script>

<template>
  <main class="orders-shell">
    <section class="orders-frame">
      <header class="checkout-header">
        <button class="category-back" type="button" @click="backHome" aria-label="返回首页">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
        </button>
        <h1>我的订单</h1>
      </header>

      <section v-if="createdOrderId" class="status-tip status-tip--success">
        下单成功，订单号：{{ createdOrderId }}
      </section>

      <section v-if="successMessage" class="status-tip status-tip--success">
        {{ successMessage }}
      </section>

      <section v-if="errorMessage" class="category-status category-status--error">
        {{ errorMessage }}
      </section>

      <section v-else-if="!loading && !orders.length" class="cart-empty">
        <h2>还没有订单</h2>
        <p>先去首页挑几件喜欢的商品吧。</p>
      </section>

      <section v-else class="orders-list">
        <article
          v-for="order in orders"
          :key="order.orderId"
          class="orders-card orders-card--interactive"
          @click="openOrderDetail(order.orderNo)"
        >
          <div class="orders-card__header">
            <div>
              <h3>订单号：{{ order.orderNo }}</h3>
              <p>{{ order.createdTime || '刚刚创建' }}</p>
              <p>{{ order.consignee }} · {{ order.mobile }}</p>
            </div>
            <span class="orders-status">{{ order.orderStatus }}</span>
          </div>

          <p class="orders-address">{{ order.address }}</p>

          <div class="orders-meta">
            <span>商品数：{{ order.items?.length || 0 }}</span>
            <strong :class="paymentSummaryToneClass(order)">{{ paymentSummary(order) }}</strong>
          </div>

          <div v-if="order.orderStatusCode === 0" class="section-heading section-heading--load-more">
            <button
              class="section-heading__action"
              type="button"
              :disabled="payingOrderNo === order.orderNo"
              @click.stop="handlePay(order)"
            >
              {{ payingOrderNo === order.orderNo ? '支付中...' : '去支付' }}
            </button>
          </div>
        </article>

        <div v-if="hasMore" class="section-heading section-heading--load-more">
          <button class="section-heading__action" type="button" :disabled="loadingMore" @click="loadMoreOrders">
            {{ loadingMore ? '加载中...' : '加载更多订单' }}
          </button>
        </div>
      </section>
    </section>
  </main>
</template>
