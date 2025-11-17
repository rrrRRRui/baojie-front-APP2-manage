// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView  from '@/pages/home/HomeView.vue'
import LoginView from '@/pages/login/LoginView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/home',  name: 'home',  component: HomeView, meta: { requiresAuth: true } },
  // 根路径做“干净跳转”：根据需要也可以直接重定向到 /home 或 /login
  { path: '/', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局守卫：每次“实时”读取 token
router.beforeEach((to, from, next) => {
  const authed = !!localStorage.getItem('token')

  if (to.meta.requiresAuth && !authed) {
    // 受保护页但未登录 → 去登录，并带上回跳地址
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authed && to.query.force !== '1') {
    // 已登录访问登录页 → 默认带回主页；如需强制看登录页，用 /login?force=1
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
