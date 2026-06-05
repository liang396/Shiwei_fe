<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { fetchOrderDetail, readAuthSession } from '../api'

const route = useRoute()
const router = useRouter()
const currentUser = readAuthSession()
const loading = ref(false)
const errorMessage = ref('')
const order = ref(null)

const itemCount = computed(() =>
  Array.isArray(order.value?.items)
    ? order.value.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    : 0,
)

function renderPrice(price) {
  return Number(price || 0).toFixed(2)
}

async function loadOrderDetail() {
  loading.value = true
  errorMessage.value = ''

  try {
    order.value = await fetchOrderDetail(route.params.orderId)
    if (!order.value) {
      errorMessage.value = '未找到对应订单'
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单详情加载失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/orders')
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }

  loadOrderDetail()
})
</script>

<template>
  <main class="profile-shell order-detail-shell">
    <section class="profile-frame order-detail-frame" v-if="!errorMessage">
      <header class="profile-topbar">
        <div class="category-heading">
          <button class="category-back" type="button" @click="goBack" aria-label="返回订单列表">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </button>
          <div>
            <p class="category-heading__eyebrow">Order Detail</p>
            <h1>订单详情</h1>
          </div>
        </div>
      </header>

      <section v-if="loading" class="profile-panel profile-empty-state">
        <h2>正在加载订单详情...</h2>
      </section>

      <template v-else-if="order">
        <section class="profile-panel order-detail-hero">
          <div class="order-detail-hero__main">
            <h2>{{ order.orderStatus || '订单处理中' }}</h2>
            <p>订单号：{{ order.orderNo }}</p>
            <p>下单时间：{{ order.createdTime || '刚刚创建' }}</p>
          </div>
          <div class="order-detail-hero__amount">
            <span>实付金额</span>
            <strong>¥{{ renderPrice(order.payAmount) }}</strong>
          </div>
        </section>

        <section class="profile-panel order-detail-grid">
          <article class="profile-info-card">
            <div class="profile-section-title">
              <h3>收货地址</h3>
            </div>
            <div class="profile-list">
              <div class="profile-list-item profile-list-item--static">
                <div>
                  <strong>{{ order.consignee }} {{ order.mobile }}</strong>
                  <p>{{ order.address }}</p>
                </div>
              </div>
            </div>
          </article>

          <article class="profile-info-card">
            <div class="profile-section-title">
              <h3>订单摘要</h3>
            </div>
            <div class="order-summary-list">
              <div><span>商品件数</span><strong>{{ itemCount }}</strong></div>
              <div><span>支付方式</span><strong>{{ order.payChannel || '支付宝' }}</strong></div>
              <div><span>商品总价</span><strong>¥{{ renderPrice(order.goodsAmount) }}</strong></div>
              <div><span>优惠金额</span><strong>¥{{ renderPrice(order.discountAmount) }}</strong></div>
            </div>
          </article>
        </section>

        <section class="profile-panel">
          <div class="profile-section-title">
            <h3>商品清单</h3>
          </div>
          <div class="order-detail-items">
            <article v-for="(item, index) in order.items || []" :key="`${item.productId}-${index}`" class="order-detail-item">
              <div class="order-detail-item__visual"></div>
              <div class="order-detail-item__content">
                <h4>{{ item.productName }}</h4>
                <p>单价 ¥{{ renderPrice(item.price) }}</p>
                <p>数量 {{ item.quantity }}</p>
              </div>
              <strong>¥{{ renderPrice(Number(item.price || 0) * Number(item.quantity || 0)) }}</strong>
            </article>
          </div>
        </section>
      </template>
    </section>

    <section v-else class="detail-error-card">
      <h2>订单详情加载失败</h2>
      <p>{{ errorMessage }}</p>
      <button class="detail-primary-button" type="button" @click="goBack">返回订单列表</button>
    </section>
  </main>
</template>
