import { createRouter, createWebHistory } from 'vue-router'

import Grid1View from '@/views/Grid1View.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Grid1View
    }
  ],
})

export default router
