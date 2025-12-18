<template>
  <div class="prediction-records">
    <el-card shadow="hover" class="intro-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 决策中心 · 预测记录</span>
        </div>
      </template>
      <div class="card-subtitle">
        查看你在决策中心中提交的预测记录；管理员可查看全部用户记录。
      </div>
    </el-card>

    <el-card shadow="hover" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span><el-icon><Search /></el-icon> 筛选条件</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品分类">
          <el-input
            v-model="searchForm.category"
            placeholder="请输入或留空"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">清空</el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="records"
        v-loading="loading"
        stripe
        style="width: 100%; margin-top: 10px"
      >
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column v-if="isAdmin" prop="username" label="用户" width="120" />
        <el-table-column prop="productName" label="商品名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column prop="price" label="商品价格" width="120">
          <template #default="{ row }">
            ${{ toFixed(row.price, 2) }}
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣(%)" width="110">
          <template #default="{ row }">
            {{ toFixed(row.discount, 2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="hasCoupon" label="优惠券" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.hasCoupon" type="success" size="small">
              {{ toFixed(row.couponPct, 2) }}%
            </el-tag>
            <el-tag v-else type="info" size="small">未启用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hasAds" label="广告" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.hasAds" type="warning" size="small">
              {{ toFixed(row.adBudgetPct, 2) }}%
            </el-tag>
            <el-tag v-else type="info" size="small">未投放</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="predictedSales" label="预测销量" width="120">
          <template #default="{ row }">
            {{ toFixed(row.predictedSales, 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="predictedRevenue" label="预测收益" width="140">
          <template #default="{ row }">
            ${{ toFixed(row.predictedRevenue, 2) }}
          </template>
        </el-table-column>
        <el-table-column prop="priceGapPct" label="价格偏差(%)" width="140">
          <template #default="{ row }">
            {{ toFixed(row.priceGapPct, 2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="diagnosisLabel" label="诊断结果" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.diagnosisLabel" size="small" :type="getDiagnosisTagType(row.diagnosisLabel)">
              {{ row.diagnosisLabel }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="prev, pager, next, jumper, ->, total"
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Document, Search } from '@element-plus/icons-vue'
import { decisionApi } from '@/api/decision'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const searchForm = ref({
  category: ''
})

const userStore = useUserStore()
const role = computed(() => userStore.role)
const isAdmin = computed(() => role.value === 'ADMIN')

const loading = ref(false)
const records = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchRecords = async () => {
  loading.value = true
  try {
    const res = await decisionApi.listRecords({
      category: searchForm.value.category || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    // 后端 Result.success(data) 包装了一层
    const data = res?.data || res
    records.value = data.list || []
    total.value = data.total || 0
    pageNum.value = data.pageNum || pageNum.value
    pageSize.value = data.pageSize || pageSize.value
  } catch (e) {
    console.error('加载预测记录失败', e)
    ElMessage.error('加载预测记录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchRecords()
}

const resetSearch = () => {
  searchForm.value.category = ''
  pageNum.value = 1
  fetchRecords()
}

const handlePageChange = (page) => {
  pageNum.value = page
  fetchRecords()
}

const toFixed = (value, digits = 2) => {
  if (value == null || isNaN(Number(value))) return (0).toFixed(digits)
  return Number(value).toFixed(digits)
}

const formatDate = (value) => {
  if (!value) return ''
  try {
    // 兼容后端返回的 "2025-12-18 15:58:36" 或 ISO 字符串
    const v = typeof value === 'string' ? value.replace(' ', 'T') : value
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return value
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch {
    return value
  }
}

const getDiagnosisTagType = (label) => {
  if (!label) return 'info'
  if (label.includes('偏高')) return 'danger'
  if (label.includes('偏低')) return 'warning'
  if (label.includes('合理')) return 'success'
  return 'info'
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.prediction-records {
  padding: 0;
}

.card-header {
  font-weight: 600;
}

.card-subtitle {
  font-size: 13px;
  color: #909399;
}

.search-form {
  margin-top: 10px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>


