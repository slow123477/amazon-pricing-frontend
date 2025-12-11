<template>
  <div class="page">
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>异常与机会监控</span>
          <el-space :size="12">
            <el-select
              v-model="selectedCategory"
              placeholder="选择分类（可空）"
              clearable
              style="width: 220px"
              @change="loadData"
            >
              <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
            </el-select>
            <el-button type="primary" :loading="loading" @click="loadData">刷新</el-button>
          </el-space>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="inner-card">
            <template #header>高评分低销量机会榜</template>
            <el-table :data="highList" height="360px" v-loading="loading">
              <el-table-column prop="productTitle" label="商品" min-width="200" show-overflow-tooltip />
              <el-table-column prop="productRating" label="评分" width="80" />
              <el-table-column prop="purchasedLastMonth" label="月销量" width="90" />
              <el-table-column prop="totalReviews" label="评论" width="90" />
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
              <el-table-column prop="productTitle" label="商品" min-width="200" show-overflow-tooltip />
              <el-table-column prop="productRating" label="评分" width="80" />
              <el-table-column prop="purchasedLastMonth" label="月销量" width="90" />
              <el-table-column prop="totalReviews" label="评论" width="90" />
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
import { ref, onMounted } from 'vue'
import { categoryApi } from '@/api/category'
import { ratingApi } from '@/api/rating'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const categoryOptions = ref([])
const selectedCategory = ref('')
const highList = ref([])
const lowList = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const params = { category: selectedCategory.value || undefined }
    const [high, low] = await Promise.all([
      ratingApi.getHighRatingLowSales(params),
      ratingApi.getLowRatingHighSales(params)
    ])
    highList.value = high || []
    lowList.value = low || []
  } catch (e) {
    console.error(e)
    ElMessage.error('加载机会榜失败')
  } finally {
    loading.value = false
  }
}

const initCategories = async () => {
  try {
    const cats = await categoryApi.getCategoryStats()
    categoryOptions.value = (cats || []).map(i => i.productCategory)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  initCategories()
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
.section-card {
  width: 100%;
}
.inner-card {
  margin-bottom: 8px;
}
</style>


