// src/router/appRoutes.js
const appRoutes = [
  {
    path: '/app/scores/:id',
    name: 'aiScoreResult',
    component: () => import('@/pages/app/AIScoreResult.vue'),
    meta: { title: 'AI评分结果' }
  },
  {
    path: '/app/rescan/:id',
    name: 'rescanProcess',
    component: () => import('@/pages/app/RescanProcess.vue'),
    meta: { title: '复扫处理' }
  }
]