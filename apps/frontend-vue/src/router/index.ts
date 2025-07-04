import { createRouter, createWebHistory } from 'vue-router'
import ConnectPage from '@/pages/ConnectPage.vue'
import MainPage from '@/pages/MainPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: MainPage,
    },
    {
      path: '/connect',
      name: 'connect',
      component: ConnectPage,
    },
  ],
})

export default router
