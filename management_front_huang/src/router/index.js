import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      }
    ]
  },
  {
    path: '/tickets',
    component: Layout,
    redirect: '/tickets/list',
    meta: { title: '工单管理', icon: 'Tickets' },
    children: [
      {
        path: 'list',
        name: 'TicketList',
        component: () => import('@/views/tickets/list.vue'),
        meta: { title: '工单列表', icon: 'List' }
      },
      {
        path: 'detail/:id',
        name: 'TicketDetail',
        component: () => import('@/views/tickets/detail.vue'),
        meta: { title: '工单详情', hidden: true }
      }
    ]
  },
  {
    path: '/reports',
    component: Layout,
    redirect: '/reports/statistics',
    meta: { title: '统计报表', icon: 'DataAnalysis' },
    children: [
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/reports/statistics.vue'),
        meta: { title: '数据统计', icon: 'TrendCharts' }
      },
      {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('@/views/reports/ranking.vue'),
        meta: { title: '排行统计', icon: 'Trophy' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router