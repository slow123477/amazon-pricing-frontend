<template>
  <div class="page">
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>品类洞察</span>
          <el-space :size="12">
            <el-select
              v-model="selectedCategory"
              placeholder="选择分类"
              clearable
              style="width: 200px"
              @change="loadData"
            >
              <el-option
                v-for="cat in categoryOptions"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>
            <el-button type="primary" :loading="loading" @click="loadData">刷新</el-button>
          </el-space>
        </div>
      </template>
      <el-row :gutter="12" class="stat-row">
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
          <template #header>分类指标（dm_category_stats）</template>
          <el-table :data="categoryStatsTable" height="360px" v-loading="loading">
            <el-table-column prop="productCategory" label="分类" min-width="140" />
            <el-table-column prop="productCount" label="商品数" width="100" />
            <el-table-column prop="avgOriginalPrice" label="均原价" width="100" />
            <el-table-column prop="avgDiscountedPrice" label="均折后价" width="100" />
            <el-table-column prop="avgDiscountPct" label="均折扣(%)" width="110" />
            <el-table-column prop="avgMonthlySales" label="均销量" width="110" />
            <el-table-column prop="avgRating" label="均评分" width="90" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="section-card">
          <template #header>分类相关性（评分-销量/价格）</template>
          <el-table :data="ratingCorrelation" height="360px" v-loading="loading">
            <el-table-column prop="productCategory" label="分类" min-width="140" />
            <el-table-column prop="corrRatingSales" label="评分-销量相关" width="140">
              <template #default="scope">{{ formatNumber(scope.row.corrRatingSales, 3) }}</template>
            </el-table-column>
            <el-table-column prop="corrRatingPrice" label="评分-价格相关" width="140">
              <template #default="scope">{{ formatNumber(scope.row.corrRatingPrice, 3) }}</template>
            </el-table-column>
            <el-table-column prop="avgRating" label="均评分" width="90">
              <template #default="scope">{{ formatNumber(scope.row.avgRating) }}</template>
            </el-table-column>
            <el-table-column prop="avgMonthlySales" label="均销量" width="110">
              <template #default="scope">{{ formatNumber(scope.row.avgMonthlySales) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { categoryApi } from '@/api/category'
import { salesApi } from '@/api/sales'
import { ratingApi } from '@/api/rating'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const categoryOptions = ref([])
const selectedCategory = ref('')
const categoryStats = ref([])
const salesCategoryStats = ref([])
const ratingCorrelation = ref([])

const categoryStatsTable = computed(() => {
  if (!selectedCategory.value) return categoryStats.value
  return categoryStats.value.filter(i => i.productCategory === selectedCategory.value)
})

const statCards = computed(() => {
  const cs = categoryStats.value.find(i => i.productCategory === selectedCategory.value)
  if (!cs) return []
  return [
    { label: '商品数', value: cs.productCount ?? '--' },
    { label: '均折后价', value: fmt(cs.avgDiscountedPrice) },
    { label: '均销量', value: fmt(cs.avgMonthlySales) },
    { label: '均评分', value: fmt(cs.avgRating) }
  ]
})

const fmt = v => (v === null || v === undefined ? '--' : Number(v).toFixed(2))
const formatNumber = (v, digits = 2) => (v === null || v === undefined ? '--' : Number(v).toFixed(digits))

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
    if (!categoryOptions.value.length && catStats) {
      categoryOptions.value = Array.from(new Set(catStats.map(i => i.productCategory))).filter(Boolean)
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载品类洞察数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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


