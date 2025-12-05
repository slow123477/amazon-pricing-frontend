<template>
  <div class="price-diagnosis">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Search /></el-icon> 实时价格诊断</span>
        </div>
      </template>
      <el-form :model="diagnosisForm" label-width="120px" class="diagnosis-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="选择商品分类">
              <el-select v-model="diagnosisForm.category" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="cat in categories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="输入商品价格">
              <el-input-number
                v-model="diagnosisForm.price"
                :precision="2"
                :min="0"
                placeholder="请输入价格"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-button type="primary" @click="handleDiagnosis" :disabled="!diagnosisForm.category || !diagnosisForm.price">
                <el-icon><Search /></el-icon> 开始诊断
              </el-button>
              <el-button @click="resetDiagnosis">清空</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 价格调整模拟器 -->
      <el-card v-if="diagnosisResult" shadow="never" class="simulator-card">
        <template #header>
          <span class="result-title">价格调整模拟器</span>
        </template>
        <div class="simulator-content">
          <div class="slider-container">
            <el-slider
              v-model="simulatorPrice"
              :min="Math.max(0, (diagnosisResult.priceMin || 0) * 0.5)"
              :max="(diagnosisResult.priceMax || 1000) * 1.5"
              :step="1"
              show-stops
              :format-tooltip="formatPrice"
              @change="handleSimulatorChange"
            />
            <div class="slider-labels">
              <span>最低价: ${{ ((diagnosisResult.priceMin || 0) * 0.5).toFixed(2) }}</span>
              <span>当前价格: ${{ simulatorPrice.toFixed(2) }}</span>
              <span>最高价: ${{ ((diagnosisResult.priceMax || 1000) * 1.5).toFixed(2) }}</span>
            </div>
          </div>
          <el-button type="primary" @click="applySimulatorPrice" style="margin-top: 10px">
            应用此价格进行诊断
          </el-button>
        </div>
      </el-card>

      <!-- 诊断结果 -->
      <el-card v-if="diagnosisResult" shadow="never" class="result-card">
        <template #header>
          <span class="result-title">诊断结果</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="分类">{{ diagnosisResult.category }}</el-descriptions-item>
          <el-descriptions-item label="预测来源">
            <el-tag :type="diagnosisResult.isRealtimePrediction ? 'success' : 'info'">
              {{ diagnosisResult.isRealtimePrediction ? '实时预测' : '历史均值' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预测价格" v-if="diagnosisResult.predictedPrice !== undefined">
            <span style="color: #67C23A; font-weight: 600">${{ diagnosisResult.predictedPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="平均定价">
            <span style="color: #409EFF; font-weight: 600">${{ diagnosisResult.avgPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前商品价格">
            <span style="color: #E6A23C; font-weight: 600">${{ diagnosisResult.currentPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="系统诊断">
            <el-tag :type="getDiagnosisTagType(diagnosisResult.diagnosis)">
              {{ diagnosisResult.diagnosis }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优化建议" :span="2">
            <span style="color: #606266">{{ diagnosisResult.suggestion }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="预计效果" :span="2" v-if="diagnosisResult.salesImpact">
            <span style="color: #67C23A; font-weight: 600">{{ diagnosisResult.salesImpact }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 多个价格建议选项 -->
      <el-card v-if="diagnosisResult && diagnosisResult.priceSuggestions" shadow="never" class="suggestions-card">
        <template #header>
          <span class="result-title">价格建议方案</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8" v-for="(price, strategy) in diagnosisResult.priceSuggestions" :key="strategy">
            <el-card shadow="hover" class="suggestion-item">
              <div class="suggestion-header">
                <el-tag :type="getStrategyTagType(strategy)">{{ strategy }}策略</el-tag>
                <span class="suggestion-price">${{ price.toFixed(2) }}</span>
              </div>
              <div class="suggestion-desc">
                <p v-if="strategy === '保守'">风险较低，适合稳健经营</p>
                <p v-else-if="strategy === '适中'">平衡风险与收益，推荐选择</p>
                <p v-else-if="strategy === '激进'">追求更高收益，需承担一定风险</p>
              </div>
              <el-button type="primary" size="small" @click="applySuggestionPrice(price)" style="width: 100%; margin-top: 10px">
                应用此价格
              </el-button>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <!-- 竞品价格对比 -->
      <el-card v-if="diagnosisResult && diagnosisResult.priceMin" shadow="never" class="competitor-card">
        <template #header>
          <span class="result-title">竞品价格对比</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="最低价格">
            <span style="color: #67C23A; font-weight: 600">${{ diagnosisResult.priceMin?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="最高价格">
            <span style="color: #F56C6C; font-weight: 600">${{ diagnosisResult.priceMax?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="平均价格">
            <span style="color: #409EFF; font-weight: 600">${{ diagnosisResult.priceAvgFromDist?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="中位数价格">
            <span style="color: #E6A23C; font-weight: 600">${{ diagnosisResult.priceMedian?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前价格排名" :span="2">
            <el-progress
              :percentage="getPriceRankPercentage()"
              :color="getPriceRankColor()"
              :format="formatPriceRank"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 图表区域 -->
      <el-row :gutter="20" v-if="diagnosisResult" class="charts-row">
        <!-- 1. 价格分布可视化（柱状图） -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card v-if="diagnosisResult.priceRangeDistribution" shadow="never" class="chart-card">
            <template #header>
              <span class="result-title">价格分布可视化</span>
            </template>
            <div ref="priceDistributionChart" style="width: 100%; height: 350px;"></div>
          </el-card>
        </el-col>

        <!-- 2. 价格敏感度分析（面积图） -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card v-if="diagnosisResult.priceSalesRelation" shadow="never" class="chart-card">
            <template #header>
              <span class="result-title">价格敏感度分析</span>
            </template>
            <div ref="priceSensitivityChart" style="width: 100%; height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="diagnosisResult" class="charts-row">
        <!-- 3. 价格调整影响预测（折线图） -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="result-title">价格调整影响预测</span>
            </template>
            <div ref="priceImpactChart" style="width: 100%; height: 350px;"></div>
          </el-card>
        </el-col>

        <!-- 4. 价格竞争力雷达图 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span class="result-title">价格竞争力分析</span>
            </template>
            <div ref="competitivenessChart" style="width: 100%; height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="diagnosisResult" class="charts-row">
        <!-- 5. 价格策略效果对比（漏斗图） -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card v-if="diagnosisResult.priceSuggestions" shadow="never" class="chart-card">
            <template #header>
              <span class="result-title">价格策略效果对比</span>
            </template>
            <div ref="strategyComparisonChart" style="width: 100%; height: 350px;"></div>
          </el-card>
        </el-col>

        <!-- 6. 价格区间分布（树状图） -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card v-if="diagnosisResult.priceRangeDistribution" shadow="never" class="chart-card">
            <template #header>
              <span class="result-title">价格区间分布</span>
            </template>
            <div ref="priceTreemapChart" style="width: 100%; height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categoryApi } from '@/api/category'
import { priceApi } from '@/api/price'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const diagnosisForm = ref({
  category: '',
  price: null
})
const diagnosisResult = ref(null)
const categories = ref([])
const simulatorPrice = ref(0)
const priceDistributionChart = ref(null)
const priceSensitivityChart = ref(null)
const priceImpactChart = ref(null)
const competitivenessChart = ref(null)
const strategyComparisonChart = ref(null)
const priceTreemapChart = ref(null)
const route = useRoute()
const hasPrefilledFromRoute = ref(false)

let priceDistributionChartInstance = null
let priceSensitivityChartInstance = null
let priceImpactChartInstance = null
let competitivenessChartInstance = null
let strategyComparisonChartInstance = null
let priceTreemapChartInstance = null

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    categories.value = data.map(item => item.productCategory)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 根据路由参数预填表单并自动诊断
const prefillFromRoute = async () => {
  if (hasPrefilledFromRoute.value) return
  const { category, price } = route.query || {}
  let shouldDiagnose = false

  if (category) {
    diagnosisForm.value.category = category
    shouldDiagnose = true
  }
  if (price !== undefined) {
    const parsedPrice = Number(price)
    if (!Number.isNaN(parsedPrice) && parsedPrice > 0) {
      diagnosisForm.value.price = parsedPrice
      simulatorPrice.value = parsedPrice
      shouldDiagnose = true
    }
  }

  if (shouldDiagnose && diagnosisForm.value.category && diagnosisForm.value.price) {
    await handleDiagnosis()
  }

  hasPrefilledFromRoute.value = true
}

// 处理实时价格诊断
const handleDiagnosis = async () => {
  if (!diagnosisForm.value.category || !diagnosisForm.value.price) {
    ElMessage.warning('请选择分类并输入价格')
    return
  }
  
  try {
    const result = await priceApi.diagnosePrice({
      category: diagnosisForm.value.category,
      currentPrice: diagnosisForm.value.price
    })
    diagnosisResult.value = result
    simulatorPrice.value = diagnosisForm.value.price
    ElMessage.success('诊断完成')
    
    // 渲染所有图表
    await nextTick()
    renderAllCharts()
  } catch (error) {
    console.error('价格诊断失败:', error)
    ElMessage.error('诊断失败，请检查输入是否正确')
  }
}

// 应用模拟器价格
const applySimulatorPrice = async () => {
  diagnosisForm.value.price = simulatorPrice.value
  await handleDiagnosis()
}

// 应用建议价格
const applySuggestionPrice = async (price) => {
  diagnosisForm.value.price = price
  await handleDiagnosis()
}

// 模拟器价格变化
const handleSimulatorChange = (value) => {
  // 可以在这里实时更新诊断结果，但为了性能，我们只在点击"应用"时才诊断
}

// 格式化价格
const formatPrice = (value) => {
  return `$${value.toFixed(2)}`
}

// 重置诊断表单
const resetDiagnosis = () => {
  diagnosisForm.value = {
    category: '',
    price: null
  }
  diagnosisResult.value = null
  simulatorPrice.value = 0
  disposeAllCharts()
}

// 销毁所有图表
const disposeAllCharts = () => {
  if (priceDistributionChartInstance) {
    priceDistributionChartInstance.dispose()
    priceDistributionChartInstance = null
  }
  if (priceSensitivityChartInstance) {
    priceSensitivityChartInstance.dispose()
    priceSensitivityChartInstance = null
  }
  if (priceImpactChartInstance) {
    priceImpactChartInstance.dispose()
    priceImpactChartInstance = null
  }
  if (competitivenessChartInstance) {
    competitivenessChartInstance.dispose()
    competitivenessChartInstance = null
  }
  if (strategyComparisonChartInstance) {
    strategyComparisonChartInstance.dispose()
    strategyComparisonChartInstance = null
  }
  if (priceTreemapChartInstance) {
    priceTreemapChartInstance.dispose()
    priceTreemapChartInstance = null
  }
}

// 渲染所有图表
const renderAllCharts = () => {
  renderPriceDistributionChart()
  renderPriceSensitivityChart()
  renderPriceImpactChart()
  renderCompetitivenessChart()
  renderStrategyComparisonChart()
  renderPriceTreemapChart()
}

// 获取诊断结果的标签类型
const getDiagnosisTagType = (diagnosis) => {
  if (diagnosis?.includes('偏高')) return 'danger'
  if (diagnosis?.includes('偏低')) return 'warning'
  return 'success'
}

// 获取策略标签类型
const getStrategyTagType = (strategy) => {
  if (strategy === '保守') return 'info'
  if (strategy === '适中') return 'success'
  return 'warning'
}

// 获取价格排名百分比
const getPriceRankPercentage = () => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceMin || !diagnosisResult.value.priceMax) {
    return 50
  }
  const { currentPrice, priceMin, priceMax } = diagnosisResult.value
  if (priceMax === priceMin) return 50
  return ((currentPrice - priceMin) / (priceMax - priceMin)) * 100
}

// 获取价格排名颜色
const getPriceRankColor = () => {
  const percentage = getPriceRankPercentage()
  if (percentage < 30) return '#67C23A' // 绿色：价格较低
  if (percentage < 70) return '#409EFF' // 蓝色：价格适中
  return '#F56C6C' // 红色：价格较高
}

// 格式化价格排名
const formatPriceRank = (percentage) => {
  if (percentage < 30) return '价格较低（前30%）'
  if (percentage < 70) return '价格适中（30%-70%）'
  return '价格较高（后30%）'
}

// 渲染价格分布图表
const renderPriceDistributionChart = () => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceRangeDistribution || !priceDistributionChart.value) {
    return
  }

  // 销毁旧图表
  if (priceDistributionChartInstance) {
    priceDistributionChartInstance.dispose()
  }

  priceDistributionChartInstance = echarts.init(priceDistributionChart.value)

  const distribution = diagnosisResult.value.priceRangeDistribution
  const currentPrice = diagnosisResult.value.currentPrice
  const reasonableMin = diagnosisResult.value.reasonableMinPrice
  const reasonableMax = diagnosisResult.value.reasonableMaxPrice

  const option = {
    title: {
      text: '价格分布与当前价格位置',
      left: 'center',
      top: '5%'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['商品数量', '合理价格区间'],
      top: '10%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: distribution.map(item => item.priceRange),
      axisLabel: {
        rotate: 0,
        formatter: (value) => formatPriceRangeLabel(value)
      }
    },
    yAxis: {
      type: 'value',
      name: '商品数量'
    },
    series: [
      {
        name: '商品数量',
        type: 'bar',
        data: distribution.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        markLine: {
          data: [
            {
              name: '当前价格',
              xAxis: getCurrentPriceRange(currentPrice),
              lineStyle: {
                color: '#E6A23C',
                width: 2,
                type: 'solid'
              },
              label: {
                formatter: '当前价格',
                position: 'end'
              }
            }
          ]
        }
      },
      {
        name: '合理价格区间',
        type: 'line',
        data: distribution.map((item, index) => {
          const range = item.priceRange
          // 判断该区间是否在合理价格范围内
          const rangeMin = parseFloat(range.split('-')[0].replace('%', ''))
          const rangeMax = parseFloat(range.split('-')[1].replace('%', ''))
          const priceMin = diagnosisResult.value.priceMin
          const priceMax = diagnosisResult.value.priceMax
          const rangePriceMin = priceMin + (priceMax - priceMin) * (rangeMin / 100)
          const rangePriceMax = priceMin + (priceMax - priceMin) * (rangeMax / 100)
          
          if (reasonableMin && reasonableMax) {
            if (rangePriceMax >= reasonableMin && rangePriceMin <= reasonableMax) {
              return item.count
            }
          }
          return null
        }),
        lineStyle: {
          color: '#67C23A',
          width: 3,
          type: 'dashed'
        },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  }

  priceDistributionChartInstance.setOption(option)
}

// 获取当前价格所在的价格区间
const getCurrentPriceRange = (currentPrice) => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceMin || !diagnosisResult.value.priceMax) {
    return '40-60%'
  }
  const { priceMin, priceMax } = diagnosisResult.value
  if (priceMax === priceMin) return '40-60%'
  
  const percentage = ((currentPrice - priceMin) / (priceMax - priceMin)) * 100
  
  if (percentage < 20) return '0-20%'
  if (percentage < 40) return '20-40%'
  if (percentage < 60) return '40-60%'
  if (percentage < 80) return '60-80%'
  return '80-100%'
}

// 将百分比区间（0-20%）转换成更直观的价格区间文案（例如：$100 - $300）
const formatPriceRangeLabel = (range) => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceMin || !diagnosisResult.value.priceMax) {
    return range
  }

  const { priceMin, priceMax } = diagnosisResult.value
  const parts = range.split('-')
  if (parts.length !== 2) return range

  const minPercent = parseFloat(parts[0])
  const maxPercent = parseFloat(parts[1].replace('%', ''))
  if (isNaN(minPercent) || isNaN(maxPercent)) return range

  const minPrice = priceMin + (priceMax - priceMin) * (minPercent / 100)
  const maxPrice = priceMin + (priceMax - priceMin) * (maxPercent / 100)

  return `$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`
}

// 2. 渲染价格敏感度分析图（面积图）
const renderPriceSensitivityChart = () => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceSalesRelation || !priceSensitivityChart.value) {
    return
  }

  if (priceSensitivityChartInstance) {
    priceSensitivityChartInstance.dispose()
  }

  priceSensitivityChartInstance = echarts.init(priceSensitivityChart.value)

  const relation = diagnosisResult.value.priceSalesRelation
  const currentPrice = diagnosisResult.value.currentPrice
  const priceMin = diagnosisResult.value.priceMin
  const priceMax = diagnosisResult.value.priceMax

  const option = {
    title: {
      text: '价格与销量关系分析',
      left: 'center',
      top: '5%',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>平均价格: $${data.value[0].toFixed(2)}<br/>平均销量: ${data.value[1].toFixed(0)}`
      }
    },
    legend: {
      data: ['价格-销量关系'],
      top: '10%'
    },
    grid: {
      left: 70,
      right: 30,
      bottom: 50,
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '价格($)',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '平均销量',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: {
        fontSize: 12
      }
    },
    series: [{
      name: '价格-销量关系',
      type: 'line',
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      },
      data: relation.map(item => [
        ((Number)(item.avgPrice) || 0),
        ((Number)(item.avgSales) || 0)
      ]),
      smooth: true,
      lineStyle: { color: '#409EFF', width: 2 },
      markLine: {
        data: [{
          name: '当前价格',
          xAxis: currentPrice,
          lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
          label: { formatter: '当前价格: $' + currentPrice.toFixed(2) }
        }]
      }
    }]
  }

  priceSensitivityChartInstance.setOption(option)
}

// 3. 渲染价格调整影响预测图（折线图）
const renderPriceImpactChart = () => {
  if (!diagnosisResult.value || !priceImpactChart.value) {
    return
  }

  if (priceImpactChartInstance) {
    priceImpactChartInstance.dispose()
  }

  priceImpactChartInstance = echarts.init(priceImpactChart.value)

  const currentPrice = diagnosisResult.value.currentPrice
  const avgPrice = diagnosisResult.value.avgPrice
  const reasonableMin = diagnosisResult.value.reasonableMinPrice
  const reasonableMax = diagnosisResult.value.reasonableMaxPrice

  // 生成价格调整范围（-30% 到 +30%）
  const adjustments = []
  const impacts = []
  for (let i = -30; i <= 30; i += 5) {
    const newPrice = currentPrice * (1 + i / 100)
    adjustments.push(i)
    
    // 计算预期销量影响（简化模型）
    let impact = 0
    if (i < 0) {
      // 降价：销量提升
      impact = Math.abs(i) * 0.5 // 每降1%，销量提升0.5%
    } else if (i > 0) {
      // 涨价：销量下降
      impact = -i * 0.8 // 每涨1%，销量下降0.8%
    }
    impacts.push(impact)
  }

  const option = {
    title: {
      text: '价格调整对销量的影响预测',
      left: 'center',
      top: '5%',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `调整幅度: ${data.value[0]}%<br/>预期销量变化: ${data.value[1] > 0 ? '+' : ''}${data.value[1].toFixed(1)}%`
      }
    },
    legend: {
      data: ['预期销量变化'],
      top: '10%'
    },
    grid: {
      left: 80,
      right: 30,
      bottom: 55,
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '价格调整幅度(%)',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '预期销量变化(%)',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: {
        fontSize: 12
      }
    },
    series: [{
      name: '预期销量变化',
      type: 'line',
      data: adjustments.map((adj, idx) => [adj, impacts[idx]]),
      smooth: true,
      lineStyle: { color: '#67C23A', width: 2 },
      itemStyle: { color: '#67C23A' },
      markLine: {
        data: [
          {
            name: '当前价格',
            xAxis: 0,
            lineStyle: { color: '#E6A23C', width: 2, type: 'dashed' },
            label: { formatter: '当前价格' }
          },
          {
            name: '合理区间下限',
            xAxis: ((reasonableMin - currentPrice) / currentPrice * 100),
            lineStyle: { color: '#409EFF', width: 1, type: 'dotted' }
          },
          {
            name: '合理区间上限',
            xAxis: ((reasonableMax - currentPrice) / currentPrice * 100),
            lineStyle: { color: '#409EFF', width: 1, type: 'dotted' }
          }
        ]
      }
    }]
  }

  priceImpactChartInstance.setOption(option)
}

// 4. 渲染价格竞争力雷达图
const renderCompetitivenessChart = () => {
  if (!diagnosisResult.value || !competitivenessChart.value) {
    return
  }

  if (competitivenessChartInstance) {
    competitivenessChartInstance.dispose()
  }

  competitivenessChartInstance = echarts.init(competitivenessChart.value)

  const currentPrice = diagnosisResult.value.currentPrice
  const avgPrice = diagnosisResult.value.avgPrice
  const priceMin = diagnosisResult.value.priceMin
  const priceMax = diagnosisResult.value.priceMax
  const reasonableMin = diagnosisResult.value.reasonableMinPrice
  const reasonableMax = diagnosisResult.value.reasonableMaxPrice

  // 计算各项指标得分（0-100）
  const priceCompetitiveness = currentPrice <= reasonableMax && currentPrice >= reasonableMin ? 90 : 
                                currentPrice > reasonableMax ? 60 : 70
  const pricePosition = priceMax === priceMin ? 50 : ((currentPrice - priceMin) / (priceMax - priceMin) * 100)
  const priceGap = Math.abs(currentPrice - avgPrice) / avgPrice * 100
  const priceGapScore = priceGap < 5 ? 90 : priceGap < 10 ? 70 : priceGap < 20 ? 50 : 30
  const reasonableRange = reasonableMax - reasonableMin
  const rangeScore = reasonableRange / avgPrice < 0.3 ? 90 : reasonableRange / avgPrice < 0.5 ? 70 : 50

  const option = {
    title: {
      text: '价格竞争力多维度分析',
      left: 'center',
      top: '5%',
      textStyle: { fontSize: 14 }
    },
    tooltip: {},
    radar: {
      indicator: [
        { name: '价格竞争力', max: 100 },
        { name: '价格合理性', max: 100 },
        { name: '价格优势', max: 100 },
        { name: '市场定位', max: 100 },
        { name: '价格稳定性', max: 100 }
      ],
      center: ['50%', '55%'],
      radius: '65%'
    },
    series: [{
      name: '当前价格',
      type: 'radar',
      data: [{
        value: [
          priceCompetitiveness,
          priceGapScore,
          100 - pricePosition,
          pricePosition,
          rangeScore
        ],
        name: '当前价格竞争力',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        }
      }]
    }]
  }

  competitivenessChartInstance.setOption(option)
}

// 5. 渲染价格策略效果对比图（漏斗图）
const renderStrategyComparisonChart = () => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceSuggestions || !strategyComparisonChart.value) {
    return
  }

  if (strategyComparisonChartInstance) {
    strategyComparisonChartInstance.dispose()
  }

  strategyComparisonChartInstance = echarts.init(strategyComparisonChart.value)

  const suggestions = diagnosisResult.value.priceSuggestions
  const currentPrice = diagnosisResult.value.currentPrice
  const avgPrice = diagnosisResult.value.avgPrice

  // 计算各策略的预期效果（简化模型）
  const strategies = [
    {
      name: '保守策略',
      price: suggestions['保守'],
      salesImpact: currentPrice > suggestions['保守'] ? 5 : -3, // 降价提升销量，涨价降低销量
      profitImpact: currentPrice > suggestions['保守'] ? -2 : 8 // 降价降低利润，涨价提升利润
    },
    {
      name: '适中策略',
      price: suggestions['适中'],
      salesImpact: currentPrice > suggestions['适中'] ? 10 : -5,
      profitImpact: currentPrice > suggestions['适中'] ? -5 : 5
    },
    {
      name: '激进策略',
      price: suggestions['激进'],
      salesImpact: currentPrice > suggestions['激进'] ? 15 : -8,
      profitImpact: currentPrice > suggestions['激进'] ? -8 : 12
    }
  ]

  const option = {
    title: {
      text: '三种价格策略效果对比',
      left: 'center',
      top: '5%',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const strategy = strategies.find(s => s.name === params.name)
        return `${params.name}<br/>价格: $${strategy.price.toFixed(2)}<br/>预期销量变化: ${strategy.salesImpact > 0 ? '+' : ''}${strategy.salesImpact}%<br/>预期利润变化: ${strategy.profitImpact > 0 ? '+' : ''}${strategy.profitImpact}%`
      }
    },
    legend: {
      data: strategies.map(s => s.name),
      top: '10%'
    },
    series: [{
      name: '策略效果',
      type: 'funnel',
      left: '10%',
      top: '20%',
      bottom: '10%',
      width: '80%',
      min: 0,
      max: 100,
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: (params) => `${params.name}\n$${Number(params.value).toFixed(2)}`
      },
      labelLine: {
        length: 10,
        lineStyle: {
          width: 1,
          type: 'solid'
        }
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      emphasis: {
        label: {
          fontSize: 16
        }
      },
      data: strategies.map(s => ({
        value: Number((s.price || 0).toFixed(2)),
        name: s.name,
        itemStyle: {
          color: s.name === '保守策略' ? '#909399' : s.name === '适中策略' ? '#67C23A' : '#E6A23C'
        }
      }))
    }]
  }

  strategyComparisonChartInstance.setOption(option)
}

// 6. 渲染价格区间分布图（饼图）
const renderPriceTreemapChart = () => {
  if (!diagnosisResult.value || !diagnosisResult.value.priceRangeDistribution || !priceTreemapChart.value) {
    return
  }

  if (priceTreemapChartInstance) {
    priceTreemapChartInstance.dispose()
  }

  priceTreemapChartInstance = echarts.init(priceTreemapChart.value)

  const distribution = diagnosisResult.value.priceRangeDistribution
  const currentPrice = diagnosisResult.value.currentPrice
  const priceMin = diagnosisResult.value.priceMin
  const priceMax = diagnosisResult.value.priceMax
  const colorPalette = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C']

  const option = {
    title: {
      text: '价格区间占比（饼图）',
      left: 'center',
      top: '5%',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const percent = params.percent?.toFixed(1) ?? 0
        return `${params.name}<br/>商品数量: ${params.value} 件<br/>占比: ${percent}%`
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'middle',
      formatter: (name) => name
    },
    series: [{
      name: '价格区间',
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['40%', '55%'],
      label: {
        formatter: '{b}\n{c}件 ({d}%)'
      },
      data: distribution.map((item, index) => {
        const range = item.priceRange
        const isCurrentRange = getCurrentPriceRange(currentPrice) === range
        const label = formatPriceRangeLabel(range)
        const baseColor = colorPalette[index % colorPalette.length]
        return {
          name: label,
          value: item.count,
          itemStyle: {
            color: isCurrentRange ? '#FF9F43' : baseColor,
            borderColor: isCurrentRange ? '#FF6F00' : '#ffffff',
            borderWidth: isCurrentRange ? 2 : 1
          }
        }
      })
    }]
  }

  priceTreemapChartInstance.setOption(option)
}

// 监听诊断结果变化，更新图表
watch(() => diagnosisResult.value, () => {
  if (diagnosisResult.value) {
    nextTick(() => {
      renderAllCharts()
    })
  }
})

onMounted(async () => {
  await loadCategories()
  await prefillFromRoute()
})

// 组件卸载时销毁图表
onUnmounted(() => {
  disposeAllCharts()
})
</script>

<style scoped>
.price-diagnosis {
  padding: 0;
}

.card-header {
  font-weight: 600;
}

.diagnosis-form {
  margin-bottom: 20px;
}

.result-card,
.simulator-card,
.suggestions-card,
.competitor-card,
.chart-card {
  margin-top: 20px;
  background-color: #f5f7fa;
}

.result-title {
  font-weight: 600;
  color: #303133;
}

.simulator-content {
  padding: 10px 0;
}

.slider-container {
  margin-bottom: 20px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.suggestion-item {
  height: 100%;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.suggestion-price {
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.suggestion-desc {
  color: #909399;
  font-size: 14px;
  margin: 10px 0;
}

.charts-row {
  margin-top: 20px;
}

.chart-card {
  margin-bottom: 20px;
}
</style>

