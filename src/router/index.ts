import { createRouter, createWebHistory } from 'vue-router'

import GameView from '@/views/GameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'level', params: { section: 'tutorial', levelId: 'test' } }
    },
    {
      path: '/level/:section/:levelId',
      name: 'level',
      component: GameView,
      props: true
    }
  ],
})

export default router
