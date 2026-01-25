import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '仪表盘', icon: 'DataBoard' }
        },
        {
          path: 'work-orders',
          name: 'WorkOrders',
          component: () => import('@/views/WorkOrders.vue'),
          meta: { title: '工单管理', icon: 'Document' }
        },
        {
          path: 'work-orders/:id',
          name: 'WorkOrderDetail',
          component: () => import('@/views/WorkOrderDetail.vue'),
          meta: { title: '工单详情', hidden: true }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/Reports.vue'),
          meta: { title: '统计报表', icon: 'DataAnalysis' }
        }
      ]
    }
  ]
})

export default router