<template>
  <div class="dashboard">
    <!-- 筛选栏 -->
    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="商品分类">
          <el-select v-model="filters.category" placeholder="全部分类" clearable style="width: 200px" @change="handleFilterChange">
            <el-option label="全部分类" value="" />
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-select v-model="filters.priceRange" placeholder="全部" clearable style="width: 200px" @change="handleFilterChange">
            <el-option label="全部" value="" />
            <el-option label="0-100元" value="0-100" />
            <el-option label="100-300元" value="100-300" />
            <el-option label="300-500元" value="300-500" />
            <el-option label="500-1000元" value="500-1000" />
            <el-option label="1000元以上" value="1000+" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshAll">刷新数据</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- KPI 卡片 -->
    <el-row :gutter="20" class="kpi-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="kpi-card">
          <el-statistic title="商品总数" :value="overview.totalProducts">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em"><Box /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="kpi-card">
          <el-statistic title="分类数量" :value="overview.totalCategories">
            <template #suffix>
              <el-icon style="vertical-align: -0.125em"><Menu /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="kpi-card">
          <el-statistic title="平均价格" :value="overview.avgPrice" :precision="2">
            <template #prefix>¥</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="kpi-card">
          <el-statistic title="模型准确率" :value="overview.modelAccuracy" :precision="1">
            <template #suffix>%</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第一行图表 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 1. 柱状图：分类价格统计 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><PieChart /></el-icon> 分类价格统计</span>
            </div>
          </template>
          <div ref="categoryChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 2. 折线图：折扣与销量关系 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 折扣与销量关系</span>
            </div>
          </template>
          <div ref="discountChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行图表 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 3. 散点图：价格与销量关系 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataAnalysis /></el-icon> 价格与销量关系</span>
            </div>
          </template>
          <div ref="scatterChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 4. 折线图：评分与价格关系 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataLine /></el-icon> 评分与价格关系</span>
            </div>
          </template>
          <div ref="ratingChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行图表 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 5. 热力图：分类-折扣-销量关系 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Grid /></el-icon> 分类-折扣-销量热力图</span>
            </div>
          </template>
          <div ref="heatmapChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 6. 饼图：分类占比 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><PieChart /></el-icon> 分类商品占比</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第四行图表 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 7. 雷达图：分类多维度对比 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Star /></el-icon> 分类多维度对比</span>
            </div>
          </template>
          <div ref="radarChartRef" class="chart"></div>
        </el-card>
      </el-col>

      <!-- 8. 柱状图：价格诊断分布 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Histogram /></el-icon> 价格诊断分布</span>
            </div>
          </template>
          <div ref="diagnosisChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { categoryApi } from '@/api/category'
import { analysisApi } from '@/api/analysis'
import { priceApi } from '@/api/price'
import { 
  Box, Menu, PieChart, TrendCharts, DataLine, 
  DataAnalysis, Grid, Star, Histogram 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 筛选条件
const filters = ref({
  category: '',
  priceRange: ''
})

// 概览数据
const overview = ref({
  totalProducts: 0,
  totalCategories: 0,
  avgPrice: 0,
  modelAccuracy: 0
})

// 分类列表
const categories = ref([])

// 图表引用
const categoryChartRef = ref(null)
const discountChartRef = ref(null)
const scatterChartRef = ref(null)
const ratingChartRef = ref(null)
const heatmapChartRef = ref(null)
const pieChartRef = ref(null)
const radarChartRef = ref(null)
const diagnosisChartRef = ref(null)

// 图表实例
let categoryChart = null
let discountChart = null
let scatterChart = null
let ratingChart = null
let heatmapChart = null
let pieChart = null
let radarChart = null
let diagnosisChart = null

// 价格区间转换为minPrice和maxPrice
const getPriceRange = () => {
  if (!filters.value.priceRange) return { minPrice: null, maxPrice: null }
  const range = filters.value.priceRange
  if (range === '0-100') return { minPrice: 0, maxPrice: 100 }
  if (range === '100-300') return { minPrice: 100, maxPrice: 300 }
  if (range === '300-500') return { minPrice: 300, maxPrice: 500 }
  if (range === '500-1000') return { minPrice: 500, maxPrice: 1000 }
  if (range === '1000+') return { minPrice: 1000, maxPrice: null }
  return { minPrice: null, maxPrice: null }
}

// 加载所有数据
const loadAllData = async () => {
  try {
    // 加载分类统计
    let categoryData = await categoryApi.getCategoryStats()
    categories.value = categoryData.map(item => item.productCategory)
    
    // 获取价格区间参数
    const priceRange = getPriceRange()
    
    // 加载价格推荐数据（用于价格区间筛选和诊断分布）
    let recommendationsResponse = await priceApi.getRecommendations({
      category: filters.value.category || undefined,
      minPrice: priceRange.minPrice,
      maxPrice: priceRange.maxPrice,
      pageNum: 1,
      pageSize: filters.value.priceRange ? 10000 : 1000 // 如果筛选价格区间，需要更多数据用于统计
    })
    let recommendationsList = recommendationsResponse?.list || []
    
    // 如果筛选了价格区间，需要从价格推荐数据中重新计算分类统计
    if (filters.value.priceRange && recommendationsList.length > 0) {
      // 根据筛选后的推荐数据重新计算分类统计
      const categoryMap = new Map()
      recommendationsList.forEach(item => {
        const cat = item.productCategory
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, {
            productCategory: cat,
            productCount: 0,
            totalPrice: 0,
            totalCount: 0
          })
        }
        const stat = categoryMap.get(cat)
        stat.productCount++
        const price = item.actualPrice || item.predictedPrice || 0
        stat.totalPrice += price
        stat.totalCount++
      })
      
      // 转换为分类统计数据格式（使用原始分类数据的其他字段作为参考）
      const originalCategoryMap = new Map(categoryData.map(item => [item.productCategory, item]))
      categoryData = Array.from(categoryMap.values()).map(stat => {
        const original = originalCategoryMap.get(stat.productCategory) || {}
        return {
          productCategory: stat.productCategory,
          productCount: stat.productCount,
          avgDiscountedPrice: stat.totalCount > 0 ? stat.totalPrice / stat.totalCount : 0,
          avgMonthlySales: original.avgMonthlySales || 0,
          avgRating: original.avgRating || 0,
          avgDiscountPct: original.avgDiscountPct || 0,
          avgOriginalPrice: original.avgOriginalPrice || 0
        }
      })
    } else if (filters.value.priceRange && recommendationsList.length === 0) {
      // 如果没有匹配的数据，显示空数据
      categoryData = []
    }
    
    // 应用分类筛选（如果只筛选分类，不筛选价格区间）
    if (filters.value.category && !filters.value.priceRange) {
      categoryData = categoryData.filter(item => item.productCategory === filters.value.category)
    }
    
    // 计算概览数据
    if (categoryData.length > 0) {
      overview.value.totalCategories = categoryData.length
      overview.value.totalProducts = categoryData.reduce((sum, item) => sum + (item.productCount || 0), 0)
      const totalPrice = categoryData.reduce((sum, item) => sum + (item.avgDiscountedPrice || 0) * (item.productCount || 0), 0)
      overview.value.avgPrice = overview.value.totalProducts > 0 ? totalPrice / overview.value.totalProducts : 0
    } else {
      overview.value.totalCategories = 0
      overview.value.totalProducts = 0
      overview.value.avgPrice = 0
    }

    // 加载折扣分析
    let discountData = await analysisApi.getDiscountSalesAnalysis()
    
    // 加载评分分析
    let ratingData = await analysisApi.getRatingPriceAnalysis()

    // 加载模型指标（用于计算准确率）
    try {
      const { modelApi } = await import('@/api/model')
      const modelMetrics = await modelApi.getModelMetrics()
      if (modelMetrics && modelMetrics.r2) {
        overview.value.modelAccuracy = parseFloat((modelMetrics.r2 * 100).toFixed(1))
      }
    } catch (error) {
      console.warn('加载模型指标失败，使用默认值:', error)
      overview.value.modelAccuracy = 0
    }

    await nextTick()
    
    // 渲染所有图表
    renderCategoryChart(categoryData)
    renderDiscountChart(discountData)
    renderScatterChart(categoryData)
    renderRatingChart(ratingData)
    renderHeatmapChart(categoryData, discountData)
    renderPieChart(categoryData)
    renderRadarChart(categoryData)
    renderDiagnosisChart(recommendationsList)
    
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  }
}

// 1. 分类价格统计（柱状图+折线图）
const renderCategoryChart = (data) => {
  if (!categoryChartRef.value) return
  categoryChart = echarts.init(categoryChartRef.value)
  categoryChart.setOption({
    title: { text: '各分类平均价格与销量', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均价格', '平均销量'], top: 30 },
    xAxis: {
      type: 'category',
      data: data.map(item => item.productCategory),
      axisLabel: { rotate: 45 }
    },
    yAxis: [
      { type: 'value', name: '价格(¥)', position: 'left' },
      { type: 'value', name: '销量', position: 'right' }
    ],
    series: [
      {
        name: '平均价格',
        type: 'bar',
        data: data.map(item => item.avgDiscountedPrice?.toFixed(2) || 0)
      },
      {
        name: '平均销量',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.avgMonthlySales?.toFixed(0) || 0)
      }
    ]
  })
}

// 2. 折扣与销量关系（柱状图）
const renderDiscountChart = (data) => {
  if (!discountChartRef.value) return
  discountChart = echarts.init(discountChartRef.value)
  discountChart.setOption({
    title: { text: '折扣力度对销量的影响', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map(item => item.discountBucket)
    },
    yAxis: { type: 'value', name: '平均销量' },
    series: [{
      type: 'bar',
      data: data.map(item => item.avgMonthlySales?.toFixed(0) || 0),
      itemStyle: { color: '#5470c6' }
    }]
  })
}

// 3. 价格与销量关系（散点图）
const renderScatterChart = (data) => {
  if (!scatterChartRef.value) return
  scatterChart = echarts.init(scatterChartRef.value)
  scatterChart.setOption({
    title: { text: '价格与销量分布关系', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.data[3]}<br/>价格: ¥${params.data[0]}<br/>销量: ${params.data[1]}`
      }
    },
    xAxis: { type: 'value', name: '平均价格(¥)' },
    yAxis: { type: 'value', name: '平均销量' },
    series: [{
      type: 'scatter',
      data: data.map(item => [
        item.avgDiscountedPrice || 0,
        item.avgMonthlySales || 0,
        item.productCount || 0,
        item.productCategory
      ]),
      symbolSize: (data) => {
        return Math.sqrt(data[2]) * 2 // 根据商品数量调整点大小
      },
      itemStyle: {
        color: '#5470c6',
        opacity: 0.6
      }
    }]
  })
}

// 4. 评分与价格关系（折线图）
const renderRatingChart = (data) => {
  if (!ratingChartRef.value) return
  ratingChart = echarts.init(ratingChartRef.value)
  ratingChart.setOption({
    title: { text: '评分与价格分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map(item => `${item.ratingBucket}.0-${item.ratingBucket}.9`)
    },
    yAxis: { type: 'value', name: '平均价格(¥)' },
    series: [{
      type: 'line',
      data: data.map(item => item.avgDiscountedPrice?.toFixed(2) || 0),
      smooth: true,
      itemStyle: { color: '#91cc75' },
      areaStyle: { opacity: 0.3 }
    }]
  })
}

// 5. 热力图：分类-折扣-销量关系
const renderHeatmapChart = (categoryData, discountData) => {
  if (!heatmapChartRef.value) return
  heatmapChart = echarts.init(heatmapChartRef.value)
  
  // 构建热力图数据（简化版：使用分类和折扣数据）
  const categories = categoryData.map(item => item.productCategory)
  const discountBuckets = discountData.map(item => item.discountBucket)
  
  // 生成热力图数据（这里使用平均销量作为热力值）
  const heatmapData = []
  categories.forEach((cat, i) => {
    discountBuckets.forEach((discount, j) => {
      const categoryItem = categoryData[i]
      const discountItem = discountData[j]
      if (categoryItem && discountItem) {
        heatmapData.push([j, i, (categoryItem.avgMonthlySales || 0) * (discountItem.avgMonthlySales || 0) / 100])
      }
    })
  })
  
  heatmapChart.setOption({
    title: { text: '分类-折扣-销量热力图', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { position: 'top' },
    grid: { height: '50%', top: '15%' },
    xAxis: {
      type: 'category',
      data: discountBuckets,
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: categories,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmapData.map(item => item[2]), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [{
      name: '销量热度',
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      }
    }]
  })
}

// 6. 饼图：分类占比
const renderPieChart = (data) => {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  pieChart.setOption({
    title: { text: '各分类商品数量占比', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.productCategory)
    },
    series: [{
      name: '商品数量',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {c} ({d}%)'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      data: data.map(item => ({
        value: item.productCount || 0,
        name: item.productCategory
      }))
    }]
  })
}

// 7. 雷达图：分类多维度对比
const renderRadarChart = (data) => {
  if (!radarChartRef.value) return
  radarChart = echarts.init(radarChartRef.value)
  
  // 选择前5个分类进行对比
  const topCategories = data.slice(0, 5)
  
  radarChart.setOption({
    title: { text: '分类多维度对比（Top 5）', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {},
    radar: {
      indicator: [
        { name: '平均价格', max: Math.max(...data.map(item => item.avgDiscountedPrice || 0)) },
        { name: '平均销量', max: Math.max(...data.map(item => item.avgMonthlySales || 0)) },
        { name: '平均评分', max: 5 },
        { name: '平均折扣', max: 100 },
        { name: '商品数量', max: Math.max(...data.map(item => item.productCount || 0)) }
      ],
      center: ['50%', '55%'],
      radius: '60%'
    },
    series: [{
      type: 'radar',
      data: topCategories.map(item => ({
        value: [
          item.avgDiscountedPrice || 0,
          item.avgMonthlySales || 0,
          item.avgRating || 0,
          item.avgDiscountPct || 0,
          item.productCount || 0
        ],
        name: item.productCategory
      }))
    }]
  })
}

// 8. 价格诊断分布（柱状图）
const renderDiagnosisChart = (data) => {
  if (!diagnosisChartRef.value) return
  diagnosisChart = echarts.init(diagnosisChartRef.value)
  
  // 统计诊断结果
  const diagnosisCount = {
    '价格偏高': 0,
    '价格偏低': 0,
    '价格合理': 0
  }
  
  data.forEach(item => {
    if (item.diagnosis && diagnosisCount.hasOwnProperty(item.diagnosis)) {
      diagnosisCount[item.diagnosis]++
    }
  })
  
  diagnosisChart.setOption({
    title: { text: '价格诊断结果分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: Object.keys(diagnosisCount)
    },
    yAxis: { type: 'value', name: '商品数量' },
    series: [{
      type: 'bar',
      data: Object.values(diagnosisCount),
      itemStyle: {
        color: (params) => {
          const colors = {
            '价格偏高': '#f56c6c',
            '价格偏低': '#67c23a',
            '价格合理': '#409eff'
          }
          return colors[Object.keys(diagnosisCount)[params.dataIndex]] || '#5470c6'
        }
      }
    }]
  })
}

// 筛选变化处理
const handleFilterChange = () => {
  // 筛选条件变化时自动重新加载数据
  loadAllData()
}

// 刷新所有数据
const refreshAll = () => {
  loadAllData()
  ElMessage.success('数据已刷新')
}

// 窗口大小变化时调整图表
const handleResize = () => {
  categoryChart?.resize()
  discountChart?.resize()
  scatterChart?.resize()
  ratingChart?.resize()
  heatmapChart?.resize()
  pieChart?.resize()
  radarChart?.resize()
  diagnosisChart?.resize()
}

onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin: 0;
}

.kpi-row {
  margin-bottom: 20px;
}

.kpi-card {
  text-align: center;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  min-height: 400px;
}

.card-header {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart {
  width: 100%;
  height: 350px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart {
    height: 300px;
  }
  
  .kpi-card {
    height: 100px;
  }
}
</style>

