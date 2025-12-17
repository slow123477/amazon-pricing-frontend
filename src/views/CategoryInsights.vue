<template>
  <div class="page category-insights">
    <!-- 顶部关键指标卡片（统一布局） -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">
              {{ card.value }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第一块：规模 & 价格结构分析（两张图一行） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">各品类规模与价格结构</span>
          <el-button type="primary" size="small" :loading="loading" @click="loadData">
            重新加载
          </el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span class="chart-title">各品类商品规模与销量对比</span>
              </div>
            </template>
            <div ref="scaleSalesChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span class="chart-title">各品类价格与折扣水平</span>
              </div>
            </template>
            <div ref="priceDiscountChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 第二块：评分与相关性分析（两张图一行） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">各品类评分与相关性分析</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span class="chart-title">各品类平均评分与销量对比</span>
              </div>
            </template>
            <div ref="ratingSalesChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span class="chart-title">高评分品类排名（按平均评分）</span>
              </div>
            </template>
            <div ref="correlationChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 底部数据明细表 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card">
          <template #header>分类指标明细（dm_category_stats）</template>
          <el-table :data="categoryStatsTable" height="360px" v-loading="loading">
            <el-table-column prop="productCategory" label="分类" min-width="140" />
            <el-table-column prop="productCount" label="商品数" width="100" />
            <el-table-column prop="avgOriginalPrice" label="均原价" width="110">
              <template #default="scope">{{ formatNumber(scope.row.avgOriginalPrice, 2) }}</template>
            </el-table-column>
            <el-table-column prop="avgDiscountedPrice" label="均折后价" width="110">
              <template #default="scope">{{ formatNumber(scope.row.avgDiscountedPrice, 2) }}</template>
            </el-table-column>
            <el-table-column prop="avgDiscountPct" label="均折扣(%)" width="120">
              <template #default="scope">{{ formatNumber(scope.row.avgDiscountPct, 2) }}</template>
            </el-table-column>
            <el-table-column prop="avgMonthlySales" label="均销量" width="110">
              <template #default="scope">{{ formatNumber(scope.row.avgMonthlySales, 2) }}</template>
            </el-table-column>
            <el-table-column prop="avgRating" label="均评分" width="90">
              <template #default="scope">{{ formatNumber(scope.row.avgRating, 2) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card">
          <template #header>分类相关性明细（评分-销量/价格）</template>
          <el-table :data="ratingCorrelation" height="360px" v-loading="loading">
            <el-table-column prop="productCategory" label="分类" min-width="140" />
            <el-table-column prop="corrRatingSales" label="评分-销量相关" width="140">
              <template #default="scope">{{ formatNumber(scope.row.corrRatingSales, 2) }}</template>
            </el-table-column>
            <el-table-column prop="corrRatingPrice" label="评分-价格相关" width="140">
              <template #default="scope">{{ formatNumber(scope.row.corrRatingPrice, 2) }}</template>
            </el-table-column>
            <el-table-column prop="avgRating" label="均评分" width="90">
              <template #default="scope">{{ formatNumber(scope.row.avgRating, 2) }}</template>
            </el-table-column>
            <el-table-column prop="avgMonthlySales" label="均销量" width="110">
              <template #default="scope">{{ formatNumber(scope.row.avgMonthlySales, 2) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { categoryApi } from '@/api/category'
import { salesApi } from '@/api/sales'
import { ratingApi } from '@/api/rating'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const categoryStats = ref([])
const salesCategoryStats = ref([])
const ratingCorrelation = ref([])

// 图表 DOM 引用
const scaleSalesChart = ref(null)
const priceDiscountChart = ref(null)
const ratingSalesChart = ref(null)
const correlationChart = ref(null)

// 图表实例
let scaleSalesInstance = null
let priceDiscountInstance = null
let ratingSalesInstance = null
let correlationInstance = null

const categoryStatsTable = computed(() => categoryStats.value)

// 顶部总体指标卡片（不再按分类筛选）
const statCards = computed(() => {
  if (!categoryStats.value.length) return []

  let totalProducts = 0
  let sumDiscounted = 0
  let sumSales = 0
  let sumRating = 0

  categoryStats.value.forEach(item => {
    const count = item.productCount || 0
    const avgDisc = item.avgDiscountedPrice || 0
    const avgSales = item.avgMonthlySales || 0
    const avgRating = item.avgRating || 0

    totalProducts += count
    sumDiscounted += avgDisc * count
    sumSales += avgSales * count
    sumRating += avgRating * count
  })

  const overallDiscounted = totalProducts ? sumDiscounted / totalProducts : 0
  const overallSales = totalProducts ? sumSales / totalProducts : 0
  const overallRating = totalProducts ? sumRating / totalProducts : 0

  return [
    { label: '商品总数', value: totalProducts.toLocaleString() },
    { label: '整体均折后价', value: fmt(overallDiscounted) },
    { label: '整体均销量', value: fmt(overallSales) },
    { label: '整体均评分', value: fmt(overallRating) }
  ]
})

const fmt = v => (v === null || v === undefined ? '--' : Number(v).toFixed(2))
const formatNumber = (v, digits = 2) => (v === null || v === undefined ? '--' : Number(v).toFixed(digits))

const disposeCharts = () => {
  if (scaleSalesInstance) scaleSalesInstance.dispose()
  if (priceDiscountInstance) priceDiscountInstance.dispose()
  if (ratingSalesInstance) ratingSalesInstance.dispose()
  if (correlationInstance) correlationInstance.dispose()
  scaleSalesInstance = null
  priceDiscountInstance = null
  ratingSalesInstance = null
  correlationInstance = null
}

// 图表 1：各品类商品规模与销量对比
const renderScaleSalesChart = () => {
  if (!categoryStats.value.length || !salesCategoryStats.value.length || !scaleSalesChart.value) return
  if (scaleSalesInstance) scaleSalesInstance.dispose()
  scaleSalesInstance = echarts.init(scaleSalesChart.value)

  const merged = salesCategoryStats.value
    .map(s => {
      const cs = categoryStats.value.find(c => c.productCategory === s.productCategory) || {}
      return {
        category: s.productCategory,
        totalSales: s.totalSales || 0,
        productCount: cs.productCount || s.productCount || 0
      }
    })
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 12)

  const names = merged.map(i => i.category)
  const totalSalesData = merged.map(i => i.totalSales)
  const productCountData = merged.map(i => i.productCount)

  scaleSalesInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const bar = params.find(p => p.seriesName === '总销量')
        const line = params.find(p => p.seriesName === '商品数')
        const lines = [`${bar?.axisValueLabel || ''}`]
        if (bar) {
          const v = bar.data || 0
          let vStr = ''
          if (v >= 100000000) vStr = (v / 100000000).toFixed(1) + '亿'
          else if (v >= 10000) vStr = (v / 10000).toFixed(1) + '万'
          else vStr = v.toFixed(0)
          lines.push(`总销量：${vStr}`)
        }
        if (line) lines.push(`商品数：${(line.data || 0).toFixed(0)}`)
        return lines.join('<br/>')
      }
    },
    legend: { data: ['总销量', '商品数'], bottom: 10 },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 25, fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '总销量', position: 'left' },
      { type: 'value', name: '商品数', position: 'right' }
    ],
    series: [
      {
        name: '总销量',
        type: 'bar',
        data: totalSalesData,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '商品数',
        type: 'line',
        yAxisIndex: 1,
        data: productCountData,
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 80 }
  })
}

// 图表 2：各品类价格与折扣水平
const renderPriceDiscountChart = () => {
  if (!categoryStats.value.length || !priceDiscountChart.value) return
  if (priceDiscountInstance) priceDiscountInstance.dispose()
  priceDiscountInstance = echarts.init(priceDiscountChart.value)

  const sorted = [...categoryStats.value]
    .sort((a, b) => (b.avgDiscountedPrice || 0) - (a.avgDiscountedPrice || 0))
    .slice(0, 12)

  const names = sorted.map(i => i.productCategory)
  const discounted = sorted.map(i => i.avgDiscountedPrice || 0)
  const discountPct = sorted.map(i => i.avgDiscountPct || 0)

  priceDiscountInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const price = params.find(p => p.seriesName === '均折后价')
        const discount = params.find(p => p.seriesName === '均折扣')
        const lines = [`${price?.axisValueLabel || ''}`]
        if (price) lines.push(`均折后价：$${(price.data || 0).toFixed(2)}`)
        if (discount) lines.push(`均折扣：${(discount.data || 0).toFixed(1)}%`)
        return lines.join('<br/>')
      }
    },
    legend: { data: ['均折后价', '均折扣'], bottom: 10 },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 25, fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '均折后价 ($)', position: 'left' },
      { type: 'value', name: '均折扣 (%)', position: 'right' }
    ],
    series: [
      {
        name: '均折后价',
        type: 'bar',
        data: discounted,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '均折扣',
        type: 'line',
        yAxisIndex: 1,
        data: discountPct,
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 80 }
  })
}

// 图表 3：各品类平均评分与销量对比（柱状 + 折线）
const renderRatingSalesChart = () => {
  if (!salesCategoryStats.value.length || !ratingSalesChart.value) return
  if (ratingSalesInstance) ratingSalesInstance.dispose()
  ratingSalesInstance = echarts.init(ratingSalesChart.value)

  const data = [...salesCategoryStats.value]
    .map(item => ({
      category: item.productCategory,
      rating: item.avgRating || 0,
      sales: item.avgMonthlySales || item.avgSales || 0
    }))
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 12)

  const names = data.map(d => d.category)
  const avgSales = data.map(d => d.sales || 0)
  const avgRating = data.map(d => d.rating || 0)

  ratingSalesInstance.setOption({
    tooltip: {
      trigger: 'item',
      trigger: 'axis',
      formatter: params => {
        const bar = params.find(p => p.seriesName === '平均销量')
        const line = params.find(p => p.seriesName === '平均评分')
        const lines = [`${bar?.axisValueLabel || ''}`]
        if (bar) {
          const v = bar.data || 0
          let vStr = ''
          if (v >= 100000000) vStr = (v / 100000000).toFixed(1) + '亿'
          else if (v >= 10000) vStr = (v / 10000).toFixed(1) + '万'
          else vStr = v.toFixed(0)
          lines.push(`平均销量：${vStr}`)
        }
        if (line) lines.push(`平均评分：${(line.data || 0).toFixed(2)}`)
        return lines.join('<br/>')
      }
    },
    legend: { data: ['平均销量', '平均评分'], bottom: 10 },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { interval: 0, rotate: 25, fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        name: '平均销量',
        position: 'left',
        axisLabel: {
          formatter: value => {
            if (value >= 100000000) return (value / 100000000).toFixed(1) + '亿'
            if (value >= 10000) return (value / 10000).toFixed(1) + '万'
            return value.toFixed(0)
          }
        }
      },
      {
        type: 'value',
        name: '平均评分',
        position: 'right',
        min: 0,
        max: 5
      }
    ],
    series: [
      {
        name: '平均销量',
        type: 'bar',
        data: avgSales,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '平均评分',
        type: 'line',
        yAxisIndex: 1,
        data: avgRating,
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 80 }
  })
}

// 图表 4：高评分品类排名（按平均评分）
const renderCorrelationChart = () => {
  if (!ratingCorrelation.value.length || !correlationChart.value) return
  if (correlationInstance) correlationInstance.dispose()
  correlationInstance = echarts.init(correlationChart.value)

  const sorted = [...ratingCorrelation.value]
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, 12)

  const names = sorted.map(i => i.productCategory)
  const ratings = sorted.map(i => i.avgRating || 0)

  correlationInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        const p = Array.isArray(params) ? params[0] : params
        const idx = p.dataIndex ?? 0
        const item = sorted[idx] || {}
        const sales = item.avgMonthlySales || 0
        const corrSales = item.corrRatingSales || 0
        const corrPrice = item.corrRatingPrice || 0
        return [
          `分类：${item.productCategory}`,
          `平均评分：${(item.avgRating || 0).toFixed(2)}`,
          `平均月销量：${sales.toFixed(0)}`,
          `评分-销量相关：${corrSales.toFixed(2)}`,
          `评分-价格相关：${corrPrice.toFixed(2)}`
        ].join('<br/>')
      }
    },
    grid: { left: 60, right: 20, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { interval: 0, rotate: 25, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '平均评分',
      min: 3.5,
      max: 5
    },
    series: [
      {
        name: '平均评分',
        type: 'bar',
        data: ratings,
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
}

const renderCharts = () => {
  renderScaleSalesChart()
  renderPriceDiscountChart()
  renderRatingSalesChart()
  renderCorrelationChart()
}

const loadData = async () => {
  loading.value = true
  try {
    const [catStats, salesStats, corr] = await Promise.all([
      categoryApi.getCategoryStats(),
      salesApi.getCategoryStats(),
      ratingApi.getCorrelation()
    ])
    categoryStats.value = catStats || []
    salesCategoryStats.value = salesStats || []
    ratingCorrelation.value = corr || []
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error(e)
    ElMessage.error('加载品类洞察数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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
.inner-card {
  margin-bottom: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
}
.chart {
  width: 100%;
  height: 320px;
}
.chart-header {
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
</style>


