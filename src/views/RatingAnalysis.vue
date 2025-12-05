<template>
  <div class="page rating-analysis">
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>评分分析概览</span>
          <el-space :size="12">
            <el-select
              v-model="selectedCategory"
              placeholder="按分类筛选高评分商品"
              clearable
              style="width: 220px"
              @change="loadTopProducts"
            >
              <el-option
                key=""
                label="全部分类"
                value=""
              />
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
            <template #header>评分分布</template>
            <div ref="distributionChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card shadow="never" class="inner-card">
            <template #header>评分-销量关系</template>
            <div ref="salesChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card shadow="never" class="inner-card">
            <template #header>评分-价格关系</template>
            <div ref="priceChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>高评分商品 TOP50（按评分、评论数排序）</span>
        </div>
      </template>
      <el-table :data="pagedTopProducts" height="520px" v-loading="loadingTop">
        <el-table-column label="#" width="60">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="productTitle" label="商品" min-width="200" show-overflow-tooltip />
        <el-table-column prop="rank" label="原始排名" width="90" />
        <el-table-column prop="productCategory" label="分类" width="140" show-overflow-tooltip />
        <el-table-column prop="productRating" label="评分" width="80" />
        <el-table-column prop="totalReviews" label="评论数" width="100" />
        <el-table-column prop="purchasedLastMonth" label="月销量" width="100" />
        <el-table-column prop="discountedPrice" label="折后价($)" width="100" />
        <el-table-column prop="discountPercentage" label="折扣(%)" width="90" />
        <el-table-column label="链接" width="90">
          <template #default="scope">
            <el-link :href="scope.row.productPageUrl" target="_blank" type="primary">查看</el-link>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          layout="prev, pager, next"
          :total="topProducts.length"
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
import { ratingApi } from '@/api/rating'
import { categoryApi } from '@/api/category'
import { ElMessage } from 'element-plus'

const distributionChart = ref(null)
const salesChart = ref(null)
const priceChart = ref(null)
let distributionInstance = null
let salesInstance = null
let priceInstance = null

const distribution = ref([])
const salesRelation = ref([])
const priceRelation = ref([])
const topProducts = ref([])
const categoryOptions = ref([])
const selectedCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const loading = ref(false)
const loadingTop = ref(false)

const filteredTopProducts = computed(() => {
  if (!selectedCategory.value) return topProducts.value
  return topProducts.value.filter(
    item => item.productCategory === selectedCategory.value
  )
})

const pagedTopProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTopProducts.value.slice(start, end)
})

const disposeCharts = () => {
  if (distributionInstance) distributionInstance.dispose()
  if (salesInstance) salesInstance.dispose()
  if (priceInstance) priceInstance.dispose()
  distributionInstance = salesInstance = priceInstance = null
}

const renderDistribution = () => {
  if (!distribution.value.length || !distributionChart.value) return
  if (distributionInstance) distributionInstance.dispose()
  distributionInstance = echarts.init(distributionChart.value)
  const xLabels = distribution.value.map(i => i.ratingBucketLabel)
  distributionInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const p = distribution.value[params[0].dataIndex]
        return [
          `评分区间：${p.ratingBucketLabel}`,
          `商品数：${p.productCount}`,
          `均价：$${(p.avgDiscountedPrice || 0).toFixed(2)}`,
          `均销量：${(p.avgMonthlySales || 0).toFixed(1)}`,
          `均评论数：${(p.avgReviews || 0).toFixed(1)}`
        ].join('<br/>')
      }
    },
    xAxis: { type: 'category', data: xLabels },
    yAxis: { type: 'value', name: '商品数' },
    series: [
      {
        name: '商品数',
        type: 'bar',
        data: distribution.value.map(i => i.productCount),
        itemStyle: { color: '#67C23A' }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 40 }
  })
}

const renderSalesRelation = () => {
  if (!salesRelation.value.length || !salesChart.value) return
  if (salesInstance) salesInstance.dispose()
  salesInstance = echarts.init(salesChart.value)
  const xLabels = salesRelation.value.map(i => i.ratingBucketLabel)
  salesInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均销量', '平均折后价'] },
    xAxis: { type: 'category', data: xLabels },
    yAxis: [
      { type: 'value', name: '销量' },
      { type: 'value', name: '折后价($)', position: 'right' }
    ],
    series: [
      {
        name: '平均销量',
        type: 'line',
        data: salesRelation.value.map(i => (i.avgMonthlySales || 0).toFixed(2)),
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '平均折后价',
        type: 'line',
        yAxisIndex: 1,
        data: salesRelation.value.map(i => (i.avgDiscountedPrice || 0).toFixed(2)),
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 40 }
  })
}

const renderPriceRelation = () => {
  if (!priceRelation.value.length || !priceChart.value) return
  if (priceInstance) priceInstance.dispose()
  priceInstance = echarts.init(priceChart.value)
  const xLabels = priceRelation.value.map(i => i.ratingBucketLabel)
  priceInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['折后价', '原价', '平均销量'] },
    xAxis: { type: 'category', data: xLabels },
    yAxis: [
      { type: 'value', name: '价格($)' },
      { type: 'value', name: '销量', position: 'right' }
    ],
    series: [
      {
        name: '折后价',
        type: 'line',
        data: priceRelation.value.map(i => (i.avgDiscountedPrice || 0).toFixed(2)),
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '原价',
        type: 'line',
        data: priceRelation.value.map(i => (i.avgOriginalPrice || 0).toFixed(2)),
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '平均销量',
        type: 'bar',
        yAxisIndex: 1,
        data: priceRelation.value.map(i => (i.avgMonthlySales || 0).toFixed(2)),
        itemStyle: { color: '#409EFF', opacity: 0.5 }
      }
    ],
    grid: { left: 60, right: 60, top: 40, bottom: 40 }
  })
}

const renderCharts = () => {
  renderDistribution()
  renderSalesRelation()
  renderPriceRelation()
}

const loadDistribution = () => ratingApi.getDistribution().then(res => { distribution.value = res || [] })
const loadSalesRelation = () => ratingApi.getSalesRelation().then(res => { salesRelation.value = res || [] })
const loadPriceRelation = () => ratingApi.getPriceRelation().then(res => { priceRelation.value = res || [] })

const loadTopProducts = async () => {
  loadingTop.value = true
  try {
    const res = await ratingApi.getTopProducts({
      category: selectedCategory.value || undefined
    })
    topProducts.value = res || []
    const cats = Array.from(new Set((res || []).map(i => i.productCategory))).filter(Boolean)
    if (!categoryOptions.value.length && cats.length) {
      categoryOptions.value = cats
    }
    currentPage.value = 1
  } catch (e) {
    console.error(e)
    ElMessage.error('加载高评分商品失败')
  } finally {
    loadingTop.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadDistribution(), loadSalesRelation(), loadPriceRelation(), loadCategories()])
    await nextTick()
    renderCharts()
    await loadTopProducts()
    ElMessage.success('评分分析数据已更新')
  } catch (e) {
    console.error(e)
    ElMessage.error('加载评分分析数据失败')
  } finally {
    loading.value = false
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

