<template>
  <div class="page">
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>竞品对标 / 商品体检</span>
          <el-space :size="12">
            <el-select
              v-model="selectedCategory"
              placeholder="选择分类"
              clearable
              style="width: 220px"
              @change="loadAll"
            >
              <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
            </el-select>
            <el-button type="primary" :loading="loading" @click="loadAll">刷新</el-button>
          </el-space>
        </div>
      </template>
      <el-row :gutter="12" class="stat-row" v-if="overview">
        <el-col :xs="12" :sm="6" v-for="card in statCards" :key="card.label">
          <el-card shadow="never" class="mini-card">
            <div class="mini-label">{{ card.label }}</div>
            <div class="mini-value">{{ card.value }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card">
          <template #header>同类 TOP 评分商品</template>
          <el-table :data="topRated" height="360px" v-loading="loading">
            <el-table-column prop="productTitle" label="商品" min-width="200" show-overflow-tooltip />
            <el-table-column prop="productRating" label="评分" width="80" />
            <el-table-column prop="totalReviews" label="评论" width="90" />
            <el-table-column prop="purchasedLastMonth" label="月销量" width="90" />
            <el-table-column prop="discountedPrice" label="折后价" width="90" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card">
          <template #header>同类 TOP 销量商品</template>
          <el-table :data="topSales" height="360px" v-loading="loading">
            <el-table-column prop="productTitle" label="商品" min-width="200" show-overflow-tooltip />
            <el-table-column prop="purchasedLastMonth" label="月销量" width="90" />
            <el-table-column prop="productRating" label="评分" width="80" />
            <el-table-column prop="discountedPrice" label="折后价" width="90" />
            <el-table-column prop="totalReviews" label="评论" width="90" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { categoryApi } from '@/api/category'
import { benchmarkApi } from '@/api/benchmark'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const categoryOptions = ref([])
const selectedCategory = ref('')
const overview = ref(null)
const topRated = ref([])
const topSales = ref([])

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

const loadAll = async () => {
  if (!selectedCategory.value) return
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
  } catch (e) {
    console.error(e)
    ElMessage.error('加载对标数据失败')
  } finally {
    loading.value = false
  }
}

const initCategories = async () => {
  try {
    const cats = await categoryApi.getCategoryStats()
    categoryOptions.value = (cats || []).map(i => i.productCategory)
    if (!selectedCategory.value && categoryOptions.value.length) {
      selectedCategory.value = categoryOptions.value[0]
      loadAll()
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  initCategories()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-row {
  margin-top: 12px;
}
.mini-card {
  text-align: center;
  padding: 12px 8px;
}
.mini-label {
  color: #666;
  font-size: 13px;
}
.mini-value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 6px;
}
.section-card {
  width: 100%;
}
</style>


