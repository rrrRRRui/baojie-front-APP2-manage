

const routes = [



  // ========== 新增管理后台路由 ==========
  {
    path: '/admin/scores',
    name: 'scoreManagement',
    component: () => import('@/pages/admin/ScoreManagement.vue'),
    meta: { requiresAuth: true, title: 'AI评分管理' }
  },
  // ========== 新增路由结束 ==========


  {
    path: '/admin/ai-scoring',
    name: 'AIScoringPage',
    component: () => import('@/pages/admin/AIScoringPage.vue'),
    meta: { requiresAuth: true, title: 'AI智能评分' }
  }





]

