<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <h1 class="title">亚马逊商品分析与决策系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown trigger="click">
          <div class="user-box">
            <el-icon><UserFilled /></el-icon>
            <span class="user-name">{{ username || '未登录' }}</span>
            <el-icon class="caret"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>当前角色：{{ role }}</el-dropdown-item>
              <el-dropdown-item divided @click="logout">
                <el-icon><SwitchButton /></el-icon>
                <span style="margin-left: 6px">退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 左侧菜单 -->
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          :router="true"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>数据看板</span>
          </el-menu-item>

          <el-sub-menu index="analysis">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>商品分析</span>
            </template>
            <el-menu-item index="/rating-analysis">
              <el-icon><StarFilled /></el-icon>
              <span>评分分析</span>
            </el-menu-item>
            <el-menu-item index="/sales-analysis">
              <el-icon><Histogram /></el-icon>
              <span>销量分析</span>
            </el-menu-item>
            <el-menu-item index="/marketing-analysis">
              <el-icon><Discount /></el-icon>
              <span>营销分析</span>
            </el-menu-item>
            <el-menu-item index="/category-insights">
              <el-icon><Histogram /></el-icon>
              <span>品类洞察</span>
            </el-menu-item>
            <el-menu-item index="/benchmark">
              <el-icon><Search /></el-icon>
              <span>竞品对标</span>
            </el-menu-item>
            <el-menu-item index="/opportunity-monitor">
              <el-icon><InfoFilled /></el-icon>
              <span>异常/机会</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="price">
            <template #title>
              <el-icon><Money /></el-icon>
              <span>商品决策</span>
            </template>
            <el-menu-item index="/decision-center">
              <el-icon><DataAnalysis /></el-icon>
              <span>商品决策</span>
            </el-menu-item>
            <el-menu-item index="/price-diagnosis">
              <el-icon><Search /></el-icon>
              <span>价格诊断</span>
            </el-menu-item>
            <el-menu-item index="/price-recommendations">
              <el-icon><Document /></el-icon>
              <span>价格推荐</span>
            </el-menu-item>
            <el-menu-item index="/decision-records">
              <el-icon><Document /></el-icon>
              <span>预测记录</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="model">
            <template #title>
              <el-icon><DataLine /></el-icon>
              <span>模型管理</span>
            </template>
            <el-menu-item index="/model-metrics">
              <el-icon><InfoFilled /></el-icon>
              <span>模型指标</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="admin" v-if="role === 'ADMIN'">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/user-manage">
              <el-icon><InfoFilled /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  HomeFilled, Monitor, Money, Search, Document, Setting, InfoFilled, TrendCharts, StarFilled, Histogram, Discount, UserFilled, ArrowDown, SwitchButton, DataLine, DataAnalysis
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const role = computed(() => userStore.role)
const username = computed(() => userStore.username)

// 使用 computed 来动态计算激活的菜单项
const activeMenu = computed(() => {
  return route.path
})

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
}

.header-left .title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.16);
  padding: 6px 12px;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-name {
  font-weight: 600;
}

.caret {
  font-size: 12px;
  opacity: 0.8;
}

.user-box:hover {
  background: rgba(255, 255, 255, 0.24);
}

.aside {
  background-color: #304156;
}

.menu {
  border-right: none;
  height: 100%;
}
.user-chip {
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
}
</style>

