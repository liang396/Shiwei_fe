import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from './stores'
import { useAuthStore } from './stores/auth'

const HomeView = () => import('./views/HomeView.vue')
const LoginView = () => import('./views/LoginView.vue')
const RegisterView = () => import('./views/RegisterView.vue')
const CategoryView = () => import('./views/CategoryView.vue')
const ProductDetailView = () => import('./views/ProductDetailView.vue')
const CartView = () => import('./views/CartView.vue')
const CheckoutView = () => import('./views/CheckoutView.vue')
const OrdersView = () => import('./views/OrdersView.vue')
const OrderDetailView = () => import('./views/OrderDetailView.vue')
const ProfileView = () => import('./views/ProfileView.vue')
const NotFoundView = () => import('./views/NotFoundView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/category', name: 'category', component: CategoryView },
    { path: '/product/:productId', name: 'product-detail', component: ProductDetailView },
    { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true } },
    { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { requiresAuth: true } },
    { path: '/orders', name: 'orders', component: OrdersView, meta: { requiresAuth: true } },
    { path: '/orders/:orderId', name: 'order-detail', component: OrderDetailView, meta: { requiresAuth: true } },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia)

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isLoggedIn) {
    next({ name: 'home' })
    return
  }

  next()
})

export default router
