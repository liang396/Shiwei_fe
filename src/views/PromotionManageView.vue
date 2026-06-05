<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  deletePromotionSpecialProduct,
  fetchPromotionSpecialProducts,
  readAuthSession,
  savePromotionSpecialProduct,
  togglePromotionSpecialProduct,
} from '../api'

const router = useRouter()
const currentUser = readAuthSession()
const products = ref([])
const actionMessage = ref('')
const errorMessage = ref('')
const editorVisible = ref(false)
const saving = ref(false)

const form = reactive({
  productId: '',
  productName: '',
  description: '',
  category: '',
  subcategory: '',
  theme: '',
  originalPrice: '',
  promotionPrice: '',
  stock: '',
  sales: '',
  popularity: '',
  tag: '',
  status: 'ACTIVE',
})

async function loadProducts() {
  errorMessage.value = ''
  try {
    products.value = await fetchPromotionSpecialProducts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '特价商品加载失败'
  }
}

function resetForm() {
  form.productId = ''
  form.productName = ''
  form.description = ''
  form.category = ''
  form.subcategory = ''
  form.theme = ''
  form.originalPrice = ''
  form.promotionPrice = ''
  form.stock = ''
  form.sales = ''
  form.popularity = ''
  form.tag = ''
  form.status = 'ACTIVE'
}

function openCreate() {
  resetForm()
  editorVisible.value = true
}

function openEdit(product) {
  form.productId = product.productId
  form.productName = product.productName
  form.description = product.description
  form.category = product.category
  form.subcategory = product.subcategory
  form.theme = product.theme
  form.originalPrice = product.originalPrice
  form.promotionPrice = product.promotionPrice
  form.stock = product.stock
  form.sales = product.sales
  form.popularity = product.popularity
  form.tag = product.tag
  form.status = product.status
  editorVisible.value = true
}

function closeEditor() {
  editorVisible.value = false
}

async function saveProduct() {
  errorMessage.value = ''
  if (!form.productId || !form.productName || !form.category || !form.subcategory || !form.originalPrice || !form.promotionPrice || !form.tag) {
    errorMessage.value = '请先完整填写特价商品信息'
    return
  }
  if (Number(form.promotionPrice) >= Number(form.originalPrice)) {
    errorMessage.value = '活动价需要低于原价'
    return
  }
  saving.value = true
  try {
    await savePromotionSpecialProduct({
      productId: Number(form.productId),
      productName: form.productName,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      theme: form.theme,
      originalPrice: Number(form.originalPrice),
      promotionPrice: Number(form.promotionPrice),
      stock: Number(form.stock),
      sales: Number(form.sales),
      popularity: Number(form.popularity),
      tag: form.tag,
      status: form.status,
      productImage: 'demo.png',
    })
    await loadProducts()
    actionMessage.value = '特价商品保存成功'
    closeEditor()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '特价商品保存失败'
  } finally {
    saving.value = false
  }
}

async function toggleStatus(productId) {
  try {
    await togglePromotionSpecialProduct(productId)
    await loadProducts()
    actionMessage.value = '特价商品状态已更新'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '状态更新失败'
  }
}

async function deleteProduct(productId) {
  try {
    await deletePromotionSpecialProduct(productId)
    await loadProducts()
    actionMessage.value = '特价商品已删除'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败'
  }
}

onMounted(() => {
  if (!currentUser) {
    router.replace('/login')
    return
  }
  loadProducts()
})
</script>

<template>
  <main class="category-shell">
    <section class="category-frame">
      <header class="category-topbar">
        <div class="category-heading">
          <button class="category-back" type="button" @click="router.push('/category')" aria-label="返回活动页">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
            </svg>
          </button>
          <div>
            <p class="category-heading__eyebrow">Promotion Admin</p>
            <h1>特价商品管理</h1>
            <p class="category-heading__desc">在这里维护活动价、标签和上下架状态，活动页会自动同步显示。</p>
          </div>
        </div>
        <button class="profile-add-button" type="button" @click="openCreate">新增特价商品</button>
      </header>

      <section v-if="errorMessage" class="category-status category-status--error">
        {{ errorMessage }}
      </section>

      <section class="category-product-grid">
        <article v-for="product in products" :key="product.productId" class="category-product-card">
          <div class="category-product-card__visual" :class="`theme-${product.theme}`">
            <div class="plate">
              <div class="plate-item"></div>
              <div class="plate-item"></div>
              <div class="plate-item"></div>
            </div>
          </div>
          <div class="category-product-card__content">
            <div class="category-product-card__top">
              <div>
                <span class="category-product-card__subcategory">{{ product.subcategory }}</span>
                <h4>{{ product.productName }}</h4>
                <p>{{ product.description }}</p>
              </div>
              <span class="category-product-card__stock">{{ product.status }}</span>
            </div>
            <div class="activity-price-row">
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <strong>{{ Number(product.promotionPrice).toFixed(2) }}</strong>
              </div>
              <div class="activity-origin-price">原价 ¥{{ Number(product.originalPrice).toFixed(2) }}</div>
            </div>
            <div class="category-product-card__meta">
              <button class="profile-inline-button" type="button" @click="openEdit(product)">编辑</button>
              <button class="profile-inline-button" type="button" @click="toggleStatus(product.productId)">
                {{ product.status === 'ACTIVE' ? '下架' : '上架' }}
              </button>
              <button class="profile-inline-button profile-inline-button--danger" type="button" @click="deleteProduct(product.productId)">删除</button>
            </div>
          </div>
        </article>
      </section>

      <section v-if="actionMessage" class="status-tip status-tip--success home-action-tip">
        {{ actionMessage }}
      </section>
    </section>

    <div v-if="editorVisible" class="payment-mask">
      <section class="payment-modal profile-address-modal">
        <button class="payment-close" type="button" aria-label="关闭编辑器" @click="closeEditor">×</button>
        <h2>{{ form.productId ? '编辑特价商品' : '新增特价商品' }}</h2>
        <div class="profile-form-grid">
          <label class="profile-form-field"><span>商品ID</span><input v-model="form.productId" type="number" /></label>
          <label class="profile-form-field"><span>商品名</span><input v-model="form.productName" type="text" /></label>
          <label class="profile-form-field profile-form-field--full"><span>描述</span><textarea v-model="form.description" rows="3"></textarea></label>
          <label class="profile-form-field"><span>大类</span><input v-model="form.category" type="text" /></label>
          <label class="profile-form-field"><span>小类</span><input v-model="form.subcategory" type="text" /></label>
          <label class="profile-form-field"><span>主题</span><input v-model="form.theme" type="text" /></label>
          <label class="profile-form-field"><span>原价</span><input v-model="form.originalPrice" type="number" step="0.01" /></label>
          <label class="profile-form-field"><span>活动价</span><input v-model="form.promotionPrice" type="number" step="0.01" /></label>
          <label class="profile-form-field"><span>库存</span><input v-model="form.stock" type="number" /></label>
          <label class="profile-form-field"><span>销量</span><input v-model="form.sales" type="number" /></label>
          <label class="profile-form-field"><span>热度</span><input v-model="form.popularity" type="number" /></label>
          <label class="profile-form-field"><span>标签</span><input v-model="form.tag" type="text" /></label>
        </div>
        <button class="payment-confirm" type="button" :disabled="saving" @click="saveProduct">{{ saving ? '保存中...' : '保存特价商品' }}</button>
      </section>
    </div>
  </main>
</template>
