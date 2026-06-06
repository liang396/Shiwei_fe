<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  deleteAddress,
  fetchAddressList,
  fetchAvailableCoupons,
  readAuthSession,
  readCheckoutSelection,
  saveAddress,
  submitOrder,
} from '../api'

const router = useRouter()
const currentUser = readAuthSession()
const selectedItems = ref([])
const addressList = ref([])
const availableCoupons = ref([])
const selectedCouponId = ref(null)
const actionMessage = ref('')
const errorMessage = ref('')
const savingAddress = ref(false)
const addressPickerVisible = ref(false)
const addressEditorVisible = ref(false)

const addressForm = reactive({
  addressId: null,
  consignee: '',
  mobile: '',
  address: '',
  isDefault: false,
})

const selectedAddress = computed(() => addressList.value.find((item) => item.isDefault) || addressList.value[0] || null)
const goodsAmount = computed(() => selectedItems.value.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0))
const selectedCoupon = computed(() => availableCoupons.value.find((item) => item.couponId === selectedCouponId.value) || null)
const selectedCouponThreshold = computed(() => Number(selectedCoupon.value?.thresholdAmount || 0))
const selectedCouponDiscount = computed(() => Number(selectedCoupon.value?.discountAmount || 0))
const discountAmount = computed(() => {
  if (!selectedCoupon.value) {
    return goodsAmount.value >= 200 ? 20 : 0
  }

  if (goodsAmount.value < selectedCouponThreshold.value) {
    return 0
  }

  return selectedCouponDiscount.value
})
const payAmount = computed(() => Math.max(0, goodsAmount.value - discountAmount.value))

function renderPrice(price) {
  return Number(price || 0).toFixed(2)
}

function resetAddressForm() {
  addressForm.addressId = null
  addressForm.consignee = ''
  addressForm.mobile = ''
  addressForm.address = ''
  addressForm.isDefault = false
}

async function loadAddressList() {
  addressList.value = await fetchAddressList()
}

async function loadAvailableCoupons() {
  availableCoupons.value = await fetchAvailableCoupons()
}

async function handleSubmitOrder() {
  actionMessage.value = ''
  errorMessage.value = ''

  if (!selectedAddress.value) {
    errorMessage.value = '请先选择收货地址'
    return
  }

  if (selectedCoupon.value && goodsAmount.value < selectedCouponThreshold.value) {
    errorMessage.value = `当前订单未达到优惠券使用门槛：满 ${selectedCouponThreshold.value}`
    return
  }

  try {
    const createdOrder = await submitOrder({
      addressId: selectedAddress.value.addressId,
      consignee: selectedAddress.value.consignee,
      mobile: selectedAddress.value.mobileRaw || selectedAddress.value.mobile,
      address: selectedAddress.value.addressRaw || selectedAddress.value.address,
      couponId: selectedCoupon.value?.couponId || null,
      couponTitle: selectedCoupon.value?.title || '',
      goodsAmount: goodsAmount.value,
      discountAmount: discountAmount.value,
      payAmount: payAmount.value,
      items: selectedItems.value.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
    })

    actionMessage.value = '下单成功，订单已进入待发货流程。'
    router.push({ path: '/orders', query: { created: createdOrder.orderId } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '提交订单失败'
  }
}

function chooseCoupon(couponId) {
  if (selectedCouponId.value === couponId) {
    selectedCouponId.value = null
    return
  }

  const coupon = availableCoupons.value.find((item) => item.couponId === couponId)
  const numbers = String(coupon?.value || '').match(/\d+/g) || []
  const threshold = numbers.length ? Number(numbers[0]) : 0
  if (threshold && goodsAmount.value < threshold) {
    actionMessage.value = `当前订单未满 ${threshold}，暂时不能使用这张券`
    return
  }

  selectedCouponId.value = couponId
}

function goBack() {
  router.push('/cart')
}

function openAddressPicker() {
  addressPickerVisible.value = true
}

function closeAddressPicker() {
  addressPickerVisible.value = false
}

async function chooseAddress(address) {
  try {
    await saveAddress({
      addressId: address.addressId,
      consignee: address.consignee,
      mobile: address.mobileRaw || address.mobile,
      address: address.addressRaw || address.address,
      isDefault: true,
    })
    await loadAddressList()
    closeAddressPicker()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '切换地址失败'
  }
}

function openCreateAddress() {
  resetAddressForm()
  addressEditorVisible.value = true
}

function openEditAddress(address) {
  addressForm.addressId = address.addressId
  addressForm.consignee = address.consignee
  addressForm.mobile = address.mobileRaw || address.mobile
  addressForm.address = address.addressRaw || address.address
  addressForm.isDefault = Boolean(address.isDefault)
  addressEditorVisible.value = true
}

function closeAddressEditor() {
  addressEditorVisible.value = false
}

async function handleSaveAddress() {
  savingAddress.value = true
  try {
    await saveAddress({ ...addressForm })
    await loadAddressList()
    closeAddressEditor()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存地址失败'
  } finally {
    savingAddress.value = false
  }
}

async function handleDeleteAddress(addressId) {
  try {
    await deleteAddress(addressId)
    await loadAddressList()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除地址失败'
  }
}

onMounted(async () => {
  if (!currentUser) {
    router.replace('/login')
    return
  }

  selectedItems.value = readCheckoutSelection()
  if (!selectedItems.value.length) {
    errorMessage.value = '当前没有可结算商品，请先从购物车选择商品。'
  }

  try {
    await loadAddressList()
    await loadAvailableCoupons()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载结算数据失败'
  }
})
</script>

<template>
  <main class="checkout-shell">
    <section class="checkout-frame">
      <header class="checkout-header">
        <button class="category-back" type="button" @click="goBack" aria-label="返回购物车">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
          </svg>
        </button>
        <h1>确认订单</h1>
      </header>

      <section class="checkout-card checkout-address-card">
        <div v-if="selectedAddress">
          <p><strong>收货人：</strong>{{ selectedAddress.consignee }}</p>
          <p><strong>联系电话：</strong>{{ selectedAddress.mobile }}</p>
          <p><strong>地址：</strong>{{ selectedAddress.address }}</p>
        </div>
        <div v-else>
          <p><strong>还没有收货地址</strong></p>
          <p>请先新增地址后再提交订单。</p>
        </div>
        <button class="checkout-switch" type="button" @click="openAddressPicker">{{ selectedAddress ? '切换地址' : '新增地址' }}</button>
      </section>

      <section v-if="errorMessage" class="category-status category-status--error">
        {{ errorMessage }}
      </section>

      <section v-else class="checkout-card checkout-items-card">
        <h2>商品清单</h2>
        <article v-for="item in selectedItems" :key="item.cartId" class="checkout-item">
          <div class="checkout-item__thumb"></div>
          <div class="checkout-item__content">
            <h3>{{ item.productName }}</h3>
            <p>单价：<strong>¥{{ renderPrice(item.price) }}</strong></p>
            <p>数量：{{ item.quantity }}</p>
          </div>
        </article>

        <div v-if="availableCoupons.length" class="checkout-coupon-block">
          <h3>优惠券</h3>
          <div class="checkout-coupon-list">
            <button
              v-for="coupon in availableCoupons"
              :key="coupon.couponId"
              class="checkout-coupon-option"
              :class="{
                'is-active': selectedCouponId === coupon.couponId,
                'is-disabled': goodsAmount < (coupon.thresholdAmount || 0),
              }"
              type="button"
              @click="chooseCoupon(coupon.couponId)"
            >
              <strong>{{ coupon.value }}</strong>
              <span>{{ coupon.title }}</span>
              <small>{{ coupon.description }}</small>
            </button>
          </div>
        </div>

        <div class="checkout-total">
          <div>
            <p>商品总价：<strong>¥{{ renderPrice(goodsAmount) }}</strong></p>
            <p>优惠金额：<strong>¥{{ renderPrice(discountAmount) }}</strong></p>
          </div>
          <div class="checkout-total__pay">
            实付：<strong>¥{{ renderPrice(payAmount) }}</strong>
          </div>
        </div>
      </section>

      <section v-if="actionMessage" class="status-tip status-tip--success">
        {{ actionMessage }}
      </section>

      <button class="detail-primary-button checkout-submit" type="button" :disabled="Boolean(errorMessage) || !selectedAddress" @click="handleSubmitOrder">
        提交订单
      </button>
    </section>

    <div v-if="addressPickerVisible" class="payment-mask">
      <section class="payment-modal profile-address-modal">
        <button class="payment-close" type="button" aria-label="关闭地址列表" @click="closeAddressPicker">×</button>
        <h2>收货地址</h2>
        <div class="checkout-address-list">
          <article v-for="address in addressList" :key="address.addressId" class="checkout-address-option">
            <button class="checkout-address-option__main" type="button" @click="chooseAddress(address)">
              <strong>{{ address.consignee }} {{ address.mobile }}</strong>
              <p>{{ address.address }}</p>
            </button>
            <div class="profile-address-actions">
              <span class="profile-chip" v-if="address.isDefault">默认</span>
              <button class="profile-inline-button" type="button" @click="openEditAddress(address)">编辑</button>
              <button class="profile-inline-button profile-inline-button--danger" type="button" @click="handleDeleteAddress(address.addressId)">删除</button>
            </div>
          </article>
        </div>
        <button class="payment-confirm" type="button" @click="openCreateAddress">新增地址</button>
      </section>
    </div>

    <div v-if="addressEditorVisible" class="payment-mask">
      <section class="payment-modal profile-address-modal">
        <button class="payment-close" type="button" aria-label="关闭地址表单" @click="closeAddressEditor">×</button>
        <h2>{{ addressForm.addressId ? '编辑地址' : '新增地址' }}</h2>
        <div class="profile-form-grid">
          <label class="profile-form-field"><span>收货人</span><input v-model="addressForm.consignee" type="text" placeholder="请输入收货人姓名" /></label>
          <label class="profile-form-field"><span>联系电话</span><input v-model="addressForm.mobile" type="text" placeholder="请输入联系电话" /></label>
          <label class="profile-form-field profile-form-field--full"><span>详细地址</span><textarea v-model="addressForm.address" rows="3" placeholder="请输入详细地址"></textarea></label>
          <label class="profile-form-check"><input v-model="addressForm.isDefault" type="checkbox" /><span>设为默认收货地址</span></label>
        </div>
        <button class="payment-confirm" type="button" :disabled="savingAddress" @click="handleSaveAddress">{{ savingAddress ? '保存中...' : '保存地址' }}</button>
      </section>
    </div>
  </main>
</template>
