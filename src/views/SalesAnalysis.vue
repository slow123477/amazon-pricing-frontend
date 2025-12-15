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

    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>销量分析概览</span>
          <el-button type="primary" :loading="loading" @click="loadAll">
            重新加载
          </el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card shadow="never" class="inner-card">
            <template #header>分类销量统计</template>
            <div ref="categoryChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card shadow="never" class="inner-card">
            <template #header>销量影响因素</template>
            <div ref="factorChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card shadow="never" class="inner-card">
            <template #header>整体销量榜 Top10</template>
            <div ref="rankingChart" class="chart"></div>
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
        <el-table-column prop="rankInCategory" label="分类内排名" width="100" />
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
        <el-table-column label="链接" width="90">
          <template #default="scope">
            <el-link :href="scope.row.productPageUrl" target="_blank" type="primary">查看</el-link>
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
let categoryInstance = null
let factorInstance = null
let rankingInstance = null

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
  categoryInstance = factorInstance = rankingInstance = null
}

const renderCategoryChart = () => {
  if (!categoryStats.value.length || !categoryChart.value) return
  if (categoryInstance) categoryInstance.dispose()
  categoryInstance = echarts.init(categoryChart.value)
  const names = categoryStats.value.map(i => i.productCategory)
  categoryInstance.setOption({
    tooltip: { trigger: 'axis' },
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
        data: categoryStats.value.map(i => (i.avgSales || 0).toFixed(2)),
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
    tooltip: { trigger: 'axis' },
    legend: { data: ['评分相关性', '折扣相关性', '评论相关性'] },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value', name: '相关系数' },
    series: [
      {
        name: '评分相关性',
        type: 'line',
        data: salesFactors.value.map(i => (i.corrSalesRating || 0).toFixed(3)),
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '折扣相关性',
        type: 'line',
        data: salesFactors.value.map(i => (i.corrSalesDiscount || 0).toFixed(3)),
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '评论相关性',
        type: 'line',
        data: salesFactors.value.map(i => (i.corrSalesReviews || 0).toFixed(3)),
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 80 }
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

