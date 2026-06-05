<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { registerByMobile, saveAuthSession, sendMobileCode } from '../api'

const router = useRouter()
const form = ref({
  userAccount: '',
  verifyKey: '',
  verifyCode: '',
})

const countdown = ref(0)
const statusText = ref('')
const statusType = ref('info')
const submitting = ref(false)

let timerId = null

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

function validateForm() {
  if (!form.value.verifyKey.trim()) {
    throw new Error('请输入手机号')
  }

  if (!form.value.verifyCode.trim()) {
    throw new Error('请输入验证码')
  }
}

async function handleSendCode() {
  if (!form.value.verifyKey.trim()) {
    setStatus('请先输入手机号', 'error')
    return
  }

  try {
    await sendMobileCode(form.value.verifyKey.trim())
    setStatus('验证码已发送，请留意短信', 'success')
    startCountdown()
  } catch (error) {
    setStatus(error.message || '验证码发送失败', 'error')
  }
}

async function handleSubmit() {
  try {
    validateForm()
    submitting.value = true

    const result = await registerByMobile({
      userAccount: form.value.userAccount.trim() || form.value.verifyKey.trim(),
      password: '123456',
      verifyKey: form.value.verifyKey.trim(),
      verifyCode: form.value.verifyCode.trim(),
      bindType: 3,
    })

    saveAuthSession(result.data)
    setStatus('注册成功，默认密码为 123456，正在进入首页', 'success')

    window.setTimeout(() => {
      router.push('/')
    }, 800)
  } catch (error) {
    setStatus(error.message || '注册失败，请稍后再试', 'error')
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
    <section class="auth-panel auth-panel--register">
      <div class="fruit fruit-peach" aria-hidden="true">
        <span class="leaf leaf-left"></span>
        <span class="leaf leaf-right"></span>
      </div>

      <div class="fruit fruit-orange" aria-hidden="true">
        <span class="leaf leaf-left"></span>
        <span class="leaf leaf-right"></span>
        <span class="leaf leaf-center"></span>
      </div>

      <header class="single-header">
        <p class="page-badge">SIGN UP</p>
        <h1>手机号验证码注册</h1>
        <p class="page-desc">验证通过后将自动注册并登录，系统默认密码为 123456。</p>
      </header>

      <form class="auth-form auth-form--register" @submit.prevent="handleSubmit">
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
            v-model="form.verifyKey"
            type="text"
            inputmode="numeric"
            placeholder="输入手机号"
          />
        </label>

        <label class="field code-field">
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
            v-model="form.verifyCode"
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

        <label class="field">
          <span class="field-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="3"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path
                d="M8 10V7.5C8 4.462 9.79 2 12 2s4 2.462 4 5.5V10"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.6"
              />
            </svg>
          </span>
          <input value="123456" type="text" readonly />
        </label>

        <label class="field">
          <span class="field-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 5h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.6" />
              <path d="M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.6" />
              <path d="M5 19h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.6" />
            </svg>
          </span>
          <input
            v-model="form.userAccount"
            type="text"
            placeholder="设置账号，不填则默认使用手机号"
          />
        </label>

        <p class="countdown-tip">
          {{ countdown > 0 ? `${countdown}s 后可重新获取验证码` : '验证码有效期 5 分钟，注册后自动登录' }}
        </p>

        <p v-if="statusText" class="status-tip" :class="`status-tip--${statusType}`">
          {{ statusText }}
        </p>

        <button class="submit-button" type="submit" :disabled="submitting">
          {{ submitting ? '注册中...' : '立即注册' }}
        </button>
      </form>

      <p class="switch-tip">
        已有账号？
        <RouterLink to="/login">返回登录</RouterLink>
      </p>
    </section>
  </main>
</template>
