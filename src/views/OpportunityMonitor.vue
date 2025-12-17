<template>
  <div class="page">
    <!-- 顶部关键指标卡片 -->
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

    <!-- 机会与异常概览图表（上半部分，两张图） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">异常与机会分布概览</span>
          <el-space :size="12">
            <el-button type="primary" :loading="loading" @click="loadData">刷新</el-button>
          </el-space>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>机会榜 TOP10（按评论数）</span>
              </div>
            </template>
            <div ref="highDistChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>异常榜 TOP10（按月销量）</span>
              </div>
            </template>
            <div ref="lowDistChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 机会与异常结构分析（下半部分，两张图） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">异常与机会结构分析</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>机会商品标签结构（券 / 广告 / Best）</span>
              </div>
            </template>
            <div ref="highScatterChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>异常商品：评分 vs 月销量（散点图）</span>
              </div>
            </template>
            <div ref="lowScatterChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 底部机会 / 异常清单表格 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>异常与机会清单</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="inner-card">
            <template #header>高评分低销量机会榜</template>
            <el-table :data="highList" height="360px" v-loading="loading">
              <el-table-column prop="productTitle" label="商品" min-width="220" show-overflow-tooltip />
              <el-table-column prop="productRating" label="评分" width="80" />
              <el-table-column prop="purchasedLastMonth" label="月销量" width="100" />
              <el-table-column prop="totalReviews" label="评论" width="100" />
              <el-table-column label="标签" width="120">
                <template #default="scope">
                  <el-space wrap :size="4">
                    <el-tag v-if="scope.row.isBestSeller" type="success" size="small">Best</el-tag>
                    <el-tag v-if="scope.row.hasCoupon" type="info" size="small">券</el-tag>
                  </el-space>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="inner-card">
            <template #header>低评分高销量异常榜</template>
            <el-table :data="lowList" height="360px" v-loading="loading">
              <el-table-column prop="productTitle" label="商品" min-width="220" show-overflow-tooltip />
              <el-table-column prop="productRating" label="评分" width="80" />
              <el-table-column prop="purchasedLastMonth" label="月销量" width="100" />
              <el-table-column prop="totalReviews" label="评论" width="100" />
              <el-table-column label="标签" width="120">
                <template #default="scope">
                  <el-space wrap :size="4">
                    <el-tag v-if="scope.row.isSponsored" type="warning" size="small">广告</el-tag>
                    <el-tag v-if="scope.row.hasCoupon" type="info" size="small">券</el-tag>
                  </el-space>
                </template>
              </el-table-column>
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
import { ratingApi } from '@/api/rating'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const highList = ref([])
const lowList = ref([])

// 图表 DOM 引用
const highDistChart = ref(null)
const lowDistChart = ref(null)
const highScatterChart = ref(null)
const lowScatterChart = ref(null)

// 图表实例
let highDistInstance = null
let lowDistInstance = null
let highScatterInstance = null
let lowScatterInstance = null

const fmtNumber = (v, digits = 0) => {
  if (v === null || v === undefined || isNaN(v)) return '--'
  return Number(v).toFixed(digits)
}

// 顶部指标卡片
const statCards = computed(() => {
  const highCnt = highList.value.length
  const lowCnt = lowList.value.length

  const avg = (arr, key) => {
    if (!arr.length) return '--'
    const sum = arr.reduce((s, i) => s + (Number(i[key]) || 0), 0)
    return fmtNumber(sum / arr.length, 2)
  }

  return [
    { label: '高评分低销量机会数', value: highCnt },
    { label: '低评分高销量异常数', value: lowCnt },
    { label: '机会商品平均评分', value: avg(highList.value, 'productRating') },
    { label: '异常商品平均评分', value: avg(lowList.value, 'productRating') }
  ]
})

const disposeCharts = () => {
  if (highDistInstance) highDistInstance.dispose()
  if (lowDistInstance) lowDistInstance.dispose()
  if (highScatterInstance) highScatterInstance.dispose()
  if (lowScatterInstance) lowScatterInstance.dispose()
  highDistInstance = null
  lowDistInstance = null
  highScatterInstance = null
  lowScatterInstance = null
}

// 图表1：机会榜 TOP10（按评论数）
const renderHighDistChart = () => {
  const el = highDistChart.value
  if (!el || !highList.value.length) return
  if (highDistInstance) highDistInstance.dispose()
  highDistInstance = echarts.init(el)

  const top = [...highList.value]
    .sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
    .slice(0, 10)
  const labels = top.map(p => p.productTitle)
  const values = top.map(p => Number(p.totalReviews) || 0)

  highDistInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        const item = top[p.dataIndex]
        return [
          item.productTitle || '',
          `评论数：${fmtNumber(item.totalReviews, 0)}`,
          `评分：${fmtNumber(item.productRating, 2)}`,
          `月销量：${fmtNumber(item.purchasedLastMonth, 0)}`
        ].join('<br/>')
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        interval: 0,
        rotate: 25,
        fontSize: 11,
        formatter: value => (value && value.length > 10 ? `${value.slice(0, 10)}...` : value)
      }
    },
    yAxis: {
      type: 'value',
      name: '评论数',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: { formatter: val => fmtNumber(val, 0) }
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: '#67C23A' },
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          formatter: val => fmtNumber(val.data, 0)
        }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 80 }
  })
}

// 图表2：异常榜 TOP10（按月销量）
const renderLowDistChart = () => {
  const el = lowDistChart.value
  if (!el || !lowList.value.length) return
  if (lowDistInstance) lowDistInstance.dispose()
  lowDistInstance = echarts.init(el)

  const top = [...lowList.value]
    .sort((a, b) => (b.purchasedLastMonth || 0) - (a.purchasedLastMonth || 0))
    .slice(0, 10)
  const labels = top.map(p => p.productTitle)
  const values = top.map(p => Number(p.purchasedLastMonth) || 0)

  lowDistInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        const item = top[p.dataIndex]
        return [
          item.productTitle || '',
          `月销量：${fmtNumber(item.purchasedLastMonth, 0)}`,
          `评分：${fmtNumber(item.productRating, 2)}`,
          `评论数：${fmtNumber(item.totalReviews, 0)}`
        ].join('<br/>')
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        interval: 0,
        rotate: 25,
        fontSize: 11,
        formatter: value => (value && value.length > 10 ? `${value.slice(0, 10)}...` : value)
      }
    },
    yAxis: {
      type: 'value',
      name: '月销量',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: { formatter: val => fmtNumber(val, 0) }
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: '#E6A23C' },
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          formatter: val => fmtNumber(val.data, 0)
        }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 80 }
  })
}

// 图表3：机会商品标签结构（券 / 广告 / Best）
const renderHighScatterChart = () => {
  const el = highScatterChart.value
  if (!el || !highList.value.length) return
  if (highScatterInstance) highScatterInstance.dispose()
  highScatterInstance = echarts.init(el)

  const stat = {
    best: 0,
    coupon: 0,
    ad: 0,
    other: 0
  }
  highList.value.forEach(p => {
    let counted = false
    if (p.isBestSeller) {
      stat.best++
      counted = true
    }
    if (p.hasCoupon) {
      stat.coupon++
      counted = true
    }
    if (p.isSponsored) {
      stat.ad++
      counted = true
    }
    if (!counted) {
      stat.other++
    }
  })

  const pieData = [
    { name: 'Best Seller 机会', value: stat.best },
    { name: '带券机会', value: stat.coupon },
    { name: '广告机会', value: stat.ad },
    { name: '其他机会', value: stat.other }
  ].filter(i => i.value > 0)

  if (!pieData.length) return

  highScatterInstance.setOption({
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

// 图表4：异常商品散点图
const renderLowScatterChart = () => {
  const el = lowScatterChart.value
  if (!el || !lowList.value.length) return
  if (lowScatterInstance) lowScatterInstance.dispose()
  lowScatterInstance = echarts.init(el)

  const data = lowList.value.map(p => ({
    value: [Number(p.productRating) || 0, Number(p.purchasedLastMonth) || 0],
    name: p.productTitle,
    reviews: Number(p.totalReviews) || 0
  }))

  lowScatterInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: params => {
        const d = params.data
        return [
          d.name || '',
          `评分：${fmtNumber(d.value[0], 2)}`,
          `月销量：${fmtNumber(d.value[1], 0)}`,
          `评论数：${d.reviews}`
        ].join('<br/>')
      }
    },
    xAxis: {
      type: 'value',
      name: '评分',
      min: 0,
      max: 5,
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: '月销量',
      nameLocation: 'middle',
      nameGap: 45
    },
    series: [
      {
        type: 'scatter',
        data: data.map(d => ({
          value: d.value,
          name: d.name,
          reviews: d.reviews,
          symbolSize: Math.max(8, Math.min(30, (d.reviews || 0) / 500)),
          itemStyle: { color: '#F56C6C', opacity: 0.75 }
        }))
      }
    ],
    grid: { left: '10%', right: '8%', top: '10%', bottom: '18%', containLabel: true }
  })
}

const renderCharts = () => {
  disposeCharts()
  renderHighDistChart()
  renderLowDistChart()
  renderHighScatterChart()
  renderLowScatterChart()
}

const loadData = async () => {
  loading.value = true
  try {
    const [high, low] = await Promise.all([
      ratingApi.getHighRatingLowSales({}),
      ratingApi.getLowRatingHighSales({})
    ])
    highList.value = high || []
    lowList.value = low || []
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error(e)
    ElMessage.error('加载机会与异常数据失败')
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
.chart {
  width: 100%;
  height: 320px;
}
</style>