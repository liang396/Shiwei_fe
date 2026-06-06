# ShiWei Frontend

基于 **Vue 3 + Vite** 构建的商城前端项目，对接 `ShiWei_be` 后端，覆盖商品浏览、详情、购物车、下单结算、订单查询、个人中心、优惠活动与秒杀体验等核心流程。

## 项目速览

- 技术栈：Vue 3、Vue Router、Pinia、Vite、原生 Fetch
- 页面能力：首页活动流、商品分页、订单分页、购物车与结算、个人中心、秒杀体验
- 工程化能力：路由懒加载、Pinia 登录态、API 模块化拆分、全局 Loading / Error、401 统一处理
- 稳定性优化：GET 请求有限重试、重复请求取消、路由守卫、404 页面
- 前后端联动：商品分页、订单分页、订单流转、模拟支付、个人中心聚合接口

---

## 项目定位

这个前端项目不是单纯的页面堆叠，而是围绕完整商城交易流程组织页面状态与接口调用：

- 商品浏览到下单的完整闭环
- 秒杀活动与普通订单流程并存
- 分页、状态、错误提示与后端能力协同

---

## 技术栈

- Vue 3
- Vue Router 4
- Pinia
- Vite
- 原生 Fetch API

---

## 页面能力

### 首页与分类页

- 首页主视觉和活动商品展示
- 大类 / 子类切换
- 排序切换
- 商品分页加载

### 商品详情

- 商品详情展示
- 加入购物车
- 秒杀商品抢购入口

### 购物车与结算

- 购物车增删改查
- 结算页提交订单
- 模拟支付跳转

### 订单模块

- 订单列表分页
- 订单详情查看
- 与后端订单状态流转联动

### 个人中心

- 用户基础资料
- 地址管理
- 优惠券查看
- 最近订单展示

### 秒杀活动

- 秒杀活动列表 / 详情
- 秒杀提交
- 秒杀结果查询

---

## 当前工程化能力

### 1. 路由懒加载

页面采用按需加载，减少首屏包体积：

- 首页
- 登录 / 注册
- 分类页
- 商品详情
- 购物车 / 结算
- 订单列表 / 订单详情
- 个人中心
- 404 页面

### 2. 路由守卫

前端已具备：

- 登录保护页
- 未登录跳转登录页并记录回跳地址
- 已登录访问登录/注册页自动跳回首页
- 404 路由兜底

### 3. 状态管理

已使用 `Pinia` 收口：

- 登录态：`stores/auth.js`
- 全局 UI 状态：`stores/ui.js`

### 4. API 层治理

API 已从单文件拆分为模块化结构：

- `api/auth.js`
- `api/product.js`
- `api/order.js`
- `api/cart.js`
- `api/profile.js`
- `api/promotion.js`
- `api/seckill.js`
- `api/address.js`
- `api/payment.js`
- `api/storage.js`

统一请求层 `api/http.js` 负责：

- 401 登录失效处理
- 全局 Loading
- 全局错误提示
- GET 请求有限重试
- 重复请求取消
- 请求超时处理

### 5. 页面结构拆分

首页已拆分为多个职责清晰的组件：

- `HomeTopBar`
- `HomeCategoryTabs`
- `HomeHero`
- `HomeProductGrid`
- `HomeBottomNav`

---

## 与后端联动点

前端主要对接以下后端能力：

- 商品分页：`/product/page`
- 商品详情：`/product/{productId}`
- 订单提交：`/order/submit`
- 订单分页：`/order/page`
- 订单详情：`/order/{orderId}`
- 模拟支付：`/pay/mock/create`
- 个人资料：`/profile/overview`
- 地址管理：`/address/*`
- 优惠券：`/promotion/*`
- 秒杀活动：`/seckill/*`

---

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

### 3. 生产构建

```bash
npm run build
```

---

## 本地配置说明

接口地址默认写在：

- `src/api/http.js`

默认后端地址：

```text
http://127.0.0.1:8102
```

如果后端地址变化，可通过环境变量覆盖：

```text
VITE_API_BASE_URL=http://127.0.0.1:8102
```

---

## 主要路由

- `/` 首页
- `/login` 登录
- `/register` 注册
- `/category` 分类活动页
- `/product/:productId` 商品详情
- `/cart` 购物车
- `/checkout` 结算页
- `/orders` 订单列表
- `/orders/:orderId` 订单详情
- `/profile` 个人中心
- `/:pathMatch(.*)*` 404 页面

---

## 当前实现重点

当前版本重点放在以下几个方面：

- 首页商品分页加载
- 订单分页加载
- 与后端订单流转链路打通
- 秒杀活动与订单主流程衔接
- 购物车、结算、订单查询的完整闭环
- 路由守卫和请求治理层
- API 模块化拆分与首页组件拆分
