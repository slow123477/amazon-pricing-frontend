<template>
  <div class="page sales-analysis">
    <!-- 顶部关键统计指标卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">全站总月销量</div>
            <div class="stat-value" style="color: #67C23A">
              {{ formatNumber(stats.totalSales) }}
            </div>
            <div class="stat-desc">最近一个月所有商品的总销量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">单品平均月销量</div>
            <div class="stat-value" style="color: #409EFF">
              {{ formatNumber(stats.avgSalesPerProduct) }}
            </div>
            <div class="stat-desc">总销量 / 商品数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">最畅销品类月销量</div>
            <div class="stat-value" style="color: #E6A23C">
              {{ formatNumber(stats.topCategorySales) }}
            </div>
            <div class="stat-desc">
              最畅销品类：{{ stats.topCategory || '--' }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">有优惠券商品占比</div>
            <div class="stat-value" style="color: #F56C6C">
              {{ formatPercent(stats.couponRatio) }}
            </div>
            <div class="stat-desc">按各品类平均销量加权计算</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 销量构成与集中度分析（两张图一行） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">销量构成与集中度分析</span>
          <el-button type="primary" :loading="loading" @click="loadAll">
            重新加载
          </el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>品类销量构成分析</span>
              </div>
            </template>
            <div ref="categoryPieChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>销量集中度折线图（前12品类）</span>
              </div>
            </template>
            <div ref="salesTrendChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 销量驱动因素分析（两张图一行） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">销量驱动因素分析</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>各品类优惠券覆盖率对比</span>
              </div>
            </template>
            <div ref="couponBarChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>销量主要驱动因素占比</span>
              </div>
            </template>
            <div ref="factorDriverPieChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>畅销商品（按销量）</span>
        </div>
      </template>
      <el-table :data="pagedBestSellers" height="520px" v-loading="loadingBest">
        <el-table-column label="#" width="60">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="productTitle" label="商品" min-width="220" show-overflow-tooltip />
        <el-table-column prop="productCategory" label="分类" width="140" show-overflow-tooltip />
        <el-table-column prop="purchasedLastMonth" label="月销量" width="100" />
        <el-table-column prop="productRating" label="评分" width="80" />
        <el-table-column prop="discountedPrice" label="折后价($)" width="100" />
        <el-table-column prop="discountPercentage" label="折扣(%)" width="90" />
        <el-table-column prop="totalReviews" label="评论数" width="100" />
        <el-table-column label="标签" width="140">
          <template #default="scope">
            <el-space size="4" wrap>
              <el-tag v-if="scope.row.isBestSeller" type="success" size="small">BestSeller</el-tag>
              <el-tag v-if="scope.row.isSponsored" type="warning" size="small">广告</el-tag>
              <el-tag v-if="scope.row.hasCoupon" type="info" size="small">券</el-tag>
              <el-tag v-if="scope.row.buyBoxAvailability === 'add to cart'" type="primary" size="small">BuyBox</el-tag>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          layout="prev, pager, next"
          :total="bestSellers.length"
          :page-size="pageSize"
          v-model:current-page="currentPage"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import { salesApi } from '@/api/sales'
import { ElMessage } from 'element-plus'

const categoryChart = ref(null)
const factorChart = ref(null)
const rankingChart = ref(null)
const categoryPieChart = ref(null)
const salesTrendChart = ref(null)
const couponBarChart = ref(null)
const factorDriverPieChart = ref(null)
let categoryInstance = null
let factorInstance = null
let rankingInstance = null
let categoryPieInstance = null
let salesTrendInstance = null
let couponBarInstance = null
let factorDriverPieInstance = null

const categoryStats = ref([])
const salesFactors = ref([])
const salesRanking = ref([])
const bestSellers = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

// 顶部统计指标
const stats = ref({
  totalSales: null,          // 全站总月销量
  avgSalesPerProduct: null,  // 单品平均月销量
  topCategory: null,         // 最畅销品类名称
  topCategorySales: null,    // 最畅销品类月销量
  couponRatio: null          // 有优惠券商品占比（加权）
})

const loading = ref(false)
const loadingBest = ref(false)

const pagedBestSellers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return bestSellers.value.slice(start, end)
})

const disposeCharts = () => {
  if (categoryInstance) categoryInstance.dispose()
  if (factorInstance) factorInstance.dispose()
  if (rankingInstance) rankingInstance.dispose()
  if (categoryPieInstance) categoryPieInstance.dispose()
  if (salesTrendInstance) salesTrendInstance.dispose()
  if (couponBarInstance) couponBarInstance.dispose()
  if (factorDriverPieInstance) factorDriverPieInstance.dispose()
  categoryInstance = factorInstance = rankingInstance = categoryPieInstance = salesTrendInstance = couponBarInstance = factorDriverPieInstance = null
}

const renderCategoryChart = () => {
  if (!categoryStats.value.length || !categoryChart.value) return
  if (categoryInstance) categoryInstance.dispose()
  categoryInstance = echarts.init(categoryChart.value)
  const names = categoryStats.value.map(i => i.productCategory)
  categoryInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          const value = param.value || 0
          if (param.seriesName === '总销量') {
            result += `${param.seriesName}: ${value.toFixed(0)}<br/>`
          } else {
            result += `${param.seriesName}: ${value.toFixed(2)}<br/>`
          }
        })
        return result
      }
    },
    xAxis: { type: 'category', data: names },
    yAxis: [
      { type: 'value', name: '总销量' },
      { type: 'value', name: '平均销量', position: 'right' }
    ],
    series: [
      {
        name: '总销量',
        type: 'bar',
        data: categoryStats.value.map(i => i.totalSales),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '平均销量',
        type: 'line',
        yAxisIndex: 1,
        data: categoryStats.value.map(i => i.avgSales || 0),
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 80 }
  })
}

// 品类销量构成饼图
const renderCategoryPieChart = () => {
  if (!categoryStats.value.length || !categoryPieChart.value) return
  if (categoryPieInstance) categoryPieInstance.dispose()
  categoryPieInstance = echarts.init(categoryPieChart.value)

  const data = categoryStats.value.map(item => ({
    name: item.productCategory || '未知分类',
    value: item.totalSales || 0
  }))

  categoryPieInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const percent = params.percent != null ? params.percent.toFixed(1) : '0.0'
        return [
          `品类：${params.name}`,
          `总销量：${formatNumber(params.value)}`,
          `占比：${percent}%`
        ].join('<br/>')
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20
    },
    series: [
      {
        name: '品类销量构成',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data,
        label: {
          formatter: '{b}\n{d}%'
        },
        labelLine: {
          length: 10,
          length2: 8
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.4)'
          }
        }
      }
    ]
  })
}

// 品类销量集中度折线图（前 N 品类累积占比）
const renderSalesTrendChart = () => {
  if (!categoryStats.value.length || !salesTrendChart.value) return
  if (salesTrendInstance) salesTrendInstance.dispose()
  salesTrendInstance = echarts.init(salesTrendChart.value)

  // 按总销量从高到低排序，取前 N 个品类
  const sorted = [...categoryStats.value].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
  const topN = sorted.slice(0, 12)
  const names = topN.map(i => i.productCategory)
  const sales = topN.map(i => i.totalSales || 0)
  const total = sales.reduce((sum, v) => sum + v, 0)
  const cumulative = sales.reduce((arr, v, idx) => {
    const prev = idx === 0 ? 0 : arr[idx - 1]
    arr.push(total > 0 ? (prev + v) / total * 100 : 0)
    return arr
  }, [])

  salesTrendInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const bar = params.find(p => p.seriesName === '单品类销量')
        const line = params.find(p => p.seriesName === '累计占比')
        const lines = []
        if (bar) {
          lines.push(`品类：${bar.axisValue}`)
          lines.push(`单品类销量：${formatNumber(bar.data)}`)
        }
        if (line) {
          lines.push(`累计占比：${line.data.toFixed(1)}%`)
        }
        return lines.join('<br/>')
      }
    },
    legend: { data: ['单品类销量', '累计占比'] },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { interval: 0, rotate: 35 }
    },
    yAxis: [
      {
        type: 'value',
        name: '销量',
        axisLabel: {
          formatter: value => {
            if (value >= 100000000) {
              return (value / 100000000).toFixed(1).replace(/\.0$/, '') + '亿'
            }
            if (value >= 10000) {
              return (value / 10000).toFixed(1).replace(/\.0$/, '') + '万'
            }
            return value
          }
        }
      },
      {
        type: 'value',
        name: '累计占比(%)',
        position: 'right',
        min: 0,
        max: 100
      }
    ],
    series: [
      {
        name: '单品类销量',
        type: 'bar',
        data: sales,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '累计占比',
        type: 'line',
        yAxisIndex: 1,
        data: cumulative,
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 80 }
  })
}

const renderFactorChart = () => {
  if (!salesFactors.value.length || !factorChart.value) return
  if (factorInstance) factorInstance.dispose()
  factorInstance = echarts.init(factorChart.value)
  const categories = salesFactors.value.map(i => i.productCategory)
  factorInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          const value = param.value || 0
          result += `${param.seriesName}: ${value.toFixed(2)}<br/>`
        })
        return result
      }
    },
    legend: { data: ['评分相关性', '折扣相关性', '评论相关性'] },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value', name: '相关系数' },
    series: [
      {
        name: '评分相关性',
        type: 'line',
        data: salesFactors.value.map(i => i.corrSalesRating || 0),
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '折扣相关性',
        type: 'line',
        data: salesFactors.value.map(i => i.corrSalesDiscount || 0),
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '评论相关性',
        type: 'line',
        data: salesFactors.value.map(i => i.corrSalesReviews || 0),
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 80 }
  })
}

// 各品类优惠券覆盖率饼图（样式统一为左环形 + 右图例）
const renderCouponBarChart = () => {
  if (!salesFactors.value.length || !couponBarChart.value) return
  if (couponBarInstance) couponBarInstance.dispose()
  couponBarInstance = echarts.init(couponBarChart.value)

  const sorted = [...salesFactors.value].sort((a, b) => (b.ratioCoupon || 0) - (a.ratioCoupon || 0))
  const topN = sorted.slice(0, 12)
  const pieData = topN.map(i => ({
    name: i.productCategory,
    value: (i.ratioCoupon || 0) * 100 // 直接用百分比值，便于提示
  }))

  couponBarInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: params => {
        return [
          `品类：${params.name}`,
          `有优惠券商品占比：${params.value.toFixed(1)}%`
        ].join('<br/>')
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20
    },
    series: [
      {
        name: '有优惠券商品占比',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: pieData,
        label: {
          formatter: '{b}\n{d}%'
        },
        labelLine: {
          length: 10,
          length2: 8
        }
      }
    ]
  })
}

// 销量主要驱动因素占比饼图（统计每个品类主要受哪个因素驱动）
const renderFactorDriverPieChart = () => {
  if (!salesFactors.value.length || !factorDriverPieChart.value) return
  if (factorDriverPieInstance) factorDriverPieInstance.dispose()
  factorDriverPieInstance = echarts.init(factorDriverPieChart.value)

  const counter = {
    rating: 0,
    discount: 0,
    reviews: 0
  }

  salesFactors.value.forEach(item => {
    const r = Math.abs(item.corrSalesRating || 0)
    const d = Math.abs(item.corrSalesDiscount || 0)
    const v = Math.abs(item.corrSalesReviews || 0)
    const max = Math.max(r, d, v)
    if (max === 0) return
    if (max === r) counter.rating++
    else if (max === d) counter.discount++
    else counter.reviews++
  })

  const pieData = [
    { name: '评分驱动为主的品类数', value: counter.rating },
    { name: '折扣驱动为主的品类数', value: counter.discount },
    { name: '评论驱动为主的品类数', value: counter.reviews }
  ]

  factorDriverPieInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}（{d}%）'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20
    },
    series: [
      {
        name: '驱动因素',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        data: pieData,
        label: {
          formatter: '{b}\n{d}%'
        },
        labelLine: {
          length: 10,
          length2: 8
        }
      }
    ]
  })
}

const renderRankingChart = () => {
  if (!salesRanking.value.length || !rankingChart.value) return
  if (rankingInstance) rankingInstance.dispose()
  rankingInstance = echarts.init(rankingChart.value)
  const top10 = salesRanking.value.slice(0, 10)
  rankingInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: top10.map(i => i.productTitle.slice(0, 12) + '...') },
    yAxis: { type: 'value', name: '月销量' },
    series: [
      {
        name: '月销量',
        type: 'bar',
        data: top10.map(i => i.purchasedLastMonth),
        itemStyle: { color: '#909399' }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 120 }
  })
}

const renderCharts = () => {
  renderCategoryChart()
  renderFactorChart()
  renderRankingChart()
  renderCategoryPieChart()
  renderSalesTrendChart()
  renderCouponBarChart()
  renderFactorDriverPieChart()
}

const loadCategoryStats = () => salesApi.getCategoryStats().then(res => { categoryStats.value = res || [] })
const loadSalesFactors = () => salesApi.getSalesFactors().then(res => { salesFactors.value = res || [] })
const loadSalesRanking = () => salesApi.getSalesRanking().then(res => { salesRanking.value = res || [] })

const loadBestSellers = async () => {
  loadingBest.value = true
  try {
    const res = await salesApi.getBestSellers()
    bestSellers.value = res || []
    currentPage.value = 1
  } catch (e) {
    console.error(e)
    ElMessage.error('加载畅销商品失败')
  } finally {
    loadingBest.value = false
  }
}

const loadCategories = async () => {}

// 计算统计指标
const calculateStats = () => {
  // 1. 基于分类统计计算总销量、单品平均销量、最畅销品类
  if (categoryStats.value && categoryStats.value.length > 0) {
    let totalSales = 0
    let totalProducts = 0
    let topCategory = null
    let topCategorySales = 0

    categoryStats.value.forEach(item => {
      const sales = item.totalSales || 0
      const count = item.productCount || 0
      totalSales += sales
      totalProducts += count
      if (sales > topCategorySales) {
        topCategorySales = sales
        topCategory = item.productCategory || null
      }
    })

    stats.value.totalSales = totalSales
    stats.value.avgSalesPerProduct = totalProducts > 0 ? totalSales / totalProducts : null
    stats.value.topCategory = topCategory
    stats.value.topCategorySales = topCategorySales
  }

  // 2. 基于销量影响因素计算“有优惠券商品占比”（按平均销量加权）
  if (salesFactors.value && salesFactors.value.length > 0) {
    let totalWeight = 0
    let weightedCoupon = 0

    salesFactors.value.forEach(item => {
      const weight = item.avgSales || 0
      const ratioCoupon = item.ratioCoupon || 0
      if (weight > 0) {
        totalWeight += weight
        weightedCoupon += ratioCoupon * weight
      }
    })

    stats.value.couponRatio = totalWeight > 0 ? weightedCoupon / totalWeight : null
  }
}

// 数值格式化
const formatNumber = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  return Number(val).toFixed(0)
}

// 百分比格式化
const formatPercent = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  return (Number(val) * 100).toFixed(1) + '%'
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadCategoryStats(),
      loadSalesFactors(),
      loadSalesRanking(),
      loadCategories()
    ])
    await nextTick()
    calculateStats()
    renderCharts()
    await loadBestSellers()
    ElMessage.success('销量分析数据已更新')
  } catch (e) {
    console.error(e)
    ElMessage.error('加载销量分析数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAll()
  window.addEventListener('resize', renderCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderCharts)
  disposeCharts()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stats-row {
  margin-bottom: 16px;
}
.section-card {
  width: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
}
.inner-card {
  margin-bottom: 12px;
}
.stat-card {
  height: 100%;
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.stat-content {
  padding: 8px 0;
  text-align: center;
}
.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.2;
}
.stat-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.chart {
  width: 100%;
  height: 320px;
}
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
</style>

