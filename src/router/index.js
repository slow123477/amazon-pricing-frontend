import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import PriceDiagnosis from '../views/PriceDiagnosis.vue'
import PriceRecommendations from '../views/PriceRecommendations.vue'
import ModelMetrics from '../views/ModelMetrics.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/price-diagnosis',
    name: 'PriceDiagnosis',
    component: PriceDiagnosis
  },
  {
    path: '/price-recommendations',
    name: 'PriceRecommendations',
    component: PriceRecommendations
  },
  {
    path: '/model-metrics',
    name: 'ModelMetrics',
    component: ModelMetrics
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

