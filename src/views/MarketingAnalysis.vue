<template>
  <div class="page marketing-analysis">
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>营销策略效果对比</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { marketingApi } from '@/api/marketing'
import { ElMessage } from 'element-plus'

const discountChart = ref(null)
const flagChart = ref(null)
let discountInstance = null
let flagInstance = null

const discountEffect = ref([])
const sponsoredEffect = ref([])
const couponEffect = ref([])
const buyboxEffect = ref([])

const loading = ref(false)

const disposeCharts = () => {
  if (discountInstance) discountInstance.dispose()
  if (flagInstance) flagInstance.dispose()
  discountInstance = flagInstance = null
}

const renderDiscountChart = () => {
  if (!discountEffect.value.length || !discountChart.value) return
  if (discountInstance) discountInstance.dispose()
  discountInstance = echarts.init(discountChart.value)
  const labels = discountEffect.value.map(i => i.flag || i.discountBucket || i.discount_bucket)
  discountInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['销量', '折后价', '原价', '评分'] },
    xAxis: { type: 'category', data: labels },
    yAxis: [
      { type: 'value', name: '销量' },
      { type: 'value', name: '价格/评分', position: 'right' }
    ],
    series: [
      { name: '销量', type: 'bar', data: discountEffect.value.map(i => i.avgSales || 0), itemStyle: { color: '#409EFF' } },
      { name: '折后价', type: 'line', yAxisIndex: 1, data: discountEffect.value.map(i => (i.avgDiscountedPrice || 0).toFixed(2)), smooth: true, itemStyle: { color: '#67C23A' } },
      { name: '原价', type: 'line', yAxisIndex: 1, data: discountEffect.value.map(i => (i.avgOriginalPrice || 0).toFixed(2)), smooth: true, itemStyle: { color: '#F56C6C' } },
      { name: '评分', type: 'line', yAxisIndex: 1, data: discountEffect.value.map(i => (i.avgRating || 0).toFixed(2)), smooth: true, itemStyle: { color: '#E6A23C' } }
    ],
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
    tooltip: { trigger: 'axis' },
    legend: { data: datasets.map(d => d.name) },
    xAxis: { type: 'category', data: xLabels },
    yAxis: { type: 'value' },
    series,
    grid: { left: 60, right: 20, top: 40, bottom: 40 }
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
  window.addEventListener('resize', () => {
    renderDiscountChart()
    renderFlagChart()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => {
    renderDiscountChart()
    renderFlagChart()
  })
  disposeCharts()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-card {
  width: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.inner-card {
  margin-bottom: 12px;
}
.chart {
  width: 100%;
  height: 360px;
}
</style>

