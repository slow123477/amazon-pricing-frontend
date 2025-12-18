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
          <el-statistic title="商品总数" :value="systemStats.productCount">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em"><Box /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="分类数量" :value="systemStats.categoryCount">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em"><Menu /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均价格" :value="systemStats.avgPrice" :precision="2">
            <template #prefix>$</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="模型准确率" :value="systemStats.modelAccuracy" :precision="1">
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
          <el-card shadow="hover" class="quick-card" @click="$router.push('/dashboard')">
            <el-icon class="quick-icon" color="#67C23A"><Monitor /></el-icon>
            <div class="quick-title">数据看板</div>
            <div class="quick-desc">查看整体数据可视化大屏</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/rating-analysis')">
            <el-icon class="quick-icon" color="#E6A23C"><TrendCharts /></el-icon>
            <div class="quick-title">商品分析</div>
            <div class="quick-desc">查看评分/销量/营销等综合分析</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/decision-center')">
            <el-icon class="quick-icon" color="#409EFF"><Money /></el-icon>
            <div class="quick-title">决策中心</div>
            <div class="quick-desc">查看定价/库存综合决策</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="quick-card" @click="$router.push('/model-metrics')">
            <el-icon class="quick-icon" color="#F56C6C"><DataLine /></el-icon>
            <div class="quick-title">模型指标</div>
            <div class="quick-desc">查看模型训练与评估结果</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  HomeFilled, Box, Menu, DataAnalysis,
  Monitor, TrendCharts, Money, DataLine
} from '@element-plus/icons-vue'
import { categoryApi } from '@/api/category'
import { modelApi } from '@/api/model'

const systemStats = ref({
  productCount: 0,
  categoryCount: 0,
  avgPrice: 0,
  modelAccuracy: 0
})

const loadSystemStats = async () => {
  try {
    const [categoryRes, modelMetrics] = await Promise.all([
      categoryApi.getCategoryStats(),
      modelApi.getModelMetrics()
    ])

    const categories = categoryRes || []

    let totalProducts = 0
    let sumDiscountedPrice = 0

    categories.forEach(item => {
      const count = item.productCount || 0
      const avgDiscounted = item.avgDiscountedPrice || 0
      totalProducts += count
      sumDiscountedPrice += avgDiscounted * count
    })

    const avgPrice =
      totalProducts > 0 ? sumDiscountedPrice / totalProducts : 0

    systemStats.value.productCount = totalProducts
    systemStats.value.categoryCount = categories.length
    systemStats.value.avgPrice = Number(avgPrice.toFixed(2))

    const r2 = modelMetrics?.r2
    const accuracy = r2 != null ? Number((r2 * 100).toFixed(2)) : 0
    systemStats.value.modelAccuracy = accuracy
  } catch (e) {
    console.error('加载系统概览数据失败', e)
  }
}

onMounted(() => {
  loadSystemStats()
})
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

