<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { deleteAddress, fetchProfileOverview, readAuthSession, saveAddress, saveAuthSession, saveProfileUser } from '../api'

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
const avatarOptions = ['🙂', '😊', '😎', '🧑', '👩', '👨', '🛍️', '🌟']

const quickCards = computed(() => [
  {
    key: 'orders',
    title: '我的订单',
    desc: `${profile.value?.orderStats?.total ?? 0} 笔订单`,
    action: () => router.push('/orders'),
  },
  {
    key: 'addresses',
    title: '收货地址',
    desc: `${profile.value?.addresses?.length ?? 0} 个常用地址`,
    action: () => {
      activeSection.value = 'addresses'
    },
  },
])

const infoRows = computed(() => [
  {
    key: 'profile',
    title: '个人信息',
    desc: profile.value?.user?.phone || '未绑定手机号',
    action: () => {
      activeSection.value = 'profile'
    },
  },
  {
    key: 'reviews',
    title: '我的评价',
    desc: `${profile.value?.reviews?.length ?? 0} 条评价`,
    action: () => {
      activeSection.value = 'reviews'
    },
  },
  {
    key: 'coupons',
    title: '我的优惠券',
    desc: `${profile.value?.coupons?.length ?? 0} 张优惠券`,
    action: () => {
      activeSection.value = 'coupons'
    },
  },
])

const sectionTitle = computed(() => {
  const map = {
    orders: '最近订单',
    addresses: '收货地址',
    profile: '个人信息',
    reviews: '我的评价',
    coupons: '我的优惠券',
  }
  return map[activeSection.value] || '个人中心'
})

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

function syncProfileForm() {
  profileForm.userId = profile.value?.user?.userId || 1
  profileForm.nickname = profile.value?.user?.nickname || ''
  profileForm.avatar = profile.value?.user?.avatar || '🙂'
}

function openCreateAddress() {
  resetAddressForm()
  showAddressForm.value = true
}

function openEditAddress(address) {
  addressForm.addressId = address.addressId
  addressForm.consignee = address.consignee
  addressForm.mobile = address.mobile
  addressForm.address = address.address
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

async function handleDeleteAddress(addressId) {
  errorMessage.value = ''
  try {
    await deleteAddress(addressId)
    await loadProfileOverview()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '地址删除失败'
  }
}

function openOrder(orderId) {
  router.push(`/orders/${orderId}`)
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
  <main class="profile-shell">
    <section class="profile-frame">
      <header class="profile-topbar">
        <div class="category-heading">
          <div>
            <p class="category-heading__eyebrow">Profile</p>
            <h1>我的</h1>
            <p class="category-heading__desc">订单、地址、昵称、头像和评价都集中在这里。</p>
          </div>
        </div>

        <nav class="home-desktop-nav" aria-label="个人中心导航">
          <button class="desktop-nav__item" type="button" @click="router.push('/')">首页</button>
          <button class="desktop-nav__item" type="button" @click="router.push('/category')">优惠活动</button>
          <button class="desktop-nav__item" type="button" @click="router.push('/cart')">购物车</button>
          <button class="desktop-nav__item is-active" type="button">我的</button>
        </nav>
      </header>

      <section v-if="errorMessage" class="category-status category-status--error">
        {{ errorMessage }}
      </section>

      <template v-else>
        <section class="profile-hero">
          <div class="profile-avatar">{{ profile?.user?.avatar || '🙂' }}</div>
          <div class="profile-hero__content">
            <h2>{{ profile?.user?.nickname || profile?.user?.username || '拾味用户' }}</h2>
            <p>{{ profile?.user?.phone || '未绑定手机号' }}</p>
            <div class="profile-badges">
              <span>待支付 {{ profile?.orderStats?.pending ?? 0 }}</span>
              <span>累计订单 {{ profile?.orderStats?.total ?? 0 }}</span>
              <span>{{ profile?.user?.memberLevel || '普通会员' }}</span>
            </div>
          </div>
        </section>

        <section class="profile-layout">
          <aside class="profile-sidebar">
            <button class="profile-side-link" :class="{ 'is-active': activeSection === 'orders' }" type="button" @click="activeSection = 'orders'">我的订单</button>
            <button class="profile-side-link" :class="{ 'is-active': activeSection === 'addresses' }" type="button" @click="activeSection = 'addresses'">收货地址</button>
            <button class="profile-side-link" :class="{ 'is-active': activeSection === 'profile' }" type="button" @click="activeSection = 'profile'">个人信息</button>
            <button class="profile-side-link" :class="{ 'is-active': activeSection === 'reviews' }" type="button" @click="activeSection = 'reviews'">我的评价</button>
            <button class="profile-side-link" :class="{ 'is-active': activeSection === 'coupons' }" type="button" @click="activeSection = 'coupons'">我的优惠券</button>
          </aside>

          <section class="profile-content">
            <div class="profile-card-grid">
              <button v-for="card in quickCards" :key="card.key" class="profile-shortcut-card" type="button" @click="card.action">
                <div>
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                </div>
                <span>›</span>
              </button>
            </div>

            <section class="profile-panel">
              <div class="profile-section-title">
                <h3>{{ sectionTitle }}</h3>
                <button v-if="activeSection === 'addresses'" class="profile-add-button" type="button" @click="openCreateAddress">新增地址</button>
                <button v-if="activeSection === 'profile'" class="profile-add-button" type="button" @click="openProfileForm">编辑资料</button>
              </div>

              <div v-if="loading" class="profile-empty-state">
                <p>正在同步个人中心数据...</p>
              </div>

              <template v-else>
                <div v-if="activeSection === 'orders'" class="profile-orders">
                  <article
                    v-for="order in profile?.recentOrders || []"
                    :key="order.orderId"
                    class="profile-order-card"
                    @click="openOrder(order.orderId)"
                  >
                    <div>
                      <h4>{{ order.orderNo }}</h4>
                      <p>{{ order.createdTime || '刚刚创建' }}</p>
                    </div>
                    <div class="profile-order-card__meta">
                      <span>{{ order.orderStatus }}</span>
                      <strong>¥{{ renderPrice(order.payAmount) }}</strong>
                    </div>
                  </article>
                </div>

                <div v-else-if="activeSection === 'addresses'" class="profile-list">
                  <article v-for="address in profile?.addresses || []" :key="address.addressId" class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>{{ address.consignee }} {{ address.mobile }}</strong>
                      <p>{{ address.address }}</p>
                    </div>
                    <div class="profile-address-actions">
                      <span class="profile-chip" v-if="address.isDefault">默认</span>
                      <button class="profile-inline-button" type="button" @click="openEditAddress(address)">编辑</button>
                      <button class="profile-inline-button profile-inline-button--danger" type="button" @click="handleDeleteAddress(address.addressId)">删除</button>
                    </div>
                  </article>
                </div>

                <div v-else-if="activeSection === 'profile'" class="profile-list">
                  <article class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>头像</strong>
                      <p>{{ profile?.user?.avatar || '🙂' }}</p>
                    </div>
                  </article>
                  <article class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>用户名</strong>
                      <p>{{ profile?.user?.username || '-' }}</p>
                    </div>
                  </article>
                  <article class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>昵称</strong>
                      <p>{{ profile?.user?.nickname || '-' }}</p>
                    </div>
                  </article>
                  <article class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>手机号</strong>
                      <p>{{ profile?.user?.phone || '-' }}</p>
                    </div>
                  </article>
                </div>

                <div v-else-if="activeSection === 'reviews'" class="profile-list">
                  <article v-for="review in profile?.reviews || []" :key="review.reviewId" class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>{{ review.productName }}</strong>
                      <p>{{ review.content }}</p>
                    </div>
                    <span class="profile-chip">{{ review.score }} 分</span>
                  </article>
                </div>

                <div v-else class="profile-list">
                  <article v-for="coupon in profile?.coupons || []" :key="coupon.couponId" class="profile-list-item profile-list-item--static">
                    <div>
                      <strong>{{ coupon.title }} · {{ coupon.value }}</strong>
                      <p>{{ coupon.description }}</p>
                    </div>
                    <span class="profile-chip">{{ coupon.status === 'USED' ? '已使用' : coupon.claimed ? '已领取' : '可领取' }}</span>
                  </article>
                </div>
              </template>
            </section>

            <section class="profile-panel profile-menu-list">
              <button v-for="row in infoRows" :key="row.key" class="profile-list-item" type="button" @click="row.action">
                <div>
                  <strong>{{ row.title }}</strong>
                  <p>{{ row.desc }}</p>
                </div>
                <span>›</span>
              </button>
            </section>
          </section>
        </section>
      </template>

      <nav class="bottom-nav" aria-label="个人中心底部导航">
        <button class="bottom-nav__item" type="button" @click="router.push('/')"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" /></svg></span><span>首页</span></button>
        <button class="bottom-nav__item" type="button" @click="router.push('/category')"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /><rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /><rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /><rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" /></svg></span><span>活动</span></button>
        <button class="bottom-nav__item" type="button" @click="router.push('/cart')"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><path d="M5 6h2l1.2 7.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.78L19 8H8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /><circle cx="10" cy="18.5" r="1.5" fill="currentColor" /><circle cx="17" cy="18.5" r="1.5" fill="currentColor" /></svg></span><span>购物车</span></button>
        <button class="bottom-nav__item is-active" type="button"><span class="bottom-nav__icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" /><path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" /></svg></span><span>我的</span></button>
      </nav>
    </section>

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
