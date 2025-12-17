<template>
  <div class="page marketing-analysis">
    <!-- 顶部关键指标卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">最佳折扣区间</div>
            <div class="stat-value primary">
              {{ stats.bestDiscountBucket || '--' }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">广告带来的销量提升</div>
            <div class="stat-value success">
              {{ formatPercent(stats.sponsoredLift) }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">优惠券带来的销量提升</div>
            <div class="stat-value warning">
              {{ formatPercent(stats.couponLift) }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">BuyBox 带来的销量提升</div>
            <div class="stat-value danger">
              {{ formatPercent(stats.buyboxLift) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第一块：折扣与标记效果对比（两张图） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">营销策略效果对比</span>
          <el-button type="primary" :loading="loading" @click="loadAll">重新加载</el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>折扣 vs 销量/价格/评分</template>
            <div ref="discountChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>广告/优惠券/BuyBox 对比</template>
            <div ref="flagChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 第二块：营销覆盖率 & 提升效果分析 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="chart-title">营销覆盖率与效果结构</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>营销手段覆盖商品占比</template>
            <div ref="coverageChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>广告/优惠券/BuyBox 提升对比</template>
            <div ref="liftChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { marketingApi } from '@/api/marketing'
import { ElMessage } from 'element-plus'

const discountChart = ref(null)
const flagChart = ref(null)
const coverageChart = ref(null)
const liftChart = ref(null)
let discountInstance = null
let flagInstance = null
let coverageInstance = null
let liftInstance = null

const discountEffect = ref([])
const sponsoredEffect = ref([])
const couponEffect = ref([])
const buyboxEffect = ref([])

const loading = ref(false)

// 顶部统计指标
const stats = ref({
  bestDiscountBucket: null,
  bestDiscountAvgSales: null,
  sponsoredLift: null,
  couponLift: null,
  buyboxLift: null
})

const disposeCharts = () => {
  if (discountInstance) discountInstance.dispose()
  if (flagInstance) flagInstance.dispose()
  if (coverageInstance) coverageInstance.dispose()
  if (liftInstance) liftInstance.dispose()
  discountInstance = flagInstance = coverageInstance = liftInstance = null
}

const renderDiscountChart = () => {
  if (!discountEffect.value.length || !discountChart.value) return
  if (discountInstance) discountInstance.dispose()
  discountInstance = echarts.init(discountChart.value)
  const labels = discountEffect.value.map(i => i.flag || i.discountBucket || i.discount_bucket)
  discountInstance.setOption({
    legend: { data: ['销量', '折后价', '原价', '评分'] },
    xAxis: { type: 'category', data: labels },
    yAxis: [
      { type: 'value', name: '销量' },
      { type: 'value', name: '价格/评分', position: 'right' }
    ],
    series: [
      { name: '销量', type: 'bar', data: discountEffect.value.map(i => i.avgSales || 0), itemStyle: { color: '#409EFF' } },
      { name: '折后价', type: 'line', yAxisIndex: 1, data: discountEffect.value.map(i => i.avgDiscountedPrice || 0), smooth: true, itemStyle: { color: '#67C23A' } },
      { name: '原价', type: 'line', yAxisIndex: 1, data: discountEffect.value.map(i => i.avgOriginalPrice || 0), smooth: true, itemStyle: { color: '#F56C6C' } },
      { name: '评分', type: 'line', yAxisIndex: 1, data: discountEffect.value.map(i => i.avgRating || 0), smooth: true, itemStyle: { color: '#E6A23C' } }
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          const value = param.value || 0
          if (param.seriesName === '销量') {
            result += `${param.seriesName}: ${value.toFixed(0)}<br/>`
          } else if (param.seriesName === '折后价' || param.seriesName === '原价') {
            result += `${param.seriesName}: $${value.toFixed(2)}<br/>`
          } else {
            result += `${param.seriesName}: ${value.toFixed(2)}<br/>`
          }
        })
        return result
      }
    },
    grid: { left: 60, right: 60, top: 40, bottom: 60 }
  })
}

const renderFlagChart = () => {
  if (!flagChart.value) return
  if (flagInstance) flagInstance.dispose()
  flagInstance = echarts.init(flagChart.value)

  const datasets = [
    { name: '广告', data: sponsoredEffect.value },
    { name: '优惠券', data: couponEffect.value },
    { name: 'BuyBox', data: buyboxEffect.value }
  ].filter(d => d.data && d.data.length)

  const xLabels = ['平均销量', '折后价', '原价', '评分']
  const series = datasets.map(d => ({
    name: d.name,
    type: 'bar',
    data: [
      d.data[0]?.avgSales || 0,
      d.data[0]?.avgDiscountedPrice || 0,
      d.data[0]?.avgOriginalPrice || 0,
      d.data[0]?.avgRating || 0
    ]
  }))

  flagInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          const value = param.value || 0
          const seriesName = param.seriesName
          if (param.axisValue === '平均销量') {
            result += `${seriesName}: ${value.toFixed(0)}<br/>`
          } else if (param.axisValue === '折后价' || param.axisValue === '原价') {
            result += `${seriesName}: $${value.toFixed(2)}<br/>`
          } else {
            result += `${seriesName}: ${value.toFixed(2)}<br/>`
          }
        })
        return result
      }
    },
    legend: { data: datasets.map(d => d.name) },
    xAxis: { type: 'category', data: xLabels },
    yAxis: { type: 'value' },
    series,
    grid: { left: 60, right: 20, top: 40, bottom: 40 }
  })
}

// 营销手段覆盖率饼图
const renderCoverageChart = () => {
  if (!coverageChart.value) return
  if (coverageInstance) coverageInstance.dispose()
  coverageInstance = echarts.init(coverageChart.value)

  const findTrueRow = (list, trueLabel) => list.find(i => i.flag === trueLabel)
  const sponsoredTrue = findTrueRow(sponsoredEffect.value, 'Sponsored')
  const couponTrue = findTrueRow(couponEffect.value, 'Coupon')
  const buyboxTrue = findTrueRow(buyboxEffect.value, 'BuyBox-Yes')

  const pieData = [
    { name: '有广告商品数', value: sponsoredTrue?.productCount || 0 },
    { name: '有优惠券商品数', value: couponTrue?.productCount || 0 },
    { name: '有 BuyBox 商品数', value: buyboxTrue?.productCount || 0 }
  ]

  coverageInstance.setOption({
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
        name: '营销覆盖率',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: pieData,
        label: { formatter: '{b}\n{d}%' },
        labelLine: { length: 10, length2: 8 }
      }
    ]
  })
}

// 提升效果雷达图
const renderLiftChart = () => {
  if (!liftChart.value) return
  if (liftInstance) liftInstance.dispose()
  liftInstance = echarts.init(liftChart.value)

  const lifts = [
    (stats.value.sponsoredLift || 0) * 100,
    (stats.value.couponLift || 0) * 100,
    (stats.value.buyboxLift || 0) * 100
  ]

  // 动态计算最大值：取实际数据的最大值，然后向上取整到最近的10的倍数，再乘以1.2倍，确保图表显示饱满
  const maxLift = Math.max(...lifts.filter(v => v > 0), 0)
  const maxValue = maxLift > 0 ? Math.ceil(maxLift / 10) * 10 * 1.2 : 100
  // 确保最小值至少为50，避免数据很小但max太大导致显示范围过小
  const finalMax = Math.max(maxValue, Math.max(...lifts) * 1.3, 50)

  liftInstance.setOption({
    tooltip: {
      formatter: params => {
        const val = params.value
        return [
          `广告提升：${val[0].toFixed(2)}%`,
          `优惠券提升：${val[1].toFixed(2)}%`,
          `BuyBox 提升：${val[2].toFixed(2)}%`
        ].join('<br/>')
      }
    },
    radar: {
      indicator: [
        { name: '广告提升', max: finalMax },
        { name: '优惠券提升', max: finalMax },
        { name: 'BuyBox 提升', max: finalMax }
      ],
      radius: '60%'
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: lifts,
            name: '销量提升(%)'
          }
        ]
      }
    ]
  })
}

const loadAll = async () => {
  loading.value = true
  try {
    const [discountRes, sponsoredRes, couponRes, buyboxRes] = await Promise.all([
      marketingApi.getDiscountEffect(),
      marketingApi.getSponsoredEffect(),
      marketingApi.getCouponEffect(),
      marketingApi.getBuyboxEffect()
    ])
    discountEffect.value = discountRes || []
    sponsoredEffect.value = sponsoredRes || []
    couponEffect.value = couponRes || []
    buyboxEffect.value = buyboxRes || []

    await nextTick()
    renderDiscountChart()
    renderFlagChart()
    calculateStats()
    renderCoverageChart()
    renderLiftChart()
    ElMessage.success('营销分析数据已更新')
  } catch (e) {
    console.error(e)
    ElMessage.error('加载营销分析数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAll()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
})

// 计算顶部指标
const calculateStats = () => {
  // 最佳折扣区间（按平均销量）
  if (discountEffect.value && discountEffect.value.length) {
    let best = discountEffect.value[0]
    discountEffect.value.forEach(item => {
      if ((item.avgSales || 0) > (best.avgSales || 0)) best = item
    })
    stats.value.bestDiscountBucket =
      best.discountBucket || best.discount_bucket || best.flag || '--'
    stats.value.bestDiscountAvgSales = best.avgSales || 0
  }

  // 通用提升计算函数
  const calcLift = (list, trueLabel) => {
    if (!list || list.length < 2) return null
    const trueRow = list.find(i => i.flag === trueLabel)
    const falseRow = list.find(i => i.flag !== trueLabel)
    if (!trueRow || !falseRow) return null
    const base = falseRow.avgSales || 0
    const withFlag = trueRow.avgSales || 0
    if (!base) return null
    return (withFlag - base) / base
  }

  stats.value.sponsoredLift = calcLift(sponsoredEffect.value, 'Sponsored')
  stats.value.couponLift = calcLift(couponEffect.value, 'Coupon')
  stats.value.buyboxLift = calcLift(buyboxEffect.value, 'BuyBox-Yes')
}

// 数值/百分比格式化
const formatNumber = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  return Number(val).toFixed(0)
}

const formatPercent = val => {
  if (val === null || val === undefined || Number.isNaN(val)) {
    // 没有对比样本时，展示为 0.0%，避免出现空白
    return '0.0%'
  }
  return (Number(val) * 100).toFixed(1) + '%'
}

// 统一的 resize 处理
const handleResize = () => {
  renderDiscountChart()
  renderFlagChart()
  renderCoverageChart()
  renderLiftChart()
}
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
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
}
.stat-value.primary {
  color: #409eff;
}
.stat-value.success {
  color: #67c23a;
}
.stat-value.warning {
  color: #e6a23c;
}
.stat-value.danger {
  color: #f56c6c;
}
.chart {
  width: 100%;
  height: 360px;
}
</style>

