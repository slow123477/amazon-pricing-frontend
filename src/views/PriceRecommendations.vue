<template>
  <div class="price-recommendations">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 价格推荐列表</span>
        </div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="全部分类" clearable style="width: 150px">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRecommendations">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">清空</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recommendations" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="productTitle" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="productCategory" label="分类" width="120" />
        <el-table-column prop="actualPrice" label="实际价格" width="120">
          <template #default="{ row }">
            ${{ row.actualPrice?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="predictedPrice" label="预测价格" width="120">
          <template #default="{ row }">
            ${{ row.predictedPrice?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断结果" width="120">
          <template #default="{ row }">
            <el-tag :type="getDiagnosisTagType(row.diagnosis)" size="small">
              {{ row.diagnosis }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" label="优化建议" min-width="200" show-overflow-tooltip />
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadRecommendations"
        @current-change="loadRecommendations"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryApi } from '@/api/category'
import { priceApi } from '@/api/price'
import { ElMessage } from 'element-plus'

const searchForm = ref({
  keyword: '',
  category: ''
})

const recommendations = ref([])
const categories = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    categories.value = data.map(item => item.productCategory)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载价格推荐列表
const loadRecommendations = async () => {
  loading.value = true
  try {
    const params = {
      category: searchForm.value.category || undefined,
      keyword: searchForm.value.keyword || undefined,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    const data = await priceApi.getRecommendations(params)
    recommendations.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('加载推荐列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索表单
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    category: ''
  }
  currentPage.value = 1
  loadRecommendations()
}

// 获取诊断结果的标签类型
const getDiagnosisTagType = (diagnosis) => {
  if (diagnosis?.includes('偏高')) return 'danger'
  if (diagnosis?.includes('偏低')) return 'warning'
  return 'success'
}

onMounted(() => {
  loadCategories()
  loadRecommendations()
})
</script>

<style scoped>
.price-recommendations {
  padding: 0;
}

.card-header {
  font-weight: 600;
}

.search-form {
  margin-bottom: 20px;
}
</style>

