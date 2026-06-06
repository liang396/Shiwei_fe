<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  completeMockPayment,
  createAlipayPayment,
  fetchAddressList,
  fetchAvailableCoupons,
  fetchOrderDetail,
  readAuthSession,
  updateOrderDetailOptions,
} from '../api'

const route = useRoute()
const router = useRouter()
const currentUser = readAuthSession()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const order = ref(null)
const paying = ref(false)
const syncing = ref(false)
const addressList = ref([])
const availableCoupons = ref([])
const selectedAddressId = ref(null)
const selectedCouponId = ref(null)
const selectedPayChannel = ref('MOCK_PAY')
const remainSeconds = ref(0)
let countdownTimer = null

const itemCount = computed(() =>
  Array.isArray(order.value?.items)
    ? order.value.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    : 0,
)

const primaryItem = computed(() => (Array.isArray(order.value?.items) ? order.value.items[0] || null : null))

const selectedAddress = computed(() =>
  addressList.value.find((item) => item.addressId === selectedAddressId.value) || null,
)

const selectedCoupon = computed(() =>
  availableCoupons.value.find((item) => item.couponId === selectedCouponId.value) || null,
)

const couponThresholdMet = computed(() => (coupon) => {
  if (!coupon) {
    return true
  }
  return Number(order.value?.goodsAmount || 0) >= Number(coupon.thresholdAmount || 0)
})

const canPay = computed(() =>
  order.value?.orderStatusCode === 0 && remainSeconds.value > 0,
)

const payButtonLabel = computed(() => {
  if (order.value?.orderStatusCode === 2) {
    return '已支付'
  }
  if (order.value?.orderStatusCode === 1) {
    return '订单已取消'
  }
  if (canPay.value) {
    return '立即支付'
  }
  return '订单已超时'
})

const canEditOptions = computed(() =>
  order.value?.orderStatusCode === 0 && remainSeconds.value > 0,
)

const paymentMethodLabel = computed(() => {
  if (selectedPayChannel.value === 'MOCK_PAY') {
    return '微信支付'
  }
  if (selectedPayChannel.value === 'ALIPAY') {
    return '支付宝'
  }
  if (order.value?.payChannel === 'MOCK_PAY') {
    return '微信支付'
  }
  if (order.value?.payChannel === 'ALIPAY') {
    return '支付宝'
  }
  return order.value?.payChannel || '微信支付'
})

const statusAmountLabel = computed(() => {
  if (order.value?.orderStatusCode === 0) {
    return '待支付'
  }
  if (order.value?.orderStatusCode === 1) {
    return order.value?.cancelReason || '已取消'
  }
  return '实付'
})

const statusToneClass = computed(() => {
  if (order.value?.orderStatusCode === 2) {
    return 'is-paid'
  }
  if (order.value?.orderStatusCode === 1) {
    return 'is-canceled'
  }
  return 'is-pending'
})

const orderSubtotal = computed(() => Number(order.value?.goodsAmount || 0) + Number(order.value?.discountAmount || 0))

const couponDetailLabel = computed(() => {
  if (!selectedCoupon.value) {
    return '未使用优惠券'
  }
  return `${selectedCoupon.value.title} · ${selectedCoupon.value.value}`
})

const couponHintText = computed(() => {
  if (!selectedCoupon.value) {
    return '可切换优惠券，金额会实时重算'
  }
  if (!couponThresholdMet.value(selectedCoupon.value)) {
    return `当前订单未满 ${selectedCoupon.value.thresholdAmount} 元，不可使用该优惠券`
  }
  return `已使用：${selectedCoupon.value.title}，优惠 ${selectedCoupon.value.value}`
})

function renderPrice(price) {
  return Number(price || 0).toFixed(2)
}

function formatRemain(seconds) {
  const safe = Math.max(0, Number(seconds || 0))
  const minutes = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function startCountdown(seconds) {
  window.clearInterval(countdownTimer)
  remainSeconds.value = Number(seconds || 0)
  if (remainSeconds.value <= 0) {
    return
  }
  countdownTimer = window.setInterval(async () => {
    if (remainSeconds.value <= 1) {
      remainSeconds.value = 0
      window.clearInterval(countdownTimer)
      await loadOrderDetail()
      return
    }
    remainSeconds.value -= 1
  }, 1000)
}

function syncSelectionState() {
  if (!order.value) {
    return
  }
  selectedAddressId.value = order.value.addressId
  selectedCouponId.value = order.value.couponId || null
  selectedPayChannel.value = order.value.payChannel && order.value.payChannel !== 'UNPAID'
    ? order.value.payChannel
    : 'MOCK_PAY'
  startCountdown(order.value.payRemainSeconds || 0)
}

async function loadOrderDetail() {
  loading.value = true
  errorMessage.value = ''

  try {
    order.value = await fetchOrderDetail(route.params.orderId)
    if (!order.value) {
      errorMessage.value = '未找到对应订单'
      return
    }
    syncSelectionState()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单详情加载失败'
  } finally {
    loading.value = false
  }
}

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [orderDetail, addresses, coupons] = await Promise.all([
      fetchOrderDetail(route.params.orderId),
      fetchAddressList(),
      fetchAvailableCoupons(),
    ])
    order.value = orderDetail
    addressList.value = addresses
    availableCoupons.value = coupons
    if (!order.value) {
      errorMessage.value = '未找到对应订单'
      return
    }
    syncSelectionState()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单详情加载失败'
  } finally {
    loading.value = false
  }
}

async function syncOrderOptions() {
  if (!order.value || !selectedAddress.value) {
    return
  }

  if (selectedCoupon.value && !couponThresholdMet.value(selectedCoupon.value)) {
    errorMessage.value = `当前订单未满 ${selectedCoupon.value.thresholdAmount}，不可使用该优惠券`
    selectedCouponId.value = order.value.couponId || null
    return
  }

  syncing.value = true
  errorMessage.value = ''
  try {
    order.value = await updateOrderDetailOptions(order.value.orderNo, {
      addressId: selectedAddress.value.addressId,
      consignee: selectedAddress.value.consignee,
      mobile: selectedAddress.value.mobileRaw || selectedAddress.value.mobile,
      address: selectedAddress.value.addressRaw || selectedAddress.value.address,
      couponId: selectedCoupon.value?.couponId || null,
      couponTitle: selectedCoupon.value?.title || '',
      payChannel: selectedPayChannel.value,
    })
    syncSelectionState()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '订单选项更新失败'
  } finally {
    syncing.value = false
  }
}

async function handlePay() {
  if (!order.value || !canPay.value) {
    return
  }

  await syncOrderOptions()
  paying.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const paymentPage = await createAlipayPayment(order.value.orderId, order.value.orderNo)
    if (typeof paymentPage === 'string' && paymentPage.trim()) {
      const paymentWindow = window.open('', '_blank')
      if (paymentWindow) {
        paymentWindow.document.open()
        paymentWindow.document.write(paymentPage)
        paymentWindow.document.close()
      }
    }
    await completeMockPayment({
      orderNo: order.value.orderNo,
      payAmount: order.value.payAmount,
    })
    await loadOrderDetail()
    successMessage.value = `订单 ${order.value.orderNo} 支付成功`
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '发起支付失败'
  } finally {
    paying.value = false
  }
}

function goBack() {
  const from = route.query.from
  if (from === 'profile') {
    router.push('/profile')
    return
  }
  if (from === 'orders') {
    router.push('/orders')
    return
  }
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/orders')
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }
  loadPageData()
})

onBeforeUnmount(() => {
  window.clearInterval(countdownTimer)
})
</script>

<template>
  <main class="order-detail-page">
    <section v-if="!errorMessage" class="order-detail-page__wrap">
      <header class="order-detail-page__hero">
        <button class="order-detail-page__back" type="button" @click="goBack" aria-label="返回订单列表">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
        </button>
        <div class="order-detail-page__title">
          <h1>订单详情</h1>
          <p>ORDER DETAIL</p>
        </div>
      </header>

      <section v-if="successMessage" class="status-tip status-tip--success">
        {{ successMessage }}
      </section>

      <section v-if="loading" class="order-detail-panel order-detail-loading">
        <h2>正在加载订单详情...</h2>
      </section>

      <section v-else-if="order" class="order-detail-layout">
        <div class="order-detail-main">
          <section class="order-detail-panel order-detail-status-panel">
            <div class="order-status-pill" :class="statusToneClass">
              <span>{{ order.orderStatus }}</span>
            </div>
            <div class="order-status-meta">
              <div>
                <label>订单号</label>
                <strong>{{ order.orderNo }}</strong>
              </div>
              <div>
                <label>下单时间</label>
                <span>{{ order.createdTime || '刚刚创建' }}</span>
              </div>
              <div>
                <label>支付倒计时</label>
                <strong>{{ canPay ? formatRemain(remainSeconds) : '已结束' }}</strong>
              </div>
            </div>
          </section>

          <section class="order-detail-panel order-detail-address-panel">
            <div class="order-detail-section-head">
              <h2>收货信息</h2>
              <span v-if="syncing">同步中...</span>
            </div>

            <div class="order-address-grid">
              <label class="order-input-card order-input-card--address">
                <span>当前收货信息</span>
                <div class="order-address-inline" v-if="selectedAddress">
                  <strong>{{ selectedAddress.consignee }} {{ selectedAddress.mobile }}</strong>
                  <p>{{ selectedAddress.address }}</p>
                </div>
                <select v-model="selectedAddressId" :disabled="!canEditOptions" @change="syncOrderOptions">
                  <option v-for="address in addressList" :key="address.addressId" :value="address.addressId">
                    {{ address.consignee }} {{ address.mobile }} · {{ address.address }}
                  </option>
                </select>
              </label>

              <div class="order-address-preview" v-if="selectedAddress">
                <strong>{{ selectedAddress.consignee }} {{ selectedAddress.mobile }}</strong>
                <p>{{ selectedAddress.address }}</p>
              </div>
            </div>
          </section>

          <section class="order-detail-panel order-detail-goods-panel">
            <div class="order-detail-section-head">
              <h2>商品清单</h2>
            </div>

            <article
              v-for="(item, index) in order.items || []"
              :key="`${item.productId}-${index}`"
              class="order-goods-row"
            >
              <div class="order-goods-thumb">
                <img v-if="item.productImage" :src="item.productImage" :alt="item.productName" />
              </div>
              <div class="order-goods-copy">
                <h3>{{ item.productName }}</h3>
                <p>订单号：{{ order.orderNo }}</p>
                <div class="order-goods-pricing">
                  <strong>￥{{ renderPrice(item.price) }}</strong>
                  <span>× {{ item.quantity }}</span>
                </div>
              </div>
              <div class="order-goods-total">￥{{ renderPrice(Number(item.price || 0) * Number(item.quantity || 0)) }}</div>
            </article>

            <div class="order-inline-summary">
              <div><span>单价</span><strong>￥{{ renderPrice(primaryItem?.price) }}</strong></div>
              <div><span>数量</span><strong>{{ primaryItem?.quantity || itemCount }}</strong></div>
              <div><span>小计</span><strong class="is-primary">￥{{ renderPrice(order.goodsAmount) }}</strong></div>
            </div>
          </section>
        </div>

        <aside class="order-detail-side">
          <section class="order-detail-panel order-detail-side-panel">
            <div class="order-detail-section-head">
              <h2>金额汇总</h2>
            </div>

            <div class="order-side-list">
              <div><span>商品总价</span><strong>￥{{ renderPrice(orderSubtotal) }}</strong></div>
              <div><span>优惠金额</span><strong class="is-discount">-￥{{ renderPrice(order.discountAmount) }}</strong></div>
              <div><span>优惠详情</span><strong>{{ couponDetailLabel }}</strong></div>
            </div>

            <div class="order-side-divider"></div>

            <div class="order-side-controls">
              <label class="order-input-card">
                <span>优惠券</span>
                <select v-model="selectedCouponId" :disabled="!canEditOptions" @change="syncOrderOptions">
                  <option :value="null">不使用优惠券</option>
                  <option
                    v-for="coupon in availableCoupons"
                    :key="coupon.couponId"
                    :value="coupon.couponId"
                    :disabled="!couponThresholdMet(coupon)"
                  >
                    {{ coupon.title }} · {{ coupon.value }}
                  </option>
                </select>
                <small class="order-field-hint" :class="{ 'is-warning': selectedCoupon && !couponThresholdMet(selectedCoupon) }">
                  {{ couponHintText }}
                </small>
              </label>

              <div class="order-input-card order-input-card--payments">
                <span>支付方式</span>
                <div class="order-payment-choices">
                  <button
                    class="order-payment-choice"
                    :class="{ 'is-active': selectedPayChannel === 'MOCK_PAY' }"
                    type="button"
                    :disabled="!canEditOptions"
                    @click="selectedPayChannel = 'MOCK_PAY'; syncOrderOptions()"
                  >
                    <strong>微信支付</strong>
                    <small>推荐，立即跳转模拟支付</small>
                  </button>
                  <button
                    class="order-payment-choice"
                    :class="{ 'is-active': selectedPayChannel === 'ALIPAY' }"
                    type="button"
                    :disabled="!canEditOptions"
                    @click="selectedPayChannel = 'ALIPAY'; syncOrderOptions()"
                  >
                    <strong>支付宝</strong>
                    <small>切换后按当前订单发起支付</small>
                  </button>
                </div>
              </div>
            </div>

            <div class="order-side-divider"></div>

            <div class="order-side-pay">
              <div class="order-side-pay__label">
                <span>{{ statusAmountLabel }}</span>
                <strong v-if="order.orderStatusCode !== 1">{{ paymentMethodLabel }}</strong>
              </div>
              <div class="order-side-pay__amount" v-if="order.orderStatusCode !== 1">￥{{ renderPrice(order.payAmount) }}</div>
            </div>

            <button
              class="order-side-paybtn"
              type="button"
              :disabled="paying || syncing || !canPay"
              @click="handlePay"
            >
              {{ paying ? '支付中...' : payButtonLabel }}
            </button>
          </section>
        </aside>
      </section>
    </section>

    <section v-else class="detail-error-card">
      <h2>订单详情加载失败</h2>
      <p>{{ errorMessage }}</p>
      <button class="detail-primary-button" type="button" @click="goBack">返回订单列表</button>
    </section>
  </main>
</template>
