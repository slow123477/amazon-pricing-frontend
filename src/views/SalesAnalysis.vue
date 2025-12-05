<template>
  <div class="page sales-analysis">
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>销量分析概览</span>
          <el-space :size="12">
            <el-select
              v-model="selectedCategory"
              placeholder="按分类筛选畅销榜"
              clearable
              style="width: 220px"
              @change="handleCategoryChange"
            >
              <el-option key="" label="全部分类" value="" />
              <el-option
                v-for="cat in categoryOptions"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>
            <el-button type="primary" :loading="loading" @click="loadAll">
              重新加载
            </el-button>
          </el-space>
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
          :total="filteredBestSellers.length"
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
import { categoryApi } from '@/api/category'
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
const categoryOptions = ref([])
const selectedCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const loading = ref(false)
const loadingBest = ref(false)

const filteredBestSellers = computed(() => {
  if (!selectedCategory.value) return bestSellers.value
  return bestSellers.value.filter(
    item => item.productCategory === selectedCategory.value
  )
})

const pagedBestSellers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBestSellers.value.slice(start, end)
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
    const res = await salesApi.getBestSellers({
      category: selectedCategory.value || undefined
    })
    bestSellers.value = res || []
    const cats = Array.from(new Set((res || []).map(i => i.productCategory))).filter(Boolean)
    if (!categoryOptions.value.length && cats.length) {
      categoryOptions.value = cats
    }
    currentPage.value = 1
  } catch (e) {
    console.error(e)
    ElMessage.error('加载畅销商品失败')
  } finally {
    loadingBest.value = false
  }
}

const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    if (data && Array.isArray(data)) {
      categoryOptions.value = data.map(item => item.productCategory)
    }
  } catch (e) {
    console.error(e)
  }
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

const handleCategoryChange = async () => {
  await loadBestSellers()
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
  height: 320px;
}
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
</style>

