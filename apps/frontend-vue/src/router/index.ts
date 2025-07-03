import { createRouter, createWebHistory } from 'vue-router'
import InitPage from '@/pages/InitPage.vue'
import SecondPage from '@/pages/SecondPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: InitPage,
    },
    {
      path: '/second',
      name: 'second',
      component: SecondPage,
    },
  ],
})

export default router
