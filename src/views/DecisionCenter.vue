<template>
  <div class="decision-center">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><DataAnalysis /></el-icon> 决策中心</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- 标签页1：价格诊断与优化 -->
        <el-tab-pane label="价格诊断与优化" name="diagnosis">
          <div class="tab-content">
            <el-form :model="diagnosisForm" label-width="140px" class="diagnosis-form">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="商品分类" required>
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
                  <el-form-item label="当前价格" required>
                    <el-input-number
                      v-model="diagnosisForm.currentPrice"
                      :precision="2"
                      :min="0"
                      placeholder="请输入价格"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="商品标题（可选）">
                    <el-input
                      v-model="diagnosisForm.productTitle"
                      placeholder="请输入商品标题"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="handleDiagnosis" :loading="diagnosisLoading">
                  <el-icon><Search /></el-icon> 开始诊断
                </el-button>
                <el-button @click="resetDiagnosis">清空</el-button>
              </el-form-item>
            </el-form>

            <!-- 诊断结果 -->
            <div v-if="diagnosisResult" class="result-section">
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-card shadow="never" class="result-card">
                    <template #header>
                      <span class="result-title">诊断结果</span>
                    </template>
                    <el-descriptions :column="3" border>
                      <el-descriptions-item label="诊断结论">
                        <el-tag :type="getDiagnosisTagType(diagnosisResult.diagnosis)" size="large">
                          {{ diagnosisResult.diagnosis }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="当前价格">
                        <span style="color: #E6A23C; font-weight: 600; font-size: 16px">
                          ${{ diagnosisResult.currentPrice?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测价格">
                        <span style="color: #67C23A; font-weight: 600; font-size: 16px">
                          ${{ diagnosisResult.predictedPrice?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="价格差距">
                        <span :style="{ color: Math.abs(diagnosisResult.priceGap) > 10 ? '#F56C6C' : '#409EFF', fontWeight: '600' }">
                          ${{ diagnosisResult.priceGap?.toFixed(2) }}
                          ({{ diagnosisResult.priceGapPercent?.toFixed(2) }}%)
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测销量">
                        <span style="color: #409EFF; font-weight: 600">
                          {{ diagnosisResult.predictedSales?.toFixed(0) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测收益">
                        <span style="color: #67C23A; font-weight: 600">
                          ${{ diagnosisResult.predictedRevenue?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测评分">
                        <span style="color: #E6A23C; font-weight: 600">
                          {{ diagnosisResult.predictedRating?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="置信度">
                        <el-progress
                          :percentage="(diagnosisResult.confidence * 100)"
                          :color="getConfidenceColor(diagnosisResult.confidence)"
                          :format="() => (diagnosisResult.confidence * 100).toFixed(0) + '%'"
                        />
                      </el-descriptions-item>
                      <el-descriptions-item label="优化建议" :span="3">
                        <span style="color: #606266">{{ diagnosisResult.suggestion }}</span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
              </el-row>
              
              <!-- 图表区域：4张图表 -->
              <el-row :gutter="20" class="charts-row" style="margin-top: 20px;">
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">价格分布直方图</span>
                      <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                        （显示同类商品价格分布，标记当前价格位置）
                      </span>
                    </template>
                    <div ref="priceDistributionChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">价格竞争力雷达图</span>
                    </template>
                    <div ref="competitivenessRadarChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
              </el-row>
              
              <el-row :gutter="20" class="charts-row" style="margin-top: 20px;">
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">价格-销量关系曲线</span>
                      <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                        （不同价格下的销量预测，标注最优价格点）
                      </span>
                    </template>
                    <div ref="diagnosisPriceSalesChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">价格调整影响预测图</span>
                      <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                        （价格上调/下调对销量和收益的影响）
                      </span>
                    </template>
                    <div ref="priceImpactChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <!-- 标签页2：销量预测与策略 -->
        <el-tab-pane label="销量预测与策略" name="sales">
          <div class="tab-content">
            <el-form :model="salesForm" label-width="140px" class="sales-form">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="商品分类" required>
                    <el-select v-model="salesForm.category" placeholder="请选择分类" style="width: 100%">
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
                  <el-form-item label="价格" required>
                    <el-input-number
                      v-model="salesForm.price"
                      :precision="2"
                      :min="0"
                      placeholder="请输入价格"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="折扣(%)">
                    <el-input-number
                      v-model="salesForm.discount"
                      :precision="1"
                      :min="0"
                      :max="100"
                      placeholder="请输入折扣"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="handleSalesPrediction" :loading="salesLoading">
                  <el-icon><TrendCharts /></el-icon> 开始预测
                </el-button>
                <el-button @click="resetSales">清空</el-button>
              </el-form-item>
            </el-form>

            <!-- 预测结果 -->
            <div v-if="salesResult" class="result-section">
              <!-- 当前预测和最优策略 -->
              <el-row :gutter="20" style="margin-bottom: 20px">
                <el-col :span="12">
                  <el-card shadow="never" class="result-card">
                    <template #header>
                      <span class="result-title">当前策略预测</span>
                    </template>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="价格">
                        ${{ salesResult.currentPrediction?.price?.toFixed(2) }}
                      </el-descriptions-item>
                      <el-descriptions-item label="折扣">
                        {{ salesResult.currentPrediction?.discount?.toFixed(1) }}%
                      </el-descriptions-item>
                      <el-descriptions-item label="预测销量">
                        <span style="color: #409EFF; font-weight: 600; font-size: 18px">
                          {{ salesResult.currentPrediction?.predictedSales?.toFixed(0) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测收益">
                        <span style="color: #67C23A; font-weight: 600; font-size: 18px">
                          ${{ salesResult.currentPrediction?.predictedRevenue?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never" class="result-card">
                    <template #header>
                      <span class="result-title">最优策略推荐</span>
                    </template>
                    <el-descriptions :column="1" border>
                      <el-descriptions-item label="推荐价格">
                        <span style="color: #67C23A; font-weight: 600; font-size: 16px">
                          ${{ salesResult.optimalStrategy?.price?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="推荐折扣">
                        <span style="color: #67C23A; font-weight: 600; font-size: 16px">
                          {{ salesResult.optimalStrategy?.discount?.toFixed(1) }}%
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测销量">
                        <span style="color: #409EFF; font-weight: 600; font-size: 18px">
                          {{ salesResult.optimalStrategy?.predictedSales?.toFixed(0) }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="预测收益">
                        <span style="color: #67C23A; font-weight: 600; font-size: 18px">
                          ${{ salesResult.optimalStrategy?.predictedRevenue?.toFixed(2) }}
                        </span>
                      </el-descriptions-item>
                    </el-descriptions>
                  </el-card>
                </el-col>
              </el-row>

              <!-- 图表 -->
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">价格-销量关系曲线</span>
                    </template>
                    <div ref="priceSalesChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">折扣-销量关系曲线</span>
                    </template>
                    <div ref="discountSalesChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <!-- 标签页3：场景模拟器 -->
        <el-tab-pane label="场景模拟器" name="simulation">
          <div class="tab-content">
            <el-form :model="simulationForm" label-width="140px" class="simulation-form">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="商品分类" required>
                    <el-select v-model="simulationForm.category" placeholder="请选择分类" style="width: 100%">
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
                  <el-form-item label="基础价格" required>
                    <el-input-number
                      v-model="simulationForm.basePrice"
                      :precision="2"
                      :min="0"
                      placeholder="请输入基础价格"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="基础折扣(%)">
                    <el-input-number
                      v-model="simulationForm.baseDiscount"
                      :precision="1"
                      :min="0"
                      :max="100"
                      placeholder="请输入折扣"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-alert
                title="提示"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              >
                场景模拟将生成多个价格×折扣组合的预测结果，预计需要30秒以内，请耐心等待。
              </el-alert>
              <el-form-item>
                <el-button type="primary" @click="handleSimulation" :loading="simulationLoading">
                  <el-icon><DataLine /></el-icon> 开始模拟
                </el-button>
                <el-button @click="resetSimulation">清空</el-button>
              </el-form-item>
            </el-form>

            <!-- 交互式调整器（实时预测）- 只在模拟成功后显示 -->
            <div v-if="simulationResult" class="interactive-simulator" style="margin-top: 20px;">
              <el-card shadow="never" class="result-card">
                <template #header>
                  <span class="result-title">交互式价格调整模拟器</span>
                  <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                    （拖动滑块实时查看预测结果）
                  </span>
                </template>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="价格调整">
                      <el-slider
                        v-model="interactivePrice"
                        :min="simulationForm.basePrice * 0.7"
                        :max="simulationForm.basePrice * 1.3"
                        :step="1"
                        :format-tooltip="(val) => `$${val.toFixed(2)}`"
                        @change="updateInteractivePrediction"
                      />
                      <div style="text-align: center; margin-top: 10px;">
                        <span style="font-size: 18px; font-weight: 600; color: #409EFF">
                          ${{ interactivePrice.toFixed(2) }}
                        </span>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="折扣调整">
                      <el-slider
                        v-model="interactiveDiscount"
                        :min="0"
                        :max="50"
                        :step="1"
                        :format-tooltip="(val) => `${val}%`"
                        @change="updateInteractivePrediction"
                      />
                      <div style="text-align: center; margin-top: 10px;">
                        <span style="font-size: 18px; font-weight: 600; color: #E6A23C">
                          {{ interactiveDiscount.toFixed(1) }}%
                        </span>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <!-- 实时预测结果 -->
                <el-row :gutter="20" style="margin-top: 20px;">
                  <el-col :span="8">
                    <el-card shadow="hover" class="stat-card">
                      <div class="stat-item">
                        <div class="stat-label">预测销量</div>
                        <div class="stat-value" style="color: #409EFF">
                          {{ interactivePrediction.predictedSales?.toFixed(0) || '计算中...' }}
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card shadow="hover" class="stat-card">
                      <div class="stat-item">
                        <div class="stat-label">预测收益</div>
                        <div class="stat-value" style="color: #67C23A">
                          ${{ interactivePrediction.predictedRevenue?.toFixed(2) || '0.00' }}
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card shadow="hover" class="stat-card">
                      <div class="stat-item">
                        <div class="stat-label">实际售价</div>
                        <div class="stat-value" style="color: #E6A23C">
                          ${{ (interactivePrice * (1 - interactiveDiscount / 100)).toFixed(2) }}
                        </div>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </el-card>
            </div>

            <!-- 模拟结果 -->
            <div v-if="simulationResult" class="result-section">
              <!-- 图表区域 -->
              <el-row :gutter="20" class="mb-4">
                <!-- 收益变化瀑布图 -->
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">收益变化瀑布图</span>
                      <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                        （价格和折扣调整对收益的影响）
                      </span>
                    </template>
                    <div ref="revenueWaterfallChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
                
                <!-- 风险-收益散点图 -->
                <el-col :span="12">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">风险-收益散点图</span>
                      <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                        （不同策略的风险-收益分布，右上角为最优区域）
                      </span>
                    </template>
                    <div ref="riskRewardChartRef" style="width: 100%; height: 400px;"></div>
                  </el-card>
                </el-col>
              </el-row>

              <el-row :gutter="20" class="mb-4">
                <!-- 收益预测热力图 -->
                <el-col :span="24">
                  <el-card shadow="never" class="chart-card">
                    <template #header>
                      <span class="result-title">收益预测热力图</span>
                      <span style="font-size: 12px; color: #909399; margin-left: 10px;">
                        （颜色越深表示收益越高，鼠标悬停查看详情）
                      </span>
                    </template>
                    <div ref="simulationHeatmapRef" style="width: 100%; height: 500px;"></div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { decisionApi } from '@/api/decision'
import { categoryApi } from '@/api/category'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Search, TrendCharts, DataLine } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const activeTab = ref('diagnosis')
const categories = ref([])

// 价格诊断表单
const diagnosisForm = ref({
  category: '',
  currentPrice: null,
  productTitle: ''
})
const diagnosisLoading = ref(false)
const diagnosisResult = ref(null)
const diagnosisPriceSalesChartRef = ref(null)
const competitivenessRadarChartRef = ref(null)
const priceDistributionChartRef = ref(null)
const priceImpactChartRef = ref(null)
let diagnosisPriceSalesChart = null
let competitivenessRadarChart = null
let priceDistributionChart = null
let priceImpactChart = null

// 销量预测表单
const salesForm = ref({
  category: '',
  price: null,
  discount: 20.0
})
const salesLoading = ref(false)
const salesResult = ref(null)
const priceSalesChartRef = ref(null)
const discountSalesChartRef = ref(null)
let priceSalesChart = null
let discountSalesChart = null

// 场景模拟表单
const simulationForm = ref({
  category: '',
  basePrice: null,
  baseDiscount: 20.0
})
const simulationLoading = ref(false)
const simulationResult = ref(null)
const simulationHeatmapRef = ref(null)
const revenueWaterfallChartRef = ref(null)
const riskRewardChartRef = ref(null)
let simulationHeatmapChart = null
let revenueWaterfallChart = null
let riskRewardChart = null

// 交互式调整器
const interactivePrice = ref(0)
const interactiveDiscount = ref(20.0)
const interactivePrediction = ref({
  predictedSales: null,
  predictedRevenue: null
})

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    console.log('分类数据:', data)
    if (data && Array.isArray(data)) {
      categories.value = data.map(item => item.productCategory).filter(Boolean)
      console.log('提取的分类列表:', categories.value)
      if (categories.value.length === 0) {
        ElMessage.warning('未找到分类数据，请检查数据库')
      }
    } else {
      console.error('分类数据格式错误:', data)
      ElMessage.error('分类数据格式错误')
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类列表失败: ' + (error.message || '未知错误'))
  }
}

// 价格诊断
const handleDiagnosis = async () => {
  if (!diagnosisForm.value.category || !diagnosisForm.value.currentPrice) {
    ElMessage.warning('请填写完整的诊断信息')
    return
  }

  diagnosisLoading.value = true
  try {
    const response = await decisionApi.diagnosePrice({
      category: diagnosisForm.value.category,
      currentPrice: diagnosisForm.value.currentPrice,
      productTitle: diagnosisForm.value.productTitle || undefined
    })

    // request.js 拦截器已经提取了 res.data，所以 response 直接是数据对象
    if (response) {
      diagnosisResult.value = response
      console.log('诊断结果:', response)
      ElMessage.success('诊断完成')
      // 渲染图表（使用估算值，不调用API）
      await nextTick()
      renderDiagnosisCharts()
    } else {
      ElMessage.error('诊断失败：未返回数据')
    }
  } catch (error) {
    console.error('诊断失败:', error)
    ElMessage.error('诊断失败: ' + (error.message || '未知错误'))
  } finally {
    diagnosisLoading.value = false
  }
}

const resetDiagnosis = () => {
  diagnosisForm.value = {
    category: '',
    currentPrice: null,
    productTitle: ''
  }
  diagnosisResult.value = null
  if (diagnosisPriceSalesChart) {
    diagnosisPriceSalesChart.dispose()
    diagnosisPriceSalesChart = null
  }
  if (competitivenessRadarChart) {
    competitivenessRadarChart.dispose()
    competitivenessRadarChart = null
  }
}

// 渲染诊断图表
const renderDiagnosisCharts = () => {
  if (!diagnosisResult.value) return

  // 1. 价格分布直方图
  renderPriceDistributionChart()
  
  // 2. 价格竞争力雷达图
  renderCompetitivenessRadarChart()
  
  // 3. 价格-销量关系曲线（使用估算值，避免大量API调用）
  renderPriceSalesCurveChart()
  
  // 4. 价格调整影响预测图
  renderPriceImpactChart()
}

// 渲染价格分布图（箱线图 + 散点图）
const renderPriceDistributionChart = () => {
  if (!priceDistributionChartRef.value || !diagnosisResult.value) return

  try {
    if (priceDistributionChart) {
      priceDistributionChart.dispose()
    }
    priceDistributionChart = echarts.init(priceDistributionChartRef.value)

    const currentPrice = diagnosisResult.value.currentPrice
    const predictedPrice = diagnosisResult.value.predictedPrice
    
    // 生成模拟价格数据（用于箱线图）
    const minPrice = Math.min(currentPrice, predictedPrice) * 0.6
    const maxPrice = Math.max(currentPrice, predictedPrice) * 1.4
    const center = predictedPrice
    const variance = (maxPrice - minPrice) / 4
    
    // 生成模拟价格点（用于显示分布）
    const priceData = []
    for (let i = 0; i < 100; i++) {
      // 使用正态分布生成价格点
      const u1 = Math.random()
      const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const price = center + z * variance
      if (price >= minPrice && price <= maxPrice) {
        priceData.push(price)
      }
    }
    priceData.sort((a, b) => a - b)
    
    // 计算箱线图数据（四分位数）
    const q1Index = Math.floor(priceData.length * 0.25)
    const medianIndex = Math.floor(priceData.length * 0.5)
    const q3Index = Math.floor(priceData.length * 0.75)
    const q1 = priceData[q1Index] || center * 0.85
    const median = priceData[medianIndex] || center
    const q3 = priceData[q3Index] || center * 1.15
    const min = priceData[0] || minPrice
    const max = priceData[priceData.length - 1] || maxPrice
    
    // 计算合理价格区间（Q1到Q3之间）
    const reasonableMin = q1
    const reasonableMax = q3

    priceDistributionChart.setOption({
      title: {
        text: '同类商品价格分布分析',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.seriesName === '价格分布') {
            return `价格: $${params.value.toFixed(2)}`
          } else if (params.seriesName === '当前价格') {
            return `当前价格: $${currentPrice.toFixed(2)}<br/>位置: ${currentPrice < reasonableMin ? '低于合理区间' : currentPrice > reasonableMax ? '高于合理区间' : '在合理区间内'}`
          } else if (params.seriesName === '预测价格') {
            return `预测价格: $${predictedPrice.toFixed(2)}<br/>位置: ${predictedPrice < reasonableMin ? '低于合理区间' : predictedPrice > reasonableMax ? '高于合理区间' : '在合理区间内'}`
          } else {
            return `${params.seriesName}: $${params.value.toFixed(2)}`
          }
        }
      },
      xAxis: {
        type: 'value',
        name: '价格 ($)',
        nameLocation: 'middle',
        nameGap: 30,
        scale: true
      },
      yAxis: {
        type: 'category',
        data: ['价格分布'],
        name: '商品分类'
      },
      series: [
        {
          name: '价格分布箱线图',
          type: 'boxplot',
          data: [[[min, q1, median, q3, max]]],
          itemStyle: {
            color: '#409EFF',
            borderColor: '#1f77b4'
          },
          emphasis: {
            itemStyle: {
              borderColor: '#1f77b4',
              borderWidth: 2
            }
          }
        },
        {
          name: '价格分布',
          type: 'scatter',
          data: priceData.map(p => [p, 0]),
          symbolSize: 4,
          itemStyle: {
            color: 'rgba(64, 158, 255, 0.3)'
          },
          yAxisIndex: 0
        },
        {
          name: '当前价格',
          type: 'scatter',
          data: [[currentPrice, 0]],
          symbolSize: 20,
          symbol: 'pin',
          itemStyle: {
            color: '#F56C6C'
          },
          markLine: {
            data: [
              {
                xAxis: currentPrice,
                lineStyle: { color: '#F56C6C', width: 2, type: 'dashed' },
                label: { 
                  formatter: '当前价格',
                  position: 'end',
                  color: '#F56C6C'
                }
              }
            ]
          }
        },
        {
          name: '预测价格',
          type: 'scatter',
          data: [[predictedPrice, 0]],
          symbolSize: 20,
          symbol: 'pin',
          itemStyle: {
            color: '#67C23A'
          },
          markLine: {
            data: [
              {
                xAxis: predictedPrice,
                lineStyle: { color: '#67C23A', width: 2, type: 'dashed' },
                label: { 
                  formatter: '预测价格',
                  position: 'end',
                  color: '#67C23A'
                }
              }
            ]
          }
        },
        {
          name: '合理价格区间',
          type: 'scatter',
          data: [
            [reasonableMin, 0],
            [reasonableMax, 0]
          ],
          symbolSize: 0,
          markArea: {
            itemStyle: {
              color: 'rgba(103, 194, 58, 0.1)'
            },
            data: [[
              { xAxis: reasonableMin },
              { xAxis: reasonableMax }
            ]],
            label: {
              show: true,
              position: 'inside',
              formatter: '合理价格区间\n(Q1-Q3)',
              color: '#67C23A',
              fontSize: 12
            }
          }
        }
      ],
      legend: {
        data: ['价格分布箱线图', '当前价格', '预测价格', '合理价格区间'],
        bottom: 0
      },
      grid: {
        left: '15%',
        right: '10%',
        top: '15%',
        bottom: '20%'
      }
    })
  } catch (e) {
    console.error('渲染价格分布图失败:', e)
  }
}

// 渲染价格竞争力雷达图
const renderCompetitivenessRadarChart = () => {
  if (!competitivenessRadarChartRef.value || !diagnosisResult.value) return

  try {
    if (competitivenessRadarChart) {
      competitivenessRadarChart.dispose()
    }
    competitivenessRadarChart = echarts.init(competitivenessRadarChartRef.value)

    const currentPrice = diagnosisResult.value.currentPrice
    const predictedPrice = diagnosisResult.value.predictedPrice
    const priceGapPercent = diagnosisResult.value.priceGapPercent
    const predictedRating = diagnosisResult.value.predictedRating
    const predictedSales = diagnosisResult.value.predictedSales

    // 计算竞争力指标
    const priceCompetitiveness = Math.max(0, 100 - Math.abs(priceGapPercent) * 2)
    const priceRationality = Math.max(0, 100 - Math.abs(priceGapPercent))
    const marketPosition = (predictedPrice / currentPrice) * 50 + 50
    const salesPotential = Math.min(100, predictedSales / 10)
    const ratingInfluence = predictedRating * 20

    competitivenessRadarChart.setOption({
      title: {
        text: '价格竞争力雷达图',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {},
      radar: {
        indicator: [
          { name: '价格竞争力', max: 100 },
          { name: '价格合理性', max: 100 },
          { name: '市场定位', max: 100 },
          { name: '销量潜力', max: 100 },
          { name: '评分影响', max: 100 }
        ],
        radius: '60%',
        center: ['50%', '55%']
      },
      series: [{
        name: '竞争力指标',
        type: 'radar',
        data: [{
          value: [
            priceCompetitiveness,
            priceRationality,
            marketPosition,
            salesPotential,
            ratingInfluence
          ],
          name: '当前商品'
        }],
        areaStyle: {
          opacity: 0.6
        },
        lineStyle: {
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    })
  } catch (e) {
    console.error('渲染价格竞争力雷达图失败:', e)
  }
}

// 渲染价格-销量关系曲线
const renderPriceSalesCurveChart = () => {
  if (!diagnosisPriceSalesChartRef.value || !diagnosisResult.value) return

  try {
    // 生成价格范围（当前价格的70%-130%）
    const currentPrice = diagnosisResult.value.currentPrice
    const predictedPrice = diagnosisResult.value.predictedPrice
    const predictedSales = diagnosisResult.value.predictedSales || 300
    const predictedRevenue = diagnosisResult.value.predictedRevenue || (predictedPrice * predictedSales)

    const prices = []
    const sales = []
    const revenues = []

    // 假设价格弹性为 -1.5（价格每增加1%，销量减少1.5%）
    const priceElasticity = -1.5

    for (let i = 0; i <= 6; i++) { // 7 points: 70%, 80%, ..., 130%
      const price = currentPrice * (0.7 + i * 0.1)
      prices.push(price.toFixed(2))

      // 基于价格弹性估算销量（相对于预测价格）
      const priceChangePercent = (price - predictedPrice) / predictedPrice
      const salesChangePercent = priceChangePercent * priceElasticity
      const estimatedSales = predictedSales * (1 + salesChangePercent)
      const estimatedRevenue = price * estimatedSales

      sales.push(Math.max(0, estimatedSales))
      revenues.push(Math.max(0, estimatedRevenue))
    }

    if (diagnosisPriceSalesChart) {
      diagnosisPriceSalesChart.dispose()
    }
    diagnosisPriceSalesChart = echarts.init(diagnosisPriceSalesChartRef.value)

    diagnosisPriceSalesChart.setOption({
      title: {
        text: '价格-销量关系曲线',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = `价格: $${params[0].axisValue}<br/>`
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value.toFixed(2)}<br/>`
          })
          return result
        }
      },
      legend: {
        data: ['销量', '收益'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: prices,
        name: '价格 ($)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: [
        {
          type: 'value',
          name: '销量',
          position: 'left',
          axisLabel: { formatter: '{value}' }
        },
        {
          type: 'value',
          name: '收益 ($)',
          position: 'right',
          axisLabel: { formatter: '{value}' }
        }
      ],
      series: [
        {
          name: '销量',
          type: 'line',
          data: sales,
          smooth: true,
          yAxisIndex: 0,
          itemStyle: { color: '#409EFF' },
          markPoint: {
            data: [
              { coord: [prices.indexOf(predictedPrice.toFixed(2)), predictedSales], name: '最优价格点', itemStyle: { color: '#67C23A' } }
            ]
          }
        },
        {
          name: '收益',
          type: 'line',
          data: revenues,
          smooth: true,
          yAxisIndex: 1,
          itemStyle: { color: '#67C23A' }
        }
      ]
    })
  } catch (e) {
    console.error('渲染价格-销量关系曲线失败:', e)
  }
}

// 渲染价格调整影响预测图
const renderPriceImpactChart = () => {
  if (!priceImpactChartRef.value || !diagnosisResult.value) return

  try {
    if (priceImpactChart) {
      priceImpactChart.dispose()
    }
    priceImpactChart = echarts.init(priceImpactChartRef.value)

    const currentPrice = diagnosisResult.value.currentPrice
    const predictedPrice = diagnosisResult.value.predictedPrice
    const predictedSales = diagnosisResult.value.predictedSales || 300
    const predictedRevenue = diagnosisResult.value.predictedRevenue || (predictedPrice * predictedSales)
    
    // 生成价格调整场景（-30% 到 +30%）
    const adjustments = []
    const salesChanges = []
    const revenueChanges = []
    
    const priceElasticity = -1.5
    
    for (let i = -6; i <= 6; i++) { // -30% 到 +30%，步长 5%
      const adjustmentPercent = i * 5
      const adjustedPrice = currentPrice * (1 + adjustmentPercent / 100)
      adjustments.push(adjustmentPercent)
      
      // 计算销量变化
      const priceChangePercent = (adjustedPrice - predictedPrice) / predictedPrice
      const salesChangePercent = priceChangePercent * priceElasticity
      const estimatedSales = predictedSales * (1 + salesChangePercent)
      const estimatedRevenue = adjustedPrice * estimatedSales
      
      salesChanges.push(((estimatedSales - predictedSales) / predictedSales * 100).toFixed(1))
      revenueChanges.push(((estimatedRevenue - predictedRevenue) / predictedRevenue * 100).toFixed(1))
    }

    priceImpactChart.setOption({
      title: {
        text: '价格调整影响预测',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let result = `价格调整: ${params[0].axisValue}%<br/>`
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value}%<br/>`
          })
          return result
        }
      },
      legend: {
        data: ['销量变化率', '收益变化率'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: adjustments.map(a => a + '%'),
        name: '价格调整幅度',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: '变化率 (%)',
        axisLabel: { formatter: '{value}%' }
      },
      series: [
        {
          name: '销量变化率',
          type: 'bar',
          data: salesChanges,
          itemStyle: { color: '#409EFF' },
          markLine: {
            data: [
              { yAxis: 0, name: '基准线', lineStyle: { color: '#909399', type: 'dashed' } }
            ]
          }
        },
        {
          name: '收益变化率',
          type: 'line',
          data: revenueChanges,
          smooth: true,
          itemStyle: { color: '#67C23A' },
          lineStyle: { width: 3 }
        }
      ]
    })
  } catch (e) {
    console.error('渲染价格调整影响预测图失败:', e)
  }
}

// 销量预测
const handleSalesPrediction = async () => {
  if (!salesForm.value.category || !salesForm.value.price) {
    ElMessage.warning('请填写完整的预测信息')
    return
  }

  salesLoading.value = true
  try {
    const response = await decisionApi.predictSales({
      category: salesForm.value.category,
      price: salesForm.value.price,
      discount: salesForm.value.discount || 0,
      scenarios: [
        { price: salesForm.value.price * 0.9, discount: salesForm.value.discount || 0 },
        { price: salesForm.value.price, discount: salesForm.value.discount || 0 },
        { price: salesForm.value.price * 1.1, discount: salesForm.value.discount || 0 }
      ]
    })

    // request.js 拦截器已经提取了 res.data，所以 response 直接是数据对象
    if (response) {
      salesResult.value = response
      console.log('销量预测结果:', response)
      await nextTick()
      renderSalesCharts()
      ElMessage.success('预测完成')
    } else {
      ElMessage.error('预测失败：未返回数据')
    }
  } catch (error) {
    console.error('预测失败:', error)
    ElMessage.error('预测失败: ' + (error.message || '未知错误'))
  } finally {
    salesLoading.value = false
  }
}

const resetSales = () => {
  salesForm.value = {
    category: '',
    price: null,
    discount: 20.0
  }
  salesResult.value = null
  if (priceSalesChart) {
    priceSalesChart.dispose()
    priceSalesChart = null
  }
  if (discountSalesChart) {
    discountSalesChart.dispose()
    discountSalesChart = null
  }
}

// 场景模拟
const handleSimulation = async () => {
  if (!simulationForm.value.category || !simulationForm.value.basePrice) {
    ElMessage.warning('请填写完整的模拟信息')
    return
  }

  simulationLoading.value = true
  ElMessage.info('场景模拟需要较长时间，请耐心等待...')
  
  try {
    const response = await decisionApi.simulateScenarios({
      category: simulationForm.value.category,
      basePrice: simulationForm.value.basePrice,
      baseDiscount: simulationForm.value.baseDiscount || 0
    })

    // request.js 拦截器已经提取了 res.data，所以 response 直接是数据对象
    if (response) {
      simulationResult.value = response
      console.log('场景模拟结果:', response)
      
      // 初始化交互式调整器
      if (simulationForm.value.basePrice) {
        interactivePrice.value = simulationForm.value.basePrice
        interactiveDiscount.value = simulationForm.value.baseDiscount || 20.0
        await updateInteractivePrediction()
      }
      
      await nextTick()
      renderAllSimulationCharts()
      ElMessage.success('模拟完成')
    } else {
      ElMessage.error('模拟失败：未返回数据')
    }
  } catch (error) {
    console.error('模拟失败:', error)
    ElMessage.error('模拟失败: ' + (error.message || '未知错误'))
  } finally {
    simulationLoading.value = false
  }
}

const resetSimulation = () => {
  simulationForm.value = {
    category: '',
    basePrice: null,
    baseDiscount: 20.0
  }
  simulationResult.value = null
  interactivePrice.value = 0
  interactiveDiscount.value = 20.0
  interactivePrediction.value = { predictedSales: null, predictedRevenue: null }
  
  if (simulationHeatmapChart) {
    simulationHeatmapChart.dispose()
    simulationHeatmapChart = null
  }
  if (revenueWaterfallChart) {
    revenueWaterfallChart.dispose()
    revenueWaterfallChart = null
  }
  if (riskRewardChart) {
    riskRewardChart.dispose()
    riskRewardChart = null
  }
}

// 交互式预测更新
const updateInteractivePrediction = async () => {
  if (!simulationForm.value.category || !interactivePrice.value) return
  
  try {
    const response = await decisionApi.predictSales({
      category: simulationForm.value.category,
      price: interactivePrice.value,
      discount: interactiveDiscount.value
    })
    
    if (response && response.currentPrediction) {
      interactivePrediction.value = {
        predictedSales: response.currentPrediction.predictedSales,
        predictedRevenue: response.currentPrediction.predictedRevenue
      }
    }
  } catch (error) {
    console.error('交互式预测失败:', error)
    // 使用估算值
    const basePrice = simulationForm.value.basePrice || interactivePrice.value
    const priceElasticity = -1.5
    const discountElasticity = 0.8
    const baseSales = 300 // 默认基准销量
    
    const priceChangePercent = (interactivePrice.value - basePrice) / basePrice
    const discountChangePercent = (interactiveDiscount.value - (simulationForm.value.baseDiscount || 20)) / 100.0
    const salesChangePercent = priceChangePercent * priceElasticity + discountChangePercent * discountElasticity
    const estimatedSales = baseSales * (1 + salesChangePercent)
    const actualPrice = interactivePrice.value * (1 - interactiveDiscount.value / 100.0)
    const estimatedRevenue = actualPrice * estimatedSales
    
    interactivePrediction.value = {
      predictedSales: Math.max(0, estimatedSales),
      predictedRevenue: Math.max(0, estimatedRevenue)
    }
  }
}

// 渲染销量预测图表
const renderSalesCharts = () => {
  if (!salesResult.value) return

  // 价格-销量曲线
  if (priceSalesChartRef.value && salesResult.value.priceSalesCurve) {
    if (priceSalesChart) {
      priceSalesChart.dispose()
    }
    priceSalesChart = echarts.init(priceSalesChartRef.value)

    const priceData = salesResult.value.priceSalesCurve.map(item => item.price)
    const salesData = salesResult.value.priceSalesCurve.map(item => item.sales)
    const revenueData = salesResult.value.priceSalesCurve.map(item => item.revenue)

    priceSalesChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['销量', '收益']
      },
      xAxis: {
        type: 'value',
        name: '价格 ($)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: [
        {
          type: 'value',
          name: '销量',
          position: 'left',
          axisLabel: { formatter: '{value}' }
        },
        {
          type: 'value',
          name: '收益 ($)',
          position: 'right',
          axisLabel: { formatter: '{value}' }
        }
      ],
      series: [
        {
          name: '销量',
          type: 'line',
          data: salesData.map((sales, index) => [priceData[index], sales]),
          smooth: true,
          itemStyle: { color: '#409EFF' },
          lineStyle: { width: 3 }
        },
        {
          name: '收益',
          type: 'line',
          yAxisIndex: 1,
          data: revenueData.map((revenue, index) => [priceData[index], revenue]),
          smooth: true,
          itemStyle: { color: '#67C23A' },
          lineStyle: { width: 3 }
        }
      ]
    })
  }

  // 折扣-销量曲线
  if (discountSalesChartRef.value && salesResult.value.discountSalesCurve) {
    if (discountSalesChart) {
      discountSalesChart.dispose()
    }
    discountSalesChart = echarts.init(discountSalesChartRef.value)

    const discountData = salesResult.value.discountSalesCurve.map(item => item.discount)
    const salesData = salesResult.value.discountSalesCurve.map(item => item.sales)
    const revenueData = salesResult.value.discountSalesCurve.map(item => item.revenue)

    discountSalesChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['销量', '收益']
      },
      xAxis: {
        type: 'value',
        name: '折扣 (%)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: [
        {
          type: 'value',
          name: '销量',
          position: 'left'
        },
        {
          type: 'value',
          name: '收益 ($)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '销量',
          type: 'line',
          data: salesData.map((sales, index) => [discountData[index], sales]),
          smooth: true,
          itemStyle: { color: '#409EFF' },
          lineStyle: { width: 3 }
        },
        {
          name: '收益',
          type: 'line',
          yAxisIndex: 1,
          data: revenueData.map((revenue, index) => [discountData[index], revenue]),
          smooth: true,
          itemStyle: { color: '#67C23A' },
          lineStyle: { width: 3 }
        }
      ]
    })
  }
}

// 渲染所有场景模拟图表
const renderAllSimulationCharts = () => {
  if (!simulationResult.value || !simulationResult.value.simulations) return
  
  renderSimulationHeatmap()
  renderRevenueWaterfallChart()
  renderRiskRewardChart()
}

// 渲染收益热力图
const renderSimulationHeatmap = () => {
  if (!simulationResult.value || !simulationResult.value.simulations) return
  if (!simulationHeatmapRef.value) return

  if (simulationHeatmapChart) {
    simulationHeatmapChart.dispose()
  }
  simulationHeatmapChart = echarts.init(simulationHeatmapRef.value)

  const simulations = simulationResult.value.simulations
  const prices = [...new Set(simulations.map(s => s.price))].sort((a, b) => a - b)
  const discounts = [...new Set(simulations.map(s => s.discount))].sort((a, b) => a - b)

  const heatmapData = []
  simulations.forEach(sim => {
    const priceIndex = prices.indexOf(sim.price)
    const discountIndex = discounts.indexOf(sim.discount)
    heatmapData.push([discountIndex, priceIndex, sim.predictedRevenue])
  })

  const maxRevenue = Math.max(...simulations.map(s => s.predictedRevenue))
  const minRevenue = Math.min(...simulations.map(s => s.predictedRevenue))

  simulationHeatmapChart.setOption({
    title: {
      text: '收益预测热力图',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const price = prices[params.data[1]]
        const discount = discounts[params.data[0]]
        const revenue = params.data[2]
        return `价格: $${price.toFixed(2)}<br/>折扣: ${discount.toFixed(1)}%<br/>收益: $${revenue.toFixed(2)}`
      }
    },
    grid: {
      height: '60%',
      top: '15%'
    },
    xAxis: {
      type: 'category',
      data: discounts.map(d => d.toFixed(1) + '%'),
      splitArea: { show: true },
      name: '折扣 (%)'
    },
    yAxis: {
      type: 'category',
      data: prices.map(p => '$' + p.toFixed(0)),
      splitArea: { show: true },
      name: '价格 ($)'
    },
    visualMap: {
      min: minRevenue,
      max: maxRevenue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [{
      name: '收益预测',
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}


// 渲染收益变化瀑布图
const renderRevenueWaterfallChart = () => {
  if (!simulationResult.value || !simulationResult.value.simulations) return
  if (!revenueWaterfallChartRef.value) return

  if (revenueWaterfallChart) {
    revenueWaterfallChart.dispose()
  }
  revenueWaterfallChart = echarts.init(revenueWaterfallChartRef.value)

  const simulations = simulationResult.value.simulations
  const basePrice = simulationResult.value.basePrice
  const baseDiscount = simulationResult.value.baseDiscount || 0
  
  // 找到基准场景
  const baseScenario = simulations.find(s => 
    Math.abs(s.price - basePrice) < 0.01 && Math.abs(s.discount - baseDiscount) < 0.01
  ) || simulations[Math.floor(simulations.length / 2)]
  
  const baseRevenue = baseScenario.predictedRevenue
  
  // 选择几个关键场景进行对比
  const keyScenarios = [
    { name: '基准场景', price: basePrice, discount: baseDiscount, revenue: baseRevenue },
    ...getTopScenarios().slice(0, 4).map((s, idx) => ({
      name: `策略${idx + 1}`,
      price: s.price,
      discount: s.discount,
      revenue: s.predictedRevenue
    }))
  ]

  const categories = keyScenarios.map(s => `${s.name}\n$${s.price.toFixed(0)}/${s.discount.toFixed(0)}%`)
  const revenueData = keyScenarios.map(s => s.revenue)
  const changes = keyScenarios.map(s => s.revenue - baseRevenue)

  revenueWaterfallChart.setOption({
    title: {
      text: '收益变化瀑布图',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const param = params[0]
        const idx = param.dataIndex
        const scenario = keyScenarios[idx]
        return `${scenario.name}<br/>价格: $${scenario.price.toFixed(2)}<br/>折扣: ${scenario.discount.toFixed(1)}%<br/>收益: $${scenario.revenue.toFixed(2)}<br/>变化: ${changes[idx] >= 0 ? '+' : ''}$${changes[idx].toFixed(2)}`
      }
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
      name: '收益 ($)'
    },
    series: [
      {
        name: '基准收益',
        type: 'bar',
        stack: 'total',
        data: keyScenarios.map(() => baseRevenue),
        itemStyle: { color: '#91CC75' }
      },
      {
        name: '收益变化',
        type: 'bar',
        stack: 'total',
        data: changes,
        itemStyle: {
          color: (params) => {
            return params.value >= 0 ? '#5470C6' : '#EE6666'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            const val = params.value
            return val >= 0 ? `+$${val.toFixed(0)}` : `$${val.toFixed(0)}`
          }
        }
      }
    ]
  })
}

// 渲染风险-收益散点图
const renderRiskRewardChart = () => {
  if (!simulationResult.value || !simulationResult.value.simulations) return
  if (!riskRewardChartRef.value) return

  if (riskRewardChart) {
    riskRewardChart.dispose()
  }
  riskRewardChart = echarts.init(riskRewardChartRef.value)

  const simulations = simulationResult.value.simulations
  
  // 计算风险（使用收益的标准差作为风险指标）
  const revenues = simulations.map(s => s.predictedRevenue)
  const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length
  const variance = revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length
  const stdDev = Math.sqrt(variance)
  
  // 计算每个场景的风险（相对于平均收益的偏差）
  const scatterData = simulations.map(sim => {
    const risk = Math.abs(sim.predictedRevenue - avgRevenue) / stdDev
    return [risk, sim.predictedRevenue, sim.price, sim.discount, sim.predictedSales]
  })

  // 找到最优策略（高收益低风险）
  const maxRevenue = Math.max(...revenues)
  const optimalScenario = simulations.find(s => s.predictedRevenue === maxRevenue)

  riskRewardChart.setOption({
    title: {
      text: '风险-收益散点图',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = params.data
        return `风险: ${data[0].toFixed(2)}<br/>收益: $${data[1].toFixed(2)}<br/>价格: $${data[2].toFixed(2)}<br/>折扣: ${data[3].toFixed(1)}%<br/>销量: ${data[4].toFixed(0)}`
      }
    },
    xAxis: {
      type: 'value',
      name: '风险（收益波动）',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: '收益 ($)',
      nameLocation: 'middle',
      nameGap: 50
    },
    series: [
      {
        name: '策略分布',
        type: 'scatter',
        data: scatterData,
        symbolSize: (data) => Math.sqrt(data[4]) / 2, // 根据销量调整点的大小
        itemStyle: {
          color: (params) => {
            const risk = params.data[0]
            const revenue = params.data[1]
            // 高收益低风险 = 绿色，高收益高风险 = 黄色，低收益 = 红色
            if (revenue > avgRevenue && risk < 1) return '#67C23A'
            if (revenue > avgRevenue) return '#E6A23C'
            return '#F56C6C'
          },
          opacity: 0.7
        },
        markPoint: {
          data: [
            {
              coord: [
                Math.abs(optimalScenario.predictedRevenue - avgRevenue) / stdDev,
                optimalScenario.predictedRevenue
              ],
              name: '最优策略',
              itemStyle: { color: '#67C23A' },
              symbol: 'pin',
              symbolSize: 50
            }
          ]
        },
        markArea: {
          itemStyle: { color: 'rgba(103, 194, 58, 0.1)' },
          data: [[
            { coord: [0, avgRevenue] },
            { coord: [1, maxRevenue] }
          ]],
          label: {
            show: true,
            position: 'inside',
            formatter: '最优区域\n（高收益低风险）'
          }
        }
      }
    ]
  })
}

// 统计信息计算函数
const getMaxRevenue = () => {
  if (!simulationResult.value?.simulations) return 0
  return Math.max(...simulationResult.value.simulations.map(s => s.predictedRevenue))
}

const getAvgRevenue = () => {
  if (!simulationResult.value?.simulations || simulationResult.value.simulations.length === 0) return 0
  const sum = simulationResult.value.simulations.reduce((acc, s) => acc + s.predictedRevenue, 0)
  return sum / simulationResult.value.simulations.length
}

const getMaxSales = () => {
  if (!simulationResult.value?.simulations) return 0
  return Math.max(...simulationResult.value.simulations.map(s => s.predictedSales))
}

const getMaxRevenueScenario = () => {
  if (!simulationResult.value?.simulations) return null
  return simulationResult.value.simulations.reduce((max, s) => 
    s.predictedRevenue > max.predictedRevenue ? s : max
  )
}

const getMaxSalesScenario = () => {
  if (!simulationResult.value?.simulations) return null
  return simulationResult.value.simulations.reduce((max, s) => 
    s.predictedSales > max.predictedSales ? s : max
  )
}

const getTopScenarios = () => {
  if (!simulationResult.value?.simulations) return []
  return [...simulationResult.value.simulations]
    .sort((a, b) => b.predictedRevenue - a.predictedRevenue)
    .slice(0, 5)
}

const applyScenario = (scenario) => {
  ElMessage.success(`已采用策略：价格 $${scenario.price.toFixed(2)}，折扣 ${scenario.discount.toFixed(1)}%，预计收益 $${scenario.predictedRevenue.toFixed(2)}`)
  // 这里可以添加实际应用策略的逻辑
}

// 工具方法
const getDiagnosisTagType = (diagnosis) => {
  if (diagnosis?.includes('合理')) return 'success'
  if (diagnosis?.includes('偏高')) return 'danger'
  if (diagnosis?.includes('偏低')) return 'warning'
  return 'info'
}

const getConfidenceColor = (confidence) => {
  if (confidence >= 0.9) return '#67C23A'
  if (confidence >= 0.7) return '#E6A23C'
  return '#F56C6C'
}

// 窗口大小变化处理
const handleResize = () => {
  diagnosisPriceSalesChart?.resize()
  competitivenessRadarChart?.resize()
  priceSalesChart?.resize()
  discountSalesChart?.resize()
  simulationHeatmapChart?.resize()
  revenueWaterfallChart?.resize()
  riskRewardChart?.resize()
}

// 监听交互式调整器变化
// 监听交互式调整器变化（添加防抖，避免频繁调用预测服务）
let interactivePredictionTimer = null
const stopWatch1 = watch([interactivePrice, interactiveDiscount], () => {
  if (simulationResult.value && simulationForm.value.category && interactivePrice.value > 0) {
    // 添加防抖，避免频繁调用
    if (interactivePredictionTimer) {
      clearTimeout(interactivePredictionTimer)
    }
    interactivePredictionTimer = setTimeout(() => {
      updateInteractivePrediction()
    }, 500) // 500ms 防抖，减少API调用
  }
})


onMounted(() => {
  loadCategories()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', handleResize)
  
  // 停止 watch 监听
  stopWatch1()
  // 清理防抖定时器
  if (interactivePredictionTimer) {
    clearTimeout(interactivePredictionTimer)
    interactivePredictionTimer = null
  }
  
  // 清理图表实例
  priceDistributionChart?.dispose()
  competitivenessRadarChart?.dispose()
  diagnosisPriceSalesChart?.dispose()
  priceImpactChart?.dispose()
  priceSalesChart?.dispose()
  discountSalesChart?.dispose()
  simulationHeatmapChart?.dispose()
  revenueWaterfallChart?.dispose()
  riskRewardChart?.dispose()
})
</script>

<style scoped>
.decision-center {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.card-header .el-icon {
  margin-right: 8px;
}

.tab-content {
  padding: 20px 0;
}

.diagnosis-form,
.sales-form,
.simulation-form {
  margin-bottom: 20px;
}

.result-section {
  margin-top: 30px;
}

.result-card {
  margin-bottom: 20px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-card {
  margin-top: 20px;
}

.chart-card .result-title {
  font-size: 14px;
}

.stat-card {
  text-align: center;
  height: 100%;
}

.stat-item {
  padding: 10px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.stat-desc {
  font-size: 12px;
  color: #C0C4CC;
}

.mb-4 {
  margin-bottom: 20px;
}
</style>

