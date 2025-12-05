<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <h1 class="title">亚马逊商品价格分析与优化决策系统</h1>
      </div>
      <div class="header-right">
        <el-button text type="primary">修改密码</el-button>
        <el-button text type="danger">退出登录</el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 左侧菜单 -->
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          router
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
            <span>可视化大屏</span>
          </el-menu-item>

          <el-sub-menu index="price">
            <template #title>
              <el-icon><Money /></el-icon>
              <span>价格管理</span>
            </template>
            <el-menu-item index="/price-diagnosis">
              <el-icon><Search /></el-icon>
              <span>价格诊断</span>
            </el-menu-item>
            <el-menu-item index="/price-recommendations">
              <el-icon><Document /></el-icon>
              <span>价格推荐</span>
            </el-menu-item>
          </el-sub-menu>

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
          </el-sub-menu>

          <el-sub-menu index="model">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>模型管理</span>
            </template>
            <el-menu-item index="/model-metrics">
              <el-icon><InfoFilled /></el-icon>
              <span>模型指标</span>
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  HomeFilled, Monitor, Money, Search, Document, Setting, InfoFilled, TrendCharts, StarFilled, Histogram, Discount
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = ref(route.path)

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
}, { immediate: true })
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
  gap: 10px;
}

.aside {
  background-color: #304156;
}

.menu {
  border-right: none;
  height: 100%;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
}
</style>

