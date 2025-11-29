<template>
  <div class="price-diagnosis">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Search /></el-icon> 实时价格诊断</span>
        </div>
      </template>
      <el-form :model="diagnosisForm" label-width="120px" class="diagnosis-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="选择商品分类">
              <el-select v-model="diagnosisForm.category" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="cat in categories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="输入商品价格">
              <el-input-number
                v-model="diagnosisForm.price"
                :precision="2"
                :min="0"
                placeholder="请输入价格"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-button type="primary" @click="handleDiagnosis" :disabled="!diagnosisForm.category || !diagnosisForm.price">
                <el-icon><Search /></el-icon> 开始诊断
              </el-button>
              <el-button @click="resetDiagnosis">清空</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 诊断结果 -->
      <el-card v-if="diagnosisResult" shadow="never" class="result-card">
        <template #header>
          <span class="result-title">诊断结果</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="分类">{{ diagnosisResult.category }}</el-descriptions-item>
          <el-descriptions-item label="平均定价">
            <span style="color: #409EFF; font-weight: 600">¥{{ diagnosisResult.avgPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前商品价格">
            <span style="color: #E6A23C; font-weight: 600">¥{{ diagnosisResult.currentPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="系统诊断">
            <el-tag :type="getDiagnosisTagType(diagnosisResult.diagnosis)">
              {{ diagnosisResult.diagnosis }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优化建议" :span="2">
            <span style="color: #606266">{{ diagnosisResult.suggestion }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="预计效果" :span="2" v-if="diagnosisResult.salesImpact">
            <span style="color: #67C23A; font-weight: 600">{{ diagnosisResult.salesImpact }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { categoryApi } from '@/api/category'
import { priceApi } from '@/api/price'
import { ElMessage } from 'element-plus'

const diagnosisForm = ref({
  category: '',
  price: null
})
const diagnosisResult = ref(null)
const categories = ref([])

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    categories.value = data.map(item => item.productCategory)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 处理实时价格诊断
const handleDiagnosis = async () => {
  if (!diagnosisForm.value.category || !diagnosisForm.value.price) {
    ElMessage.warning('请选择分类并输入价格')
    return
  }
  
  try {
    const result = await priceApi.diagnosePrice({
      category: diagnosisForm.value.category,
      currentPrice: diagnosisForm.value.price
    })
    diagnosisResult.value = result
    ElMessage.success('诊断完成')
  } catch (error) {
    console.error('价格诊断失败:', error)
    ElMessage.error('诊断失败，请检查输入是否正确')
  }
}

// 重置诊断表单
const resetDiagnosis = () => {
  diagnosisForm.value = {
    category: '',
    price: null
  }
  diagnosisResult.value = null
}

// 获取诊断结果的标签类型
const getDiagnosisTagType = (diagnosis) => {
  if (diagnosis?.includes('偏高')) return 'danger'
  if (diagnosis?.includes('偏低')) return 'warning'
  return 'success'
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.price-diagnosis {
  padding: 0;
}

.card-header {
  font-weight: 600;
}

.diagnosis-form {
  margin-bottom: 20px;
}

.result-card {
  margin-top: 20px;
  background-color: #f5f7fa;
}

.result-title {
  font-weight: 600;
  color: #303133;
}
</style>

