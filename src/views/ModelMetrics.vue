<template>
  <div class="model-metrics">
    <el-card shadow="hover" class="overview-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span><el-icon><InfoFilled /></el-icon> 模型评估概览</span>
        </div>
      </template>

      <template v-if="overview">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="12" :md="6" v-for="card in overviewCards" :key="card.label">
            <div class="metric-card">
              <div class="metric-label">{{ card.label }}</div>
              <div class="metric-value" :style="{ color: card.color }">{{ card.value }}</div>
              <div class="metric-desc">{{ card.desc }}</div>
            </div>
          </el-col>
        </el-row>
        <el-descriptions :column="3" border style="margin-top: 20px">
          <el-descriptions-item label="评估时间">{{ formatTime(overview.runTime) }}</el-descriptions-item>
          <el-descriptions-item label="测试样本">{{ overview.testCount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="R²(可视化)">
            <el-progress :percentage="getR2Percentage(overview.r2)" :color="getR2Color(overview.r2)" />
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty v-else description="暂无模型指标数据，请先运行价格预测任务" />
    </el-card>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <span><el-icon><TrendCharts /></el-icon> 指标趋势（最近训练）</span>
          </template>
          <div ref="trendChartRef" class="chart" v-if="metricsHistory.length"></div>
          <el-empty v-else description="暂无历史指标" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <span><el-icon><Histogram /></el-icon> 分类精度对比</span>
          </template>
          <div ref="categoryChartRef" class="chart" v-if="categoryMetrics.length"></div>
          <el-empty v-else description="暂无分类指标" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <span><el-icon><DataAnalysis /></el-icon> 误差区间分布</span>
          </template>
          <div ref="errorChartRef" class="chart" v-if="errorDistribution.length"></div>
          <el-empty v-else description="暂无误差统计" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="summary-card" v-if="trainingSummary">
          <template #header>
            <span><el-icon><Setting /></el-icon> 训练配置与运行信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="算法">{{ trainingSummary.algorithm }}</el-descriptions-item>
            <el-descriptions-item label="框架">{{ trainingSummary.framework }}</el-descriptions-item>
            <el-descriptions-item label="数据范围">{{ trainingSummary.trainingDataRange }}</el-descriptions-item>
            <el-descriptions-item label="特征数">{{ trainingSummary.featureCount }} 个</el-descriptions-item>
            <el-descriptions-item label="超参数">{{ trainingSummary.hyperParameters }}</el-descriptions-item>
            <el-descriptions-item label="训练/测试">{{ trainingSummary.trainTestSplit }}</el-descriptions-item>
            <el-descriptions-item label="最新运行">{{ formatTime(trainingSummary.lastRunTime) }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ trainingSummary.notes }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card v-else shadow="never">
          <el-empty description="暂无训练信息" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="table-row">
      <el-col :xs="24" :md="14">
        <el-card shadow="never">
          <template #header>
            <span><el-icon><Warning /></el-icon> 高误差样本 TOP10</span>
          </template>
          <el-table :data="topErrors" height="360" border v-loading="loading">
            <el-table-column prop="productTitle" label="商品名称" min-width="220" show-overflow-tooltip />
            <el-table-column prop="productCategory" label="分类" width="120" />
            <el-table-column label="实际价格" width="120">
              <template #default="{ row }">${{ formatNumber(row.actualPrice) }}</template>
            </el-table-column>
            <el-table-column label="预测价格" width="120">
              <template #default="{ row }">${{ formatNumber(row.predictedPrice) }}</template>
            </el-table-column>
            <el-table-column label="误差" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.priceGap > 0 ? '#F56C6C' : '#67C23A' }">
                  {{ row.priceGap > 0 ? '+' : '' }}${{ formatNumber(row.priceGap) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="10">
        <el-card shadow="never">
          <template #header>
            <span><el-icon><Tickets /></el-icon> 训练版本记录</span>
          </template>
          <el-table :data="versionRows" height="360" border>
            <el-table-column prop="version" label="版本" width="120" />
            <el-table-column prop="runTime" label="评估时间" />
            <el-table-column prop="rmse" label="RMSE" width="100" />
            <el-table-column prop="mae" label="MAE" width="100" />
            <el-table-column prop="r2" label="R²" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { modelApi } from '@/api/model'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { InfoFilled, TrendCharts, Histogram, DataAnalysis, Setting, Warning, Tickets } from '@element-plus/icons-vue'

const overview = ref(null)
const metricsHistory = ref([])
const categoryMetrics = ref([])
const errorDistribution = ref([])
const topErrors = ref([])
const trainingSummary = ref(null)
const loading = ref(false)

const trendChartRef = ref(null)
const categoryChartRef = ref(null)
const errorChartRef = ref(null)
let trendChartInstance = null
let categoryChartInstance = null
let errorChartInstance = null

const overviewCards = computed(() => {
  if (!overview.value) return []
  return [
    {
      label: 'RMSE',
      value: overview.value.rmse?.toFixed(2) || '-',
      color: '#409EFF',
      desc: '越低越好'
    },
    {
      label: 'MAE',
      value: overview.value.mae?.toFixed(2) || '-',
      color: '#409EFF',
      desc: '平均绝对误差'
    },
    {
      label: 'R²',
      value: overview.value.r2?.toFixed(2) || '-',
      color: '#67C23A',
      desc: '拟合优度'
    },
    {
      label: '测试样本',
      value: overview.value.testCount || '-',
      color: '#606266',
      desc: '预测评估样本'
    }
  ]
})

const versionRows = computed(() => {
  return metricsHistory.value.map((item, index) => ({
    version: `v${String(metricsHistory.value.length - index).padStart(2, '0')}`,
    runTime: formatTime(item.runTime),
    rmse: item.rmse?.toFixed(2) || '-',
    mae: item.mae?.toFixed(2) || '-',
    r2: item.r2?.toFixed(2) || '-'
  }))
})

const loadData = async () => {
  loading.value = true
  try {
    const [
      overviewRes,
      historyRes,
      categoryRes,
      errorRes,
      topRes,
      summaryRes
    ] = await Promise.all([
      modelApi.getModelMetrics(),
      modelApi.getMetricsHistory({ limit: 8 }),
      modelApi.getCategoryMetrics({ limit: 8 }),
      modelApi.getErrorDistribution(),
      modelApi.getTopErrorSamples({ limit: 10 }),
      modelApi.getTrainingSummary()
    ])

    overview.value = overviewRes && overviewRes.rmse != null ? overviewRes : null
    metricsHistory.value = historyRes || []
    categoryMetrics.value = categoryRes || []
    errorDistribution.value = errorRes || []
    topErrors.value = topRes || []
    trainingSummary.value = summaryRes || null
  } catch (error) {
    console.error('加载模型指标失败:', error)
    ElMessage.error('加载模型指标失败，请稍后重试')
  } finally {
    loading.value = false
    await nextTick()
    renderAllCharts()
  }
}

const renderAllCharts = () => {
  renderTrendChart()
  renderCategoryChart()
  renderErrorChart()
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return
  if (trendChartInstance) trendChartInstance.dispose()
  trendChartInstance = echarts.init(trendChartRef.value)

  if (!metricsHistory.value.length) {
    trendChartInstance.clear()
    return
  }

  const history = [...metricsHistory.value].sort((a, b) => new Date(a.runTime) - new Date(b.runTime))
  const xAxis = history.map(item => formatShortTime(item.runTime))
  const rmse = history.map(item => item.rmse)
  const mae = history.map(item => item.mae)
  const r2 = history.map(item => item.r2)

  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['RMSE', 'MAE', 'R²'], top: 10 },
    grid: { left: 40, right: 40, bottom: 40, top: 50 },
    xAxis: { type: 'category', data: xAxis },
    yAxis: [
      { type: 'value', name: '误差值' },
      { type: 'value', name: 'R²', min: 0, max: 1 }
    ],
    series: [
      { name: 'RMSE', type: 'line', data: rmse, smooth: true, color: '#409EFF' },
      { name: 'MAE', type: 'line', data: mae, smooth: true, color: '#67C23A' },
      { name: 'R²', type: 'line', yAxisIndex: 1, data: r2, smooth: true, color: '#E6A23C', areaStyle: { opacity: 0.1 } }
    ]
  })
}

const renderCategoryChart = () => {
  if (!categoryChartRef.value) return
  if (categoryChartInstance) categoryChartInstance.dispose()
  categoryChartInstance = echarts.init(categoryChartRef.value)

  if (!categoryMetrics.value.length) {
    categoryChartInstance.clear()
    return
  }

  const categories = categoryMetrics.value.map(item => item.category)
  const maeData = categoryMetrics.value.map(item => Number(item.mae?.toFixed(2)))

  categoryChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 20, top: 30, bottom: 20 },
    xAxis: { type: 'value', name: 'MAE' },
    yAxis: { type: 'category', data: categories, inverse: true },
    series: [
      {
        type: 'bar',
        data: maeData,
        itemStyle: {
          color: '#91cc75'
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  })
}

const renderErrorChart = () => {
  if (!errorChartRef.value) return
  if (errorChartInstance) errorChartInstance.dispose()
  errorChartInstance = echarts.init(errorChartRef.value)

  if (!errorDistribution.value.length) {
    errorChartInstance.clear()
    return
  }

  const labels = errorDistribution.value.map(item => item.bucket)
  const counts = errorDistribution.value.map(item => item.count)
  const total = counts.reduce((sum, val) => sum + Number(val), 0)

  errorChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const value = params[0].value
        const percent = total ? ((value / total) * 100).toFixed(1) : 0
        return `${params[0].name}<br/>数量：${value}（${percent}%）`
      }
    },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', name: '样本数' },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: {
          color: '#fac858'
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  })
}

const handleResize = () => {
  trendChartInstance?.resize()
  categoryChartInstance?.resize()
  errorChartInstance?.resize()
}

const getR2Percentage = (r2) => {
  if (!r2 && r2 !== 0) return 0
  return Math.min(Math.max(r2 * 100, 0), 100).toFixed(1)
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

const formatShortTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatNumber = (num) => {
  if (num === null || num === undefined || Number.isNaN(num)) return '-'
  return Number(num).toFixed(2)
}

const disposeCharts = () => {
  trendChartInstance?.dispose()
  categoryChartInstance?.dispose()
  errorChartInstance?.dispose()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  disposeCharts()
  window.removeEventListener('resize', handleResize)
})

watch([metricsHistory, categoryMetrics, errorDistribution], () => {
  nextTick(() => renderAllCharts())
})
</script>

<style scoped>
.model-metrics {
  padding: 0;
}

.overview-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
}

.metric-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  margin: 8px 0;
}

.metric-desc {
  font-size: 12px;
  color: #a0a0a0;
}

.chart-row,
.table-row {
  margin-top: 20px;
}

.chart {
  width: 100%;
  height: 360px;
}

.summary-card {
  height: 100%;
}
</style>

