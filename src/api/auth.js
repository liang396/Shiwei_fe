import { request, toFormBody } from './http'

export function sendMobileCode(mobile) {
  return request('/front/sys/captcha/mobile', {
    method: 'POST',
    body: toFormBody({ phone: mobile }),
  })
}

export function registerByMobile(payload) {
  return request('/front/account/login/register', {
    method: 'POST',
    body: toFormBody(payload),
  })
}

export function loginByPassword(payload) {
  return request('/front/account/login/login', {
    method: 'POST',
    body: toFormBody(payload),
  })
}

export function loginBySms(payload) {
  return request('/front/account/login/doSmsLogin', {
    method: 'POST',
    body: toFormBody(payload),
  })
}
