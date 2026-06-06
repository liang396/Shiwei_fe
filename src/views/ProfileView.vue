<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  deleteAddress,
  fetchProfileOverview,
  readAuthSession,
  saveAddress,
  saveAuthSession,
  saveProfileUser,
} from '../api'

const router = useRouter()
const currentUser = readAuthSession()
const loading = ref(false)
const errorMessage = ref('')
const savingAddress = ref(false)
const savingProfile = ref(false)
const profile = ref(null)
const activeSection = ref('orders')
const showAddressForm = ref(false)
const showProfileForm = ref(false)

const addressForm = reactive({
  addressId: null,
  consignee: '',
  mobile: '',
  address: '',
  isDefault: false,
})

const profileForm = reactive({
  userId: 1,
  nickname: '',
  avatar: '🙂',
})

const avatarOptions = ['🙂', '😉', '😄', '😎', '🧑', '👩', '🧃', '🎈']

const memberLabel = computed(() => profile.value?.user?.memberLevel || '普通会员')
const recentOrders = computed(() => (profile.value?.recentOrders || []).slice(0, 6))

const statsCards = computed(() => [
  {
    key: 'pending',
    title: '待支付',
    value: profile.value?.orderStats?.pending ?? 0,
    tone: 'blue',
    action: () => {
      activeSection.value = 'orders'
      router.push('/orders?status=0')
    },
  },
  {
    key: 'total',
    title: '累计订单',
    value: profile.value?.orderStats?.total ?? 0,
    tone: 'gold',
    action: () => {
      activeSection.value = 'orders'
      router.push('/orders')
    },
  },
])

const sidebarLinks = computed(() => [
  { key: 'orders', title: '我的订单' },
  { key: 'addresses', title: '收货地址' },
  { key: 'reviews', title: '我的评价' },
  { key: 'coupons', title: '我的优惠券' },
])

function syncProfileForm() {
  profileForm.userId = profile.value?.user?.userId || 1
  profileForm.nickname = profile.value?.user?.nickname || ''
  profileForm.avatar = profile.value?.user?.avatar || '🙂'
}

function resetAddressForm() {
  addressForm.addressId = null
  addressForm.consignee = ''
  addressForm.mobile = ''
  addressForm.address = ''
  addressForm.isDefault = false
}

function renderPrice(price) {
  return Number(price || 0).toFixed(2)
}

function orderBadgeText(order) {
  if (order.orderStatusCode === 0) {
    return '待支付'
  }
  if (order.orderStatusCode === 1) {
    return '已取消'
  }
  return order.orderStatus || '已完成'
}

function orderAmountText(order) {
  if (order.orderStatusCode === 0) {
    return `待支付 ￥${renderPrice(order.payAmount)}`
  }
  if (order.orderStatusCode === 1) {
    return order.cancelReason ? `已取消 · ${order.cancelReason}` : '已取消'
  }
  return `实付 ￥${renderPrice(order.payAmount)}`
}

function orderTitle(order) {
  return order.items?.[0]?.productName || '订单商品'
}

function orderIconTone(order) {
  if (order.orderStatusCode === 0) {
    return 'red'
  }
  if (order.orderStatusCode === 1) {
    return 'gray'
  }
  return 'blue'
}

function orderStatusToneClass(order) {
  if (order.orderStatusCode === 0) {
    return 'is-red'
  }
  if (order.orderStatusCode === 1) {
    return 'is-gray'
  }
  return 'is-green'
}

function openCreateAddress() {
  resetAddressForm()
  showAddressForm.value = true
}

function openEditAddress(address) {
  addressForm.addressId = address.addressId
  addressForm.consignee = address.consignee
  addressForm.mobile = address.mobileRaw || address.mobile
  addressForm.address = address.addressRaw || address.address
  addressForm.isDefault = Boolean(address.isDefault)
  showAddressForm.value = true
}

function closeAddressForm() {
  showAddressForm.value = false
}

function openProfileForm() {
  syncProfileForm()
  showProfileForm.value = true
}

function closeProfileForm() {
  showProfileForm.value = false
}

async function loadProfileOverview() {
  loading.value = true
  errorMessage.value = ''

  try {
    profile.value = await fetchProfileOverview()
    syncProfileForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '个人中心加载失败'
  } finally {
    loading.value = false
  }
}

async function handleSaveAddress() {
  savingAddress.value = true
  errorMessage.value = ''

  try {
    await saveAddress({ ...addressForm })
    await loadProfileOverview()
    activeSection.value = 'addresses'
    closeAddressForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地址保存失败'
  } finally {
    savingAddress.value = false
  }
}

async function handleDeleteAddress(addressId) {
  errorMessage.value = ''
  try {
    await deleteAddress(addressId)
    await loadProfileOverview()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地址删除失败'
  }
}

async function handleSetDefaultAddress(address) {
  errorMessage.value = ''
  try {
    await saveAddress({
      addressId: address.addressId,
      consignee: address.consignee,
      mobile: address.mobileRaw || address.mobile,
      address: address.addressRaw || address.address,
      isDefault: true,
    })
    await loadProfileOverview()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '默认地址设置失败'
  }
}

async function handleSaveProfile() {
  savingProfile.value = true
  errorMessage.value = ''

  try {
    const updatedUser = await saveProfileUser({ ...profileForm })
    saveAuthSession(updatedUser)
    if (profile.value) {
      profile.value.user = updatedUser
    }
    closeProfileForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '个人信息保存失败'
  } finally {
    savingProfile.value = false
  }
}

function openOrder(orderNo) {
  router.push({ path: `/orders/${orderNo}`, query: { from: 'profile' } })
}

function goAllOrders() {
  activeSection.value = 'orders'
  router.push('/orders')
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }
  loadProfileOverview()
})
</script>

<template>
  <main class="account-page">
    <section v-if="errorMessage" class="category-status category-status--error">
      {{ errorMessage }}
    </section>

    <template v-else>
      <header class="profile-topbar account-page-topbar">
        <div class="category-heading">
          <div>
            <p class="category-heading__eyebrow">PROFILE HUB</p>
            <h1>我的</h1>
            <p class="category-heading__desc">查看订单、收货地址、评价和优惠券，点击头像可以直接修改个人信息。</p>
          </div>
        </div>

        <nav class="home-desktop-nav" aria-label="桌面导航">
          <button class="desktop-nav__item" type="button" @click="router.push('/')">首页</button>
          <button class="desktop-nav__item" type="button" @click="router.push('/category')">优惠活动</button>
          <button class="desktop-nav__item" type="button" @click="router.push('/cart')">购物车</button>
          <button class="desktop-nav__item is-active" type="button">我的</button>
        </nav>
      </header>

      <section class="account-wrap account-wrap--clean">
        <aside class="account-sidebar account-sidebar--clean">
          <div class="account-sidebar__card account-sidebar__card--clean">
            <button class="account-avatar-card account-avatar-card--clean" type="button" @click="openProfileForm">
              <div class="account-avatar account-avatar--clean">{{ profile?.user?.avatar || '🙂' }}</div>
              <div class="account-avatar__meta account-avatar__meta--clean">
                <h2>{{ profile?.user?.nickname || profile?.user?.username || '拾味用户' }}</h2>
                <p>{{ profile?.user?.phone || '未绑定手机号' }}</p>
              </div>
            </button>

            <div class="account-member-pill">{{ memberLabel }}</div>
          </div>

          <nav class="account-nav account-nav--clean">
            <button
              v-for="link in sidebarLinks"
              :key="link.key"
              class="account-nav__item account-nav__item--clean"
              :class="{ 'is-active': activeSection === link.key }"
              type="button"
              @click="activeSection = link.key"
            >
              <span>{{ link.title }}</span>
              <span class="account-nav__arrow">›</span>
            </button>
          </nav>
        </aside>

        <section class="account-main account-main--clean">
          <section v-if="loading" class="profile-panel profile-empty-state">
            <p>正在同步个人中心数据...</p>
          </section>

          <template v-else>
            <section class="account-stats account-stats--clean">
              <article
                v-for="card in statsCards"
                :key="card.key"
                class="account-stat-card account-stat-card--clean"
                :class="`is-${card.tone}`"
                @click="card.action"
              >
                <div class="account-stat-card__text">
                  <h3>{{ card.title }}</h3>
                  <strong>{{ card.value }}</strong>
                </div>
                <div class="account-stat-card__ring"></div>
              </article>
            </section>

            <section v-if="activeSection === 'orders'" class="profile-panel account-orders-panel account-orders-panel--clean">
              <div class="profile-section-title account-orders-panel__head">
                <h3>最近订单</h3>
                <button class="profile-add-button" type="button" @click="goAllOrders">查看全部</button>
              </div>

              <div class="account-order-list account-order-list--clean">
                <article
                  v-for="order in recentOrders"
                  :key="order.orderId"
                  class="account-order-item account-order-item--clean"
                  @click="openOrder(order.orderNo)"
                >
                  <div class="account-order-item__lead">
                    <div class="account-order-item__icon account-order-item__icon--clean" :class="`is-${orderIconTone(order)}`"></div>
                    <div class="account-order-item__main account-order-item__main--clean">
                      <h4>{{ orderTitle(order) }}</h4>
                      <p>订单号：{{ order.orderNo }}</p>
                      <p>{{ order.createdTime || '刚刚创建' }}</p>
                    </div>
                  </div>

                  <div class="account-order-item__side account-order-item__side--clean">
                    <span class="profile-chip" :class="{ 'is-gray': order.orderStatusCode === 1, 'is-red': order.orderStatusCode === 0 }">
                      {{ orderBadgeText(order) }}
                    </span>
                    <strong>￥{{ renderPrice(order.payAmount) }}</strong>
                    <p :class="orderStatusToneClass(order)">{{ orderAmountText(order) }}</p>
                  </div>
                </article>
              </div>
            </section>

            <section v-if="activeSection === 'addresses'" class="profile-panel">
              <div class="profile-section-title">
                <h3>收货地址</h3>
                <button class="profile-add-button" type="button" @click="openCreateAddress">新增地址</button>
              </div>

              <div class="profile-list">
                <article
                  v-for="address in profile?.addresses || []"
                  :key="address.addressId"
                  class="profile-list-item profile-list-item--static"
                >
                  <div>
                    <strong>{{ address.consignee }} {{ address.mobile }}</strong>
                    <p>{{ address.address }}</p>
                  </div>
                  <div class="profile-address-actions">
                  <button
                    class="profile-inline-button"
                    type="button"
                    :disabled="address.isDefault"
                    @click="handleSetDefaultAddress(address)"
                  >
                    {{ address.isDefault ? '默认地址' : '设为默认' }}
                  </button>
                    <button class="profile-inline-button" type="button" @click="openEditAddress(address)">编辑</button>
                    <button class="profile-inline-button profile-inline-button--danger" type="button" @click="handleDeleteAddress(address.addressId)">删除</button>
                  </div>
                </article>
              </div>
            </section>

            <section v-if="activeSection === 'reviews'" class="profile-panel">
              <div class="profile-section-title">
                <h3>我的评价</h3>
              </div>

              <div class="profile-list">
                <article
                  v-for="review in profile?.reviews || []"
                  :key="review.reviewId"
                  class="profile-list-item profile-list-item--static"
                >
                  <div>
                    <strong>{{ review.productName }}</strong>
                    <p>{{ review.content }}</p>
                  </div>
                  <span class="profile-chip">{{ review.score }} 分</span>
                </article>
              </div>
            </section>

            <section v-if="activeSection === 'coupons'" class="profile-panel">
              <div class="profile-section-title">
                <h3>我的优惠券</h3>
              </div>

              <div class="profile-list">
                <article
                  v-for="coupon in profile?.coupons || []"
                  :key="coupon.couponId"
                  class="profile-list-item profile-list-item--static"
                >
                  <div>
                    <strong>{{ coupon.title }} · {{ coupon.value }}</strong>
                    <p>{{ coupon.description }}</p>
                  </div>
                  <span class="profile-chip">
                    {{ coupon.status === 'USED' ? '已使用' : coupon.claimed ? '已领取' : '可领取' }}
                  </span>
                </article>
              </div>
            </section>
          </template>
        </section>
      </section>
    </template>

    <nav class="bottom-nav" aria-label="个人中心底部导航">
      <button class="bottom-nav__item" type="button" @click="router.push('/')"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" /></svg></span><span>首页</span></button>
      <button class="bottom-nav__item" type="button" @click="router.push('/category')"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /><rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /><rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /><rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /></svg></span><span>优惠活动</span></button>
      <button class="bottom-nav__item" type="button" @click="router.push('/cart')"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><path d="M5 6h2l1.2 7.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.78L19 8H8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /><circle cx="10" cy="18.5" r="1.5" fill="currentColor" /><circle cx="17" cy="18.5" r="1.5" fill="currentColor" /></svg></span><span>购物车</span></button>
      <button class="bottom-nav__item is-active" type="button"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" /><path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" /></svg></span><span>我的</span></button>
    </nav>

    <div v-if="showAddressForm" class="payment-mask">
      <section class="payment-modal profile-address-modal">
        <button class="payment-close" type="button" aria-label="关闭地址表单" @click="closeAddressForm">×</button>
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

    <div v-if="showProfileForm" class="payment-mask">
      <section class="payment-modal profile-address-modal">
        <button class="payment-close" type="button" aria-label="关闭资料表单" @click="closeProfileForm">×</button>
        <h2>编辑个人信息</h2>
        <div class="profile-form-grid">
          <label class="profile-form-field profile-form-field--full">
            <span>昵称</span>
            <input v-model="profileForm.nickname" type="text" placeholder="请输入昵称" />
          </label>
          <div class="profile-form-field profile-form-field--full">
            <span>头像</span>
            <div class="profile-avatar-picker">
              <button
                v-for="avatar in avatarOptions"
                :key="avatar"
                class="profile-avatar-option"
                :class="{ 'is-active': profileForm.avatar === avatar }"
                type="button"
                @click="profileForm.avatar = avatar"
              >
                {{ avatar }}
              </button>
            </div>
          </div>
        </div>
        <button class="payment-confirm" type="button" :disabled="savingProfile" @click="handleSaveProfile">
          {{ savingProfile ? '保存中...' : '保存个人信息' }}
        </button>
      </section>
    </div>
  </main>
</template>
