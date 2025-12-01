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
            <template #prefix>$</template>
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
    
    // 判断是否需要获取完整数据（单分类模式或价格区间筛选时需要更多数据）
    const needFullData = !!filters.value.category || !!filters.value.priceRange
    
    // 加载诊断分布统计（使用专门的统计接口，更高效）
    const diagnosisStatistics = await priceApi.getDiagnosisStatistics({
      category: filters.value.category || undefined,
      minPrice: priceRange.minPrice,
      maxPrice: priceRange.maxPrice
    })
    
    // 加载价格推荐数据
    // 单分类模式：需要获取该分类下所有商品数据用于散点图和热力图
    // 多分类模式：只需要少量数据用于重新计算分类统计
    let recommendationsResponse = await priceApi.getRecommendations({
      category: filters.value.category || undefined,
      minPrice: priceRange.minPrice,
      maxPrice: priceRange.maxPrice,
      pageNum: 1,
      pageSize: needFullData ? 10000 : 100
    })
    let recommendationsList = recommendationsResponse?.list || []
    
    // 保存全部分类数据用于雷达图对比
    const allCategoryData = categoryData
    
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
    
    // 确保单分类模式下，categoryData 只包含一个分类
    // 如果筛选了分类但数据为空，尝试从原始数据中获取
    if (filters.value.category && categoryData.length === 0) {
      const originalCategory = allCategoryData.find(item => item.productCategory === filters.value.category)
      if (originalCategory) {
        categoryData = [originalCategory]
      }
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
    
    // 判断是否为单分类模式
    const isSingleCategory = categoryData.length === 1
    
    // 渲染所有图表（根据单分类/多分类模式切换）
    renderCategoryChart(categoryData, isSingleCategory)
    renderDiscountChart(discountData)
    renderScatterChart(categoryData, isSingleCategory, recommendationsList)
    renderRatingChart(ratingData)
    renderHeatmapChart(categoryData, discountData, isSingleCategory, recommendationsList)
    renderPieChart(categoryData, isSingleCategory, recommendationsList)
    renderRadarChart(categoryData, isSingleCategory, allCategoryData)
    renderDiagnosisChart(diagnosisStatistics) // 使用统计接口返回的数据
    
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  }
}

// 1. 分类价格统计（柱状图+折线图 / 单分类指标卡片）
const renderCategoryChart = (data, isSingleCategory = false) => {
  if (!categoryChartRef.value) return
  
  // 如果图表已存在，先销毁
  if (categoryChart) {
    categoryChart.dispose()
  }
  categoryChart = echarts.init(categoryChartRef.value)
  
  if (isSingleCategory && data.length > 0) {
    // 单分类模式：使用仪表盘+柱状图组合展示
    const item = data[0]
    const avgPrice = item.avgDiscountedPrice || 0
    const avgSales = item.avgMonthlySales || 0
    const productCount = item.productCount || 0
    const avgRating = item.avgRating || 0
    const avgDiscount = item.avgDiscountPct || 0
    
    // 计算评分百分比（5分制转百分比）
    const ratingPercent = (avgRating / 5) * 100
    
    categoryChart.setOption({
      title: { 
        text: `${item.productCategory} - 综合指标分析`, 
        left: 'center', 
        top: '3%',
        textStyle: { fontSize: 16, fontWeight: 'bold' } 
      },
      tooltip: { trigger: 'item' },
      series: [
        // 左侧：平均价格仪表盘
        {
          type: 'gauge',
          center: ['25%', '45%'],
          radius: '50%',
          min: 0,
          max: Math.max(avgPrice * 2, 1000),
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [[1, '#409eff']]
            }
          },
          pointer: {
            itemStyle: {
              color: '#409eff'
            }
          },
          axisTick: { show: false },
          splitLine: {
            length: 15,
            lineStyle: { color: '#999' }
          },
          axisLabel: {
            distance: 25,
            fontSize: 10
          },
          detail: {
            valueAnimation: true,
            formatter: `$${avgPrice.toFixed(2)}`,
            fontSize: 16,
            offsetCenter: [0, '70%']
          },
          data: [{ value: avgPrice, name: '平均价格' }]
        },
        // 中间：平均评分仪表盘
        {
          type: 'gauge',
          center: ['50%', '45%'],
          radius: '50%',
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [[ratingPercent / 100, '#67c23a'], [1, '#e0e0e0']]
            }
          },
          pointer: {
            itemStyle: {
              color: '#67c23a'
            }
          },
          axisTick: { show: false },
          splitLine: {
            length: 15,
            lineStyle: { color: '#999' }
          },
          axisLabel: {
            distance: 25,
            fontSize: 10,
            formatter: (value) => (value / 20).toFixed(1)
          },
          detail: {
            valueAnimation: true,
            formatter: `${avgRating.toFixed(1)}分`,
            fontSize: 16,
            offsetCenter: [0, '70%']
          },
          data: [{ value: ratingPercent, name: '平均评分' }]
        },
        // 右侧：平均折扣仪表盘
        {
          type: 'gauge',
          center: ['75%', '45%'],
          radius: '50%',
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [[avgDiscount / 100, '#e6a23c'], [1, '#e0e0e0']]
            }
          },
          pointer: {
            itemStyle: {
              color: '#e6a23c'
            }
          },
          axisTick: { show: false },
          splitLine: {
            length: 15,
            lineStyle: { color: '#999' }
          },
          axisLabel: {
            distance: 25,
            fontSize: 10,
            formatter: '{value}%'
          },
          detail: {
            valueAnimation: true,
            formatter: `${avgDiscount.toFixed(1)}%`,
            fontSize: 16,
            offsetCenter: [0, '70%']
          },
          data: [{ value: avgDiscount, name: '平均折扣' }]
        },
        // 底部：关键指标柱状图（使用双Y轴）
        {
          name: '平均销量',
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: [{ value: avgSales, name: '平均销量', itemStyle: { color: '#67c23a' } }]
        },
        {
          name: '商品数量',
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 1,
          data: [{ value: productCount, name: '商品数量', itemStyle: { color: '#409eff' } }]
        }
      ],
      grid: [{
        left: '10%',
        right: '10%',
        top: '70%',
        bottom: '8%',
        height: '20%'
      }],
      xAxis: [{
        type: 'category',
        gridIndex: 0,
        data: ['平均销量', '商品数量'],
        axisLabel: { fontSize: 11 }
      }],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          position: 'left',
          name: '平均销量',
          axisLabel: { fontSize: 10 },
          nameTextStyle: { color: '#67c23a' }
        },
        {
          type: 'value',
          gridIndex: 0,
          position: 'right',
          name: '商品数量',
          axisLabel: { fontSize: 10 },
          nameTextStyle: { color: '#409eff' }
        }
      ],
      legend: {
        data: ['平均销量', '商品数量'],
        bottom: '2%',
        left: 'center'
      }
    })
  } else {
    // 多分类模式：柱状图+折线图
    categoryChart.setOption({
      title: { text: '各分类平均价格与销量', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均价格', '平均销量'], top: 30 },
      xAxis: {
        type: 'category',
        data: data.map(item => item.productCategory),
        axisLabel: { rotate: 45, interval: 0 }
      },
      yAxis: [
        { type: 'value', name: '价格($)', position: 'left' },
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
const renderScatterChart = (data, isSingleCategory = false, recommendationsList = []) => {
  if (!scatterChartRef.value) return
  
  // 如果图表已存在，先销毁
  if (scatterChart) {
    scatterChart.dispose()
  }
  scatterChart = echarts.init(scatterChartRef.value)
  
  if (isSingleCategory && recommendationsList.length > 0) {
    // 单分类模式：改为价格诊断分布 + 价格区间分布组合图表
    const diagnosisStats = {
      '价格偏高': 0,
      '价格偏低': 0,
      '价格合理': 0
    }
    
    const priceRanges = [
      { name: '0-50元', min: 0, max: 50, count: 0 },
      { name: '50-100元', min: 50, max: 100, count: 0 },
      { name: '100-200元', min: 100, max: 200, count: 0 },
      { name: '200-300元', min: 200, max: 300, count: 0 },
      { name: '300-500元', min: 300, max: 500, count: 0 },
      { name: '500-1000元', min: 500, max: 1000, count: 0 },
      { name: '1000元以上', min: 1000, max: Infinity, count: 0 }
    ]
    
    recommendationsList.forEach(item => {
      const diagnosis = item.diagnosis || '价格合理'
      if (diagnosisStats.hasOwnProperty(diagnosis)) {
        diagnosisStats[diagnosis]++
      }
      
      const price = item.actualPrice || item.predictedPrice || 0
      priceRanges.forEach(range => {
        if (price >= range.min && price < range.max) {
          range.count++
        }
      })
    })
    
    scatterChart.setOption({
      title: { 
        text: `${data[0]?.productCategory || ''} - 价格诊断与分布分析`, 
        left: 'center', 
        top: '3%',
        textStyle: { fontSize: 14 } 
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['诊断分布', '价格区间分布'],
        top: '12%',
        left: 'center'
      },
      grid: [
        { left: '10%', right: '10%', top: '22%', bottom: '55%' },
        { left: '10%', right: '10%', top: '58%', bottom: '18%' }
      ],
      xAxis: [
        {
          type: 'category',
          gridIndex: 0,
          data: ['价格偏高', '价格偏低', '价格合理'],
          axisLabel: { 
            fontSize: 11,
            interval: 0
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: priceRanges.map(r => r.name),
          axisLabel: { 
            rotate: -45,
            fontSize: 10,
            interval: 0,
            margin: 12,
            formatter: (value) => {
              // 如果标签太长，可以换行或缩短
              if (value.length > 6) {
                return value.split('元')[0] + '元'
              }
              return value
            }
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          name: '商品数量',
          axisLabel: { fontSize: 10 }
        },
        {
          type: 'value',
          gridIndex: 1,
          name: '商品数量',
          axisLabel: { fontSize: 10 }
        }
      ],
      series: [
        {
          name: '诊断分布',
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: [
            {
              value: diagnosisStats['价格偏高'],
              itemStyle: { color: '#f56c6c' }
            },
            {
              value: diagnosisStats['价格偏低'],
              itemStyle: { color: '#67c23a' }
            },
            {
              value: diagnosisStats['价格合理'],
              itemStyle: { color: '#409eff' }
            }
          ],
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
            fontSize: 11
          }
        },
        {
          name: '价格区间分布',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: priceRanges.map(r => ({
            value: r.count,
            itemStyle: { color: '#5470c6' }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: (params) => params.value > 0 ? params.value : '',
            fontSize: 10
          }
        }
      ]
    })
  } else {
    // 多分类模式：显示各分类的平均价格与销量
    scatterChart.setOption({
      title: { text: '价格与销量分布关系', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `${params.data[3]}<br/>价格: $${params.data[0]}<br/>销量: ${params.data[1]}`
        }
      },
      xAxis: { type: 'value', name: '平均价格($)' },
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
    yAxis: { type: 'value', name: '平均价格($)' },
    series: [{
      type: 'line',
      data: data.map(item => item.avgDiscountedPrice?.toFixed(2) || 0),
      smooth: true,
      itemStyle: { color: '#91cc75' },
      areaStyle: { opacity: 0.3 }
    }]
  })
}

// 5. 热力图：分类-折扣-销量关系 / 价格-折扣热力图
const renderHeatmapChart = (categoryData, discountData, isSingleCategory = false, recommendationsList = []) => {
  if (!heatmapChartRef.value) return
  
  // 如果图表已存在，先销毁
  if (heatmapChart) {
    heatmapChart.dispose()
  }
  heatmapChart = echarts.init(heatmapChartRef.value)
  
  if (isSingleCategory && recommendationsList.length > 0) {
    // 单分类模式：价格区间-折扣区间热力图
    const priceRanges = ['0-50', '50-100', '100-200', '200-300', '300-500', '500-1000', '1000+']
    const discountRanges = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60%+']
    
    // 计算每个价格区间-折扣区间的商品数量
    const heatmapData = []
    priceRanges.forEach((priceRange, i) => {
      discountRanges.forEach((discountRange, j) => {
        const [priceMin, priceMax] = priceRange === '1000+' 
          ? [1000, Infinity] 
          : priceRange.split('-').map(Number)
        const [discountMin, discountMax] = discountRange === '60%+'
          ? [60, Infinity]
          : discountRange.replace('%', '').split('-').map(Number)
        
        const count = recommendationsList.filter(item => {
          const price = item.actualPrice || item.predictedPrice || 0
          const discount = item.discountPercentage || 0
          return price >= priceMin && price < priceMax && discount >= discountMin && discount < discountMax
        }).length
        
        if (count > 0) {
          heatmapData.push([j, i, count])
        }
      })
    })
    
    heatmapChart.setOption({
      title: { 
        text: `${categoryData[0]?.productCategory || ''} - 价格与折扣分布热力图`, 
        left: 'center', 
        top: '5%',
        textStyle: { fontSize: 14 } 
      },
      tooltip: { 
        position: 'top',
        formatter: (params) => {
          return `价格: ${priceRanges[params.data[1]]}<br/>折扣: ${discountRanges[params.data[0]]}<br/>商品数: ${params.data[2]}`
        }
      },
      grid: { height: '60%', top: '20%' },
      xAxis: {
        type: 'category',
        data: discountRanges,
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: priceRanges,
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
        name: '商品数量',
        type: 'heatmap',
        data: heatmapData,
        label: { show: true, fontSize: 10 },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    })
  } else {
    // 多分类模式：分类-折扣-销量热力图
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
}

// 6. 饼图：分类占比 / 价格区间分布
const renderPieChart = (data, isSingleCategory = false, recommendationsList = []) => {
  if (!pieChartRef.value) return
  
  // 如果图表已存在，先销毁
  if (pieChart) {
    pieChart.dispose()
  }
  pieChart = echarts.init(pieChartRef.value)
  
  if (isSingleCategory && recommendationsList.length > 0) {
    // 单分类模式：价格区间分布饼图
    const priceRanges = [
      { name: '0-50元', min: 0, max: 50 },
      { name: '50-100元', min: 50, max: 100 },
      { name: '100-200元', min: 100, max: 200 },
      { name: '200-300元', min: 200, max: 300 },
      { name: '300-500元', min: 300, max: 500 },
      { name: '500-1000元', min: 500, max: 1000 },
      { name: '1000元以上', min: 1000, max: Infinity }
    ]
    
    const rangeData = priceRanges.map(range => {
      const count = recommendationsList.filter(item => {
        const price = item.actualPrice || item.predictedPrice || 0
        return price >= range.min && price < range.max
      }).length
      return { name: range.name, value: count }
    }).filter(item => item.value > 0) // 只显示有数据的区间
    
    pieChart.setOption({
      title: { 
        text: `${data[0]?.productCategory || ''} - 价格区间分布`, 
        left: 'center', 
        top: '5%',
        textStyle: { fontSize: 14 } 
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 11
        },
        data: rangeData.map(item => item.name)
      },
      series: [{
        name: '商品数量',
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['60%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 10,
          lineHeight: 12
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: 0.2
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: rangeData
      }]
    })
  } else {
    // 多分类模式：分类占比饼图
    pieChart.setOption({
      title: { 
        text: '各分类商品数量占比', 
        left: 'center', 
        top: '5%',
        textStyle: { fontSize: 14 } 
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 11
        },
        data: data.map(item => item.productCategory)
      },
      series: [{
        name: '商品数量',
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['60%', '55%'],
        avoidLabelOverlap: true,
        minAngle: 5,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: (params) => {
            if (params.percent < 2) {
              return ''
            }
            return `${params.name}\n${params.percent}%`
          },
          fontSize: 10,
          lineHeight: 12,
          distanceToLabelLine: 3
        },
        labelLine: {
          show: true,
          showAbove: false,
          length: 20,
          length2: 12,
          smooth: 0.2,
          lineStyle: {
            width: 1
          },
          minTurnAngle: 90
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: data.map(item => ({
          value: item.productCount || 0,
          name: item.productCategory
        }))
      }]
    })
  }
}

// 7. 雷达图：分类多维度对比
const renderRadarChart = (data, isSingleCategory = false, allCategoryData = []) => {
  if (!radarChartRef.value) return
  
  // 如果图表已存在，先销毁
  if (radarChart) {
    radarChart.dispose()
  }
  radarChart = echarts.init(radarChartRef.value)
  
  if (isSingleCategory && data.length > 0 && allCategoryData.length > 0) {
    // 单分类模式：该分类 vs 全部平均
    const currentCategory = data[0]
    
    // 计算全部分类的平均值
    const avgPrice = allCategoryData.reduce((sum, item) => sum + (item.avgDiscountedPrice || 0), 0) / allCategoryData.length
    const avgSales = allCategoryData.reduce((sum, item) => sum + (item.avgMonthlySales || 0), 0) / allCategoryData.length
    const avgRating = allCategoryData.reduce((sum, item) => sum + (item.avgRating || 0), 0) / allCategoryData.length
    const avgDiscount = allCategoryData.reduce((sum, item) => sum + (item.avgDiscountPct || 0), 0) / allCategoryData.length
    const avgCount = allCategoryData.reduce((sum, item) => sum + (item.productCount || 0), 0) / allCategoryData.length
    
    const maxPrice = Math.max(currentCategory.avgDiscountedPrice || 0, avgPrice)
    const maxSales = Math.max(currentCategory.avgMonthlySales || 0, avgSales)
    const maxCount = Math.max(currentCategory.productCount || 0, avgCount)
    
    radarChart.setOption({
      title: { 
        text: `${currentCategory.productCategory} vs 全部平均`, 
        left: 'center', 
        textStyle: { fontSize: 14 } 
      },
      tooltip: {},
      legend: {
        data: [currentCategory.productCategory, '全部平均'],
        top: 30
      },
      radar: {
        indicator: [
          { name: '平均价格', max: maxPrice * 1.2 },
          { name: '平均销量', max: maxSales * 1.2 },
          { name: '平均评分', max: 5 },
          { name: '平均折扣', max: 100 },
          { name: '商品数量', max: maxCount * 1.2 }
        ],
        center: ['50%', '55%'],
        radius: '60%'
      },
      series: [{
        type: 'radar',
        data: [
          {
            value: [
              currentCategory.avgDiscountedPrice || 0,
              currentCategory.avgMonthlySales || 0,
              currentCategory.avgRating || 0,
              currentCategory.avgDiscountPct || 0,
              currentCategory.productCount || 0
            ],
            name: currentCategory.productCategory,
            itemStyle: { color: '#5470c6' }
          },
          {
            value: [avgPrice, avgSales, avgRating, avgDiscount, avgCount],
            name: '全部平均',
            itemStyle: { color: '#91cc75' }
          }
        ]
      }]
    })
  } else {
    // 多分类模式：Top 5 分类对比
    const topCategories = data.slice(0, 5)
    
    radarChart.setOption({
      title: { text: '分类多维度对比（Top 5）', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: {},
      legend: {
        data: topCategories.map(item => item.productCategory),
        top: 30
      },
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
}

// 8. 价格诊断分布（柱状图）
const renderDiagnosisChart = (statistics) => {
  if (!diagnosisChartRef.value) return
  diagnosisChart = echarts.init(diagnosisChartRef.value)
  
  // statistics 是从后端返回的统计结果，格式：{ "价格偏高": 1314, "价格偏低": 11263, "价格合理": 26164 }
  // 确保所有诊断类型都有值
  const diagnosisCount = {
    '价格偏高': statistics['价格偏高'] || 0,
    '价格偏低': statistics['价格偏低'] || 0,
    '价格合理': statistics['价格合理'] || 0
  }
  
  const diagnosisTypes = Object.keys(diagnosisCount)
  const diagnosisValues = Object.values(diagnosisCount)
  
  diagnosisChart.setOption({
    title: { text: '价格诊断结果分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: diagnosisTypes
    },
    yAxis: { type: 'value', name: '商品数量' },
    series: [{
      type: 'bar',
      data: diagnosisValues,
      itemStyle: {
        color: (params) => {
          const colors = {
            '价格偏高': '#f56c6c',
            '价格偏低': '#67c23a',
            '价格合理': '#409eff'
          }
          return colors[diagnosisTypes[params.dataIndex]] || '#5470c6'
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

