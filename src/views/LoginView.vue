<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { loginByPassword, loginBySms, saveAuthSession, sendMobileCode } from '../api'

const router = useRouter()
const activeTab = ref('password')
const phone = ref('')
const password = ref('')
const smsCode = ref('')
const countdown = ref(0)
const statusText = ref('')
const statusType = ref('info')
const submitting = ref(false)

let timerId = null

const submitLabel = computed(() =>
  activeTab.value === 'password' ? '登录' : '验证码登录',
)

const countdownText = computed(() =>
  countdown.value > 0 ? `${countdown.value}s 后可重新获取` : '验证码有效期 5 分钟',
)

const isCodeDisabled = computed(() => countdown.value > 0)

function setStatus(message, type = 'info') {
  statusText.value = message
  statusType.value = type
}

function startCountdown() {
  countdown.value = 60
  clearInterval(timerId)
  timerId = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      clearInterval(timerId)
      return
    }
    countdown.value -= 1
  }, 1000)
}

function normalizePhone(value) {
  return value.trim()
}

async function handleSendCode() {
  const mobile = normalizePhone(phone.value)

  if (!mobile) {
    setStatus('请先输入手机号', 'error')
    return
  }

  try {
    await sendMobileCode(mobile)
    setStatus('验证码已发送，请留意短信', 'success')
    startCountdown()
  } catch (error) {
    setStatus(error.message || '验证码发送失败', 'error')
  }
}

async function handleSubmit() {
  const mobile = normalizePhone(phone.value)

  if (!mobile) {
    setStatus('请输入手机号', 'error')
    return
  }

  submitting.value = true

  try {
    let result

    if (activeTab.value === 'password') {
      if (!password.value.trim()) {
        throw new Error('请输入密码')
      }

      result = await loginByPassword({
        userAccount: mobile,
        password: password.value,
      })
    } else {
      if (!smsCode.value.trim()) {
        throw new Error('请输入验证码')
      }

      result = await loginBySms({
        verifyKey: mobile,
        verifyCode: smsCode.value,
      })
    }

    saveAuthSession(result.data)
    setStatus('登录成功，正在进入首页', 'success')

    window.setTimeout(() => {
      router.push('/')
    }, 400)
  } catch (error) {
    setStatus(error.message || '登录失败，请稍后再试', 'error')
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  clearInterval(timerId)
})
</script>

<template>
  <main class="auth-shell">
    <section class="auth-panel">
      <div class="fruit fruit-peach" aria-hidden="true">
        <span class="leaf leaf-left"></span>
        <span class="leaf leaf-right"></span>
      </div>

      <div class="fruit fruit-orange" aria-hidden="true">
        <span class="leaf leaf-left"></span>
        <span class="leaf leaf-right"></span>
        <span class="leaf leaf-center"></span>
      </div>

      <header class="auth-header">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'password' }"
          type="button"
          @click="activeTab = 'password'"
        >
          账号密码登录
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'sms' }"
          type="button"
          @click="activeTab = 'sms'"
        >
          手机号验证码登录
        </button>
      </header>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="field-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12c2.761 0 5-2.463 5-5.5S14.761 1 12 1 7 3.463 7 6.5 9.239 12 12 12Zm0 2c-4.418 0-8 2.91-8 6.5 0 .829.672 1.5 1.5 1.5h13c.828 0 1.5-.671 1.5-1.5 0-3.59-3.582-6.5-8-6.5Z"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.6"
              />
            </svg>
          </span>
          <input
            v-model="phone"
            type="text"
            inputmode="numeric"
            placeholder="输入手机号"
          />
        </label>

        <label v-if="activeTab === 'password'" class="field">
          <span class="field-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 10V7.75C7 4.574 9.239 2 12 2s5 2.574 5 5.75V10"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.6"
              />
              <rect
                x="5"
                y="10"
                width="14"
                height="12"
                rx="3"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path
                d="M12 14.5v3"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.6"
              />
            </svg>
          </span>
          <input
            v-model="password"
            type="password"
            placeholder="输入密码"
          />
        </label>

        <label v-else class="field code-field">
          <span class="field-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 10V7.75C7 4.574 9.239 2 12 2s5 2.574 5 5.75V10"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.6"
              />
              <rect
                x="5"
                y="10"
                width="14"
                height="12"
                rx="3"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path
                d="M12 14v.5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.6"
              />
              <path
                d="M12 16.5v1.5"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.6"
              />
            </svg>
          </span>
          <input
            v-model="smsCode"
            type="text"
            inputmode="numeric"
            placeholder="输入验证码"
          />
          <button
            class="code-button"
            type="button"
            :disabled="isCodeDisabled"
            @click="handleSendCode"
          >
            {{ isCodeDisabled ? `${countdown}s` : '获取验证码' }}
          </button>
        </label>

        <p v-if="activeTab === 'sms'" class="countdown-tip">
          {{ countdownText }}
        </p>

        <p v-if="statusText" class="status-tip" :class="`status-tip--${statusType}`">
          {{ statusText }}
        </p>

        <button class="submit-button" type="submit" :disabled="submitting">
          {{ submitting ? '提交中...' : submitLabel }}
        </button>
      </form>

      <p class="switch-tip">
        还没有账号？
        <RouterLink to="/register">前往注册</RouterLink>
      </p>
    </section>
  </main>
</template>
