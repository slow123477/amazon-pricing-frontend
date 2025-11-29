import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import CategoryStats from '../views/CategoryStats.vue'
import DiscountAnalysis from '../views/DiscountAnalysis.vue'
import RatingAnalysis from '../views/RatingAnalysis.vue'
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
    path: '/category-stats',
    name: 'CategoryStats',
    component: CategoryStats
  },
  {
    path: '/discount-analysis',
    name: 'DiscountAnalysis',
    component: DiscountAnalysis
  },
  {
    path: '/rating-analysis',
    name: 'RatingAnalysis',
    component: RatingAnalysis
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

