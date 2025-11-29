<template>
  <div class="model-metrics">
    <el-card shadow="hover" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span><el-icon><InfoFilled /></el-icon> 模型评估指标</span>
        </div>
      </template>
      <el-descriptions :column="2" border v-if="metrics && metrics.rmse !== null && metrics.rmse !== undefined">
        <el-descriptions-item label="RMSE (均方根误差)">
          <span style="color: #409EFF; font-weight: 600">{{ metrics.rmse?.toFixed(4) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="MAE (平均绝对误差)">
          <span style="color: #409EFF; font-weight: 600">{{ metrics.mae?.toFixed(4) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="R² (决定系数)" :span="2">
          <span style="color: #67C23A; font-weight: 600">{{ metrics.r2?.toFixed(4) }}</span>
          <el-progress :percentage="(metrics.r2 * 100).toFixed(1)" :color="getR2Color(metrics.r2)" style="margin-top: 10px" />
        </el-descriptions-item>
        <el-descriptions-item label="测试集样本数">
          {{ metrics.testCount }}
        </el-descriptions-item>
        <el-descriptions-item label="评估时间">
          {{ formatTime(metrics.runTime) }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无模型指标数据，请先运行价格预测任务生成模型指标" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { modelApi } from '@/api/model'
import { ElMessage } from 'element-plus'

const metrics = ref(null)
const loading = ref(false)

const loadMetrics = async () => {
  loading.value = true
  try {
    const data = await modelApi.getModelMetrics()
    // 后端返回的是单个对象，不是数组
    if (data && data.rmse !== null && data.rmse !== undefined) {
      metrics.value = data
    } else {
      metrics.value = null
      ElMessage.warning('数据库中暂无模型指标数据，请先运行价格预测任务')
    }
  } catch (error) {
    console.error('加载模型指标失败:', error)
    ElMessage.error('加载模型指标失败: ' + (error.message || '未知错误'))
    metrics.value = null
  } finally {
    loading.value = false
  }
}

const getR2Color = (r2) => {
  if (r2 >= 0.9) return '#67C23A'
  if (r2 >= 0.7) return '#E6A23C'
  return '#F56C6C'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadMetrics()
})
</script>

<style scoped>
.model-metrics {
  padding: 0;
}

.card-header {
  font-weight: 600;
}
</style>

