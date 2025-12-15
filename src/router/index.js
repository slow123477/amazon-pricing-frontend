import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import PriceDiagnosis from '../views/PriceDiagnosis.vue'
import PriceRecommendations from '../views/PriceRecommendations.vue'
import ModelMetrics from '../views/ModelMetrics.vue'
import RatingAnalysis from '../views/RatingAnalysis.vue'
import SalesAnalysis from '../views/SalesAnalysis.vue'
import MarketingAnalysis from '../views/MarketingAnalysis.vue'
import CategoryInsights from '../views/CategoryInsights.vue'
import Benchmark from '../views/Benchmark.vue'
import OpportunityMonitor from '../views/OpportunityMonitor.vue'
import DecisionCenter from '../views/DecisionCenter.vue'
import Login from '../views/Login.vue'
import UserManage from '../views/UserManage.vue'

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
    path: '/login',
    name: 'Login',
    component: Login
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
  },
  {
    path: '/rating-analysis',
    name: 'RatingAnalysis',
    component: RatingAnalysis
  },
  {
    path: '/category-insights',
    name: 'CategoryInsights',
    component: CategoryInsights
  },
  {
    path: '/benchmark',
    name: 'Benchmark',
    component: Benchmark
  },
  {
    path: '/opportunity-monitor',
    name: 'OpportunityMonitor',
    component: OpportunityMonitor
  },
  {
    path: '/sales-analysis',
    name: 'SalesAnalysis',
    component: SalesAnalysis
  },
  {
    path: '/marketing-analysis',
    name: 'MarketingAnalysis',
    component: MarketingAnalysis
  },
  {
    path: '/user-manage',
    name: 'UserManage',
    component: UserManage
  },
  {
    path: '/decision-center',
    name: 'DecisionCenter',
    component: DecisionCenter
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 简单路由守卫：无 token 跳转登录
router.beforeEach((to, from, next) => {
  if (to.path === '/login') return next()
  const token = localStorage.getItem('token')
  if (!token) return next('/login')
  next()
})

export default router

