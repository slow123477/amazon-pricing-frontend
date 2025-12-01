<template>
  <div class="home">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><HomeFilled /></el-icon> 系统概览</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="商品总数" :value="38741">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em"><Box /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="分类数量" :value="11">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em"><Menu /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均价格" :value="494.96" :precision="2">
            <template #prefix>$</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="模型准确率" :value="98.4" :precision="1">
            <template #suffix>%</template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span><el-icon><DataAnalysis /></el-icon> 快速入口</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/price-diagnosis')">
            <el-icon class="quick-icon" color="#409EFF"><Search /></el-icon>
            <div class="quick-title">价格诊断</div>
            <div class="quick-desc">实时价格分析与建议</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/dashboard')">
            <el-icon class="quick-icon" color="#67C23A"><PieChart /></el-icon>
            <div class="quick-title">可视化大屏</div>
            <div class="quick-desc">查看完整数据分析图表</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/price-recommendations')">
            <el-icon class="quick-icon" color="#E6A23C"><Document /></el-icon>
            <div class="quick-title">价格推荐</div>
            <div class="quick-desc">查看智能推荐列表</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/model-metrics')">
            <el-icon class="quick-icon" color="#F56C6C"><InfoFilled /></el-icon>
            <div class="quick-title">模型指标</div>
            <div class="quick-desc">查看模型评估指标</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { 
  HomeFilled, Box, Menu, DataAnalysis, Search, 
  PieChart, Document, InfoFilled 
} from '@element-plus/icons-vue'
</script>

<style scoped>
.home {
  padding: 0;
}

.card-header {
  font-weight: 600;
}

.quick-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.quick-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.quick-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #303133;
}

.quick-desc {
  font-size: 12px;
  color: #909399;
}
</style>

