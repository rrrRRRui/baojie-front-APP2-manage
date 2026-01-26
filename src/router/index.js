import { createRouter, createWebHistory } from 'vue-router'
import HomeView  from '@/pages/home/HomeView.vue'
import LoginView from '@/pages/login/LoginView.vue'

// 导入 APP 端新开发的组件（请确保文件路径正确）
// 建议按照以下路径结构存放文件
const routes = [
  { 
    path: '/login', 
    name: 'login', 
    component: LoginView 
  },
  { 
    path: '/home',  
    name: 'home',  
    component: HomeView, 
    meta: { requiresAuth: true } 
  },
  // APP 端：工单管理模块
  {
    path: '/app/orders',
    name: 'appOrders',
    component: () => import('@/pages/app/WorkOrderView.vue'), // 需要你手动创建该目录和文件
    meta: { requiresAuth: true }
  },
  // APP 端：个人数据与统计模块
  {
    path: '/app/profile',
    name: 'appProfile',
    component: () => import('@/pages/app/ProfileView.vue'), // 需要你手动创建该目录和文件
    meta: { requiresAuth: true }
  },
  // 默认重定向
  { 
    path: '/', 
    redirect: '/home' 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局身份守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  if (to.meta.requiresAuth && !isAuthenticated) {
    // 未登录跳转至登录页，并记录原始路径以便登录后跳回
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && isAuthenticated) {
    // 已登录状态访问登录页，直接跳转回主页
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router