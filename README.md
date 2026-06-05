# ShiWei Frontend

基于 **Vue 3 + Vite** 构建的商城前端项目，对接 `ShiWei_be` 后端，覆盖商品浏览、商品详情、购物车、下单结算、订单查询、个人中心、优惠活动与秒杀体验等核心流程。

## 技术栈

- Vue 3
- Vue Router 4
- Pinia
- Vite
- 原生 Fetch API

## 页面能力

### 1. 首页与分类页

- 展示首页主视觉和活动商品
- 支持按大类 / 子类切换商品
- 支持排序切换
- 首页商品支持“加载更多”

### 2. 商品详情

- 查看商品详情
- 支持加入购物车
- 支持秒杀活动商品抢购入口

### 3. 购物车与结算

- 购物车商品增删改查
- 勾选商品后进入结算页
- 提交订单后跳转订单列表

### 4. 订单模块

- 订单列表分页加载
- 订单详情查看
- 与后端订单状态流转联动

### 5. 个人中心

- 用户基础信息展示
- 地址管理
- 优惠券查看
- 最近订单展示

### 6. 活动与秒杀

- 秒杀活动列表与详情展示
- 秒杀提交请求
- 秒杀结果查询

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

## 当前实现重点

当前版本重点放在以下几个方面：

- 首页商品分页加载
- 订单分页加载
- 与后端订单流转链路打通
- 秒杀活动与订单主流程衔接
- 购物车、结算、订单查询的完整闭环
- 路由懒加载
- Pinia 登录态管理
- API 模块化拆分
- 路由守卫与 404 页面
- 全局 Loading / 错误提示
- GET 请求有限重试与重复请求取消

## 前端工程化能力

### 1. 路由懒加载

页面采用按需加载方式，降低首屏包体积：

- 首页
- 登录 / 注册
- 分类页
- 商品详情
- 购物车 / 结算
- 订单列表 / 订单详情
- 个人中心

### 2. 状态管理

已使用 `Pinia` 收口登录态：

- `stores/auth.js`
- `stores/ui.js`

### 3. API 层治理

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

并统一通过 `api/http.js` 处理：

- 401 失效清理
- 全局错误提示
- 全局 Loading
- GET 请求有限重试
- 重复请求取消

### 4. 页面结构拆分

首页已拆分为多个职责明确的组件：

- `HomeTopBar`
- `HomeCategoryTabs`
- `HomeHero`
- `HomeProductGrid`
- `HomeBottomNav`

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

## 本地配置说明

接口地址默认写在：

- `src/api/http.js`

默认后端地址：

```text
http://127.0.0.1:8102
```

如后端地址变化，可通过环境变量覆盖：

```text
VITE_API_BASE_URL=http://127.0.0.1:8102
```

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

## 项目特点

这个前端项目围绕完整商城交易流程组织页面状态与接口调用，重点体现在：

- 商品浏览到下单的完整闭环
- 订单分页与详情联动
- 秒杀活动和普通订单流程并存
- 与后端订单状态流转、缓存、分页、限流等能力协同
