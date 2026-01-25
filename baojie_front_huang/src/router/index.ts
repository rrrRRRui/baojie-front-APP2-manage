import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import PhotoUpload from '@/views/PhotoUpload.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/upload',
      name: 'upload',
      component: PhotoUpload
    }
  ]
})

export default router