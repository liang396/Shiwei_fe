<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="orders-shell">
    <section class="orders-frame cart-empty">
      <h2>页面不存在</h2>
      <p>你访问的页面可能已被移动，或者链接地址不正确。</p>
      <button class="section-heading__action cart-empty__button" type="button" @click="router.push('/')">返回首页</button>
    </section>
  </main>
</template>
