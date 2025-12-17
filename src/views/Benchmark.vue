<template>
  <div class="page benchmark">
    <!-- 顶部关键指标卡片（与其它页面统一） -->
    <el-row v-if="overview" :gutter="16" class="stats-row">
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

    <!-- 竞品标准说明 -->
    <div class="benchmark-note">
      当前竞品集合：全部分类中评分 TOP50 与销量 TOP200 的头部商品（去重后），用于对标分析
    </div>

    <!-- 第一块：竞品评分与销量分析 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">竞品评分与销量分析</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>竞品评分 vs 月销量（气泡图）</span>
              </div>
            </template>
            <div ref="ratingSalesChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>不同评分区间的平均价格</span>
              </div>
            </template>
            <div ref="priceRatingChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 第二块：竞品价格与口碑结构 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">竞品价格与口碑结构</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>评论数 TOP10 竞品</span>
              </div>
            </template>
            <div ref="reviewChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>折后价分布（直方图）</span>
              </div>
            </template>
            <div ref="priceDistChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 竞品 TOP 榜单（两张表一行） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>竞品对标 / 商品体检</span>
          <el-space :size="12">
            <span class="benchmark-scope">当前视图：全部分类（全站头部竞品）</span>
            <el-button type="primary" :loading="loading" @click="loadAll">刷新</el-button>
          </el-space>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>同类 TOP 评分商品</span>
              </div>
            </template>
            <el-table :data="topRated" height="360px" v-loading="loading">
              <el-table-column prop="productTitle" label="商品" min-width="220" show-overflow-tooltip />
              <el-table-column prop="productRating" label="评分" width="80" />
              <el-table-column prop="totalReviews" label="评论" width="100" />
              <el-table-column prop="purchasedLastMonth" label="月销量" width="100" />
              <el-table-column prop="discountedPrice" label="折后价" width="100">
                <template #default="scope">{{ fmt(scope.row.discountedPrice) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>同类 TOP 销量商品</span>
              </div>
            </template>
            <el-table :data="topSales" height="360px" v-loading="loading">
              <el-table-column prop="productTitle" label="商品" min-width="220" show-overflow-tooltip />
              <el-table-column prop="purchasedLastMonth" label="月销量" width="100" />
              <el-table-column prop="productRating" label="评分" width="80" />
              <el-table-column prop="discountedPrice" label="折后价" width="100">
                <template #default="scope">{{ fmt(scope.row.discountedPrice) }}</template>
              </el-table-column>
              <el-table-column prop="totalReviews" label="评论" width="100" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { benchmarkApi } from '@/api/benchmark'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const selectedCategory = ref('') // 空字符串表示全部分类
const overview = ref(null)
const topRated = ref([])
const topSales = ref([])

// 图表 DOM 引用
const ratingSalesChart = ref(null)
const priceRatingChart = ref(null)
const reviewChart = ref(null)
const priceDistChart = ref(null)

// 图表实例
let ratingSalesInstance = null
let priceRatingInstance = null
let reviewInstance = null
let priceDistInstance = null

const fmt = v => (v === null || v === undefined ? '--' : Number(v).toFixed(2))

const statCards = computed(() => {
  if (!overview.value || !overview.value.categoryStats) return []
  const cs = overview.value.categoryStats
  return [
    { label: '商品数', value: cs.productCount ?? '--' },
    { label: '均折后价', value: fmt(cs.avgDiscountedPrice) },
    { label: '均销量', value: fmt(cs.avgMonthlySales) },
    { label: '均评分', value: fmt(cs.avgRating) }
  ]
})

const disposeCharts = () => {
  if (ratingSalesInstance) ratingSalesInstance.dispose()
  if (priceRatingInstance) priceRatingInstance.dispose()
  if (reviewInstance) reviewInstance.dispose()
  if (priceDistInstance) priceDistInstance.dispose()
  ratingSalesInstance = null
  priceRatingInstance = null
  reviewInstance = null
  priceDistInstance = null
}

// 合并评分榜和销量榜数据，用于可视化
const getMergedProducts = () => {
  const map = new Map()
  const add = item => {
    if (!item) return
    const key = item.asin || item.productId || item.productTitle
    if (!key) return
    const existing = map.get(key) || {}
    map.set(key, { ...existing, ...item })
  }
  topRated.value.forEach(add)
  topSales.value.forEach(add)
  return Array.from(map.values())
}

// 图表1：竞品评分 vs 平均月销量（按评分区间聚合柱状图）
const renderRatingSalesChart = () => {
  const el = ratingSalesChart.value
  if (!el) return
  const data = getMergedProducts()
  if (!data.length) return

  if (ratingSalesInstance) ratingSalesInstance.dispose()
  ratingSalesInstance = echarts.init(el)

  // 按 0.5 分区间聚合平均销量，避免气泡堆叠
  const bucketMap = new Map()
  data.forEach(p => {
    const rating = p.productRating || 0
    const sales = p.purchasedLastMonth || 0
    if (!rating || !sales) return
    const bucket = Math.round(rating * 2) / 2 // 0.5 分一档：4.0 / 4.5 / 5.0
    const key = bucket.toFixed(1)
    const b = bucketMap.get(key) || { sum: 0, count: 0 }
    b.sum += sales
    b.count += 1
    bucketMap.set(key, b)
  })

  const buckets = Array.from(bucketMap.entries())
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([label, v]) => ({
      label,
      avgSales: v.count ? v.sum / v.count : 0
    }))

  if (!buckets.length) return

  const labels = buckets.map(b => `${b.label}分`)
  const values = buckets.map(b => b.avgSales)

  ratingSalesInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        return `${p.axisValue}<br/>平均月销量：${(p.data || 0).toFixed(0)}`
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { interval: 0, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '平均月销量',
      nameLocation: 'middle',
      nameGap: 50
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: '#409EFF' },
        label: {
          show: true,
          position: 'top',
          formatter: v => `${(v.data || 0).toFixed(0)}`,
          fontSize: 11
        }
      }
    ],
    grid: { left: 70, right: 30, top: 40, bottom: 60 }
  })
}

// 图表2：不同评分区间的平均价格
const renderPriceRatingChart = () => {
  const el = priceRatingChart.value
  if (!el) return
  const data = getMergedProducts()
  if (!data.length) return

  if (priceRatingInstance) priceRatingInstance.dispose()
  priceRatingInstance = echarts.init(el)

  const bucketsMap = new Map()
  data.forEach(p => {
    const rating = p.productRating || 0
    const price = p.discountedPrice || 0
    if (!rating || !price) return
    const bucket = Math.round(rating * 2) / 2 // 0.5 分桶
    const key = bucket.toFixed(1)
    const b = bucketsMap.get(key) || { sum: 0, count: 0 }
    b.sum += price
    b.count += 1
    bucketsMap.set(key, b)
  })

  const buckets = Array.from(bucketsMap.entries())
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([label, v]) => ({
      label,
      avgPrice: v.count ? v.sum / v.count : 0
    }))

  const labels = buckets.map(b => `${b.label}分`)
  const values = buckets.map(b => b.avgPrice)

  priceRatingInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        return `${p.axisValue}<br/>平均折后价：$${(p.data || 0).toFixed(2)}`
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { interval: 0, rotate: 25, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '平均折后价 ($)',
      nameLocation: 'middle',
      nameGap: 50
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: '#67C23A' },
        label: {
          show: true,
          position: 'top',
          formatter: v => `$${(v.data || 0).toFixed(2)}`,
          fontSize: 11
        }
      }
    ],
    grid: { left: 70, right: 30, top: 40, bottom: 80 }
  })
}

// 图表3：评论数 TOP10（柱状图）
const renderReviewChart = () => {
  const el = reviewChart.value
  if (!el) return

  const data = getMergedProducts()
  if (!data.length) return

  if (reviewInstance) reviewInstance.dispose()
  reviewInstance = echarts.init(el)

  const sorted = [...data]
    .filter(p => p.totalReviews)
    .sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
    .slice(0, 10)

  const labels = sorted.map(p => p.productTitle)
  const values = sorted.map(p => p.totalReviews || 0)

  reviewInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        const p = params[0]
        const name = String(p.axisValue || '')
        // 商品名太长时换行显示，提升可读性
        const wrappedName = name.replace(/(.{20})/g, '$1<br/>')
        return `${wrappedName}<br/>评论数：${p.data?.toLocaleString?.() || p.data || 0}`
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 10,
        formatter: value => {
          if (!value) return ''
          return value.length > 10 ? `${value.slice(0, 10)}...` : value
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '评论数',
      nameLocation: 'middle',
      // 适当减小 nameGap，并通过 padding 将文字稍微往右移一点，避免被裁剪
      nameGap: 55,
      nameTextStyle: {
        fontSize: 12,
        padding: [0, 0, 0, 4]
      },
      axisLabel: {
        fontSize: 10,
        formatter: val => {
          const v = Number(val) || 0
          if (v >= 100000) {
            return `${(v / 10000).toFixed(0)}万`
          }
          if (v >= 10000) {
            return `${(v / 10000).toFixed(1)}万`
          }
          return v.toString()
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    // 恢复较小的左边距，保证图表区域足够大
    grid: { left: 60, right: 20, top: 40, bottom: 90, containLabel: true }
  })
}

// 图表4：折后价分布直方图
const renderPriceDistChart = () => {
  const el = priceDistChart.value
  if (!el) return
  const data = getMergedProducts()
  if (!data.length) return

  if (priceDistInstance) priceDistInstance.dispose()
  priceDistInstance = echarts.init(el)

  const prices = data
    .map(p => p.discountedPrice || 0)
    .filter(v => v > 0)
    .sort((a, b) => a - b)

  if (!prices.length) return

  const min = prices[0]
  const max = prices[prices.length - 1]
  const bucketSize = (max - min) / 6 || 1
  const buckets = new Array(6).fill(0)

  prices.forEach(price => {
    let idx = Math.floor((price - min) / bucketSize)
    if (idx >= 6) idx = 5
    buckets[idx] += 1
  })

  const labels = buckets.map((_, i) => {
    const start = min + bucketSize * i
    const end = i === 5 ? max : min + bucketSize * (i + 1)
    return `$${start.toFixed(0)}-${end.toFixed(0)}`
  })

  priceDistInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { interval: 0, rotate: 25, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '商品数',
      nameLocation: 'middle',
      nameGap: 45
    },
    series: [
      {
        type: 'bar',
        data: buckets,
        itemStyle: { color: '#409EFF' }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 80 }
  })
}

const renderCharts = () => {
  disposeCharts()
  renderRatingSalesChart()
  renderPriceRatingChart()
  renderReviewChart()
  renderPriceDistChart()
}

const loadAll = async () => {
  loading.value = true
  try {
    const [ov, rated, sales] = await Promise.all([
      benchmarkApi.getOverview({ category: selectedCategory.value }),
      benchmarkApi.getTopRated({ category: selectedCategory.value }),
      benchmarkApi.getTopSales({ category: selectedCategory.value })
    ])
    overview.value = ov || null
    topRated.value = rated || []
    topSales.value = sales || []
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error(e)
    ElMessage.error('加载对标数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAll()
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
.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
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
.benchmark-note {
  margin: -8px 0 8px;
  font-size: 13px;
  color: #909399;
}
.benchmark-scope {
  font-size: 13px;
  color: #606266;
}
.chart {
  width: 100%;
  height: 360px;
}
</style>


