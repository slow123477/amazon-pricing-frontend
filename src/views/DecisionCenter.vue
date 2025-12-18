<template>
  <div class="decision-center">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><DataAnalysis /></el-icon> 商品决策</span>
        </div>
        <div class="card-subtitle">
          输入价格/折扣/竞品价/广告/优惠券，结合预测模型给出收益/销量预测与6张对比图。
        </div>
      </template>

      <!-- 指标卡片 -->
      <el-row :gutter="20" class="metric-row">
        <el-col :span="6">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">预测销量</div>
            <div class="metric-value primary">{{ (analysisCards.predictedSales || 0).toFixed(0) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">预测收益</div>
            <div class="metric-value success">${{ (analysisCards.predictedRevenue || 0).toFixed(2) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">实际成交价</div>
            <div class="metric-value warning">${{ (analysisCards.actualPrice || 0).toFixed(2) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="metric-card">
            <div class="metric-label">竞争价偏差</div>
            <div class="metric-value info">{{ (analysisCards.priceGapPct || 0).toFixed(2) }}%</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 表单 -->
      <el-form :model="form" label-width="130px" class="form-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="商品名称">
              <el-input v-model="form.productName" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="商品分类" required>
              <el-select v-model="form.category" placeholder="请选择分类" filterable style="width: 100%">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="商品价格" required>
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" placeholder="0.00" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="常规折扣(%)">
              <el-input-number v-model="form.discount" :min="0" :max="100" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="竞品均价" required>
              <el-input-number v-model="form.competitorPrice" :min="0" :precision="2" style="width: 100%" placeholder="0.00" />
            </el-form-item>
          </el-col>
        <el-col :span="8">
          <div class="form-placeholder"></div>
        </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优惠券(%)">
              <el-switch v-model="form.hasCoupon" />
              <el-input-number
                v-model="form.couponPct"
                :disabled="!form.hasCoupon"
                :min="0"
                :max="80"
                :precision="2"
                style="width: 120px; margin-left: 12px"
                placeholder="券折扣%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="广告投放(%)">
              <el-switch v-model="form.hasAds" />
              <el-input-number
                v-model="form.adBudgetPct"
                :disabled="!form.hasAds"
                :min="0"
                :max="80"
                :precision="2"
                style="width: 120px; margin-left: 12px"
                placeholder="预算占比%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8" class="form-actions">
            <el-button type="primary" :loading="loading" @click="handleAnalyze">
              <el-icon><DataLine /></el-icon> 开始预测
            </el-button>
            <el-button @click="resetForm">清空</el-button>
          </el-col>
        </el-row>
      </el-form>

      <!-- 诊断结果卡片 -->
      <el-card v-if="diagnosisData" shadow="never" class="diagnosis-card">
        <template #header>
          <span class="result-title">价格诊断</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="分类">{{ diagnosisData.category }}</el-descriptions-item>
          <el-descriptions-item label="系统诊断">
            <el-tag :type="getDiagnosisTagType(diagnosisData.diagnosis)">
              {{ diagnosisData.diagnosis }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前商品价格">
            <span class="price-highlight">${{ (diagnosisData.currentPrice || 0).toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实际成交价">
            <span :class="diagnosisData.discount > 30 ? 'price-danger' : 'actual-price-highlight'">
              ${{ (diagnosisData.actualPrice || 0).toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="竞品均价">
            <span class="competitor-price-highlight">${{ (diagnosisData.competitorPrice || 0).toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="价格差距">
            <span :class="diagnosisData.priceGap > 0 ? 'gap-negative' : 'gap-positive'">
              {{ diagnosisData.priceGap > 0 ? '+' : '' }}${{ (diagnosisData.priceGap || 0).toFixed(2) }}
              ({{ diagnosisData.priceGap > 0 ? '+' : '' }}{{ (diagnosisData.priceGapPercent || 0).toFixed(1) }}%)
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="当前折扣">
            <span :class="diagnosisData.discount > 30 ? 'price-danger' : (diagnosisData.discount > 20 ? 'price-warning' : '')">
              {{ (diagnosisData.discount || 0).toFixed(2) }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="营销策略">
            <div style="display: flex; gap: 8px;">
              <el-tag v-if="diagnosisData.hasCoupon" type="success" size="small">
                优惠券 {{ diagnosisData.couponPct.toFixed(1) }}%
              </el-tag>
              <el-tag v-if="diagnosisData.hasAds" type="warning" size="small">
                广告 {{ diagnosisData.adBudgetPct.toFixed(1) }}%
              </el-tag>
              <el-tag v-if="!diagnosisData.hasCoupon && !diagnosisData.hasAds" type="info" size="small">
                无促销
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="综合建议" :span="2">
            <div class="suggestion-text">{{ diagnosisData.suggestion }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="预计效果" :span="2">
            <span class="impact-text">{{ diagnosisData.salesImpact }}</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 详细策略建议（可展开） -->
        <el-collapse v-if="diagnosisData.discountSuggestion || diagnosisData.couponSuggestion || diagnosisData.adSuggestion" 
                     style="margin-top: 16px" accordion>
          <el-collapse-item title="查看详细策略建议" name="1">
            <div class="detail-suggestions">
              <div class="suggestion-item" v-if="diagnosisData.discountSuggestion">
                <el-icon color="#409eff"><Discount /></el-icon>
                <span class="suggestion-label">折扣策略：</span>
                <span class="suggestion-content">{{ diagnosisData.discountSuggestion }}</span>
              </div>
              <div class="suggestion-item" v-if="diagnosisData.couponSuggestion">
                <el-icon color="#67c23a"><Ticket /></el-icon>
                <span class="suggestion-label">优惠券策略：</span>
                <span class="suggestion-content">{{ diagnosisData.couponSuggestion }}</span>
              </div>
              <div class="suggestion-item" v-if="diagnosisData.adSuggestion">
                <el-icon color="#e6a23c"><Promotion /></el-icon>
                <span class="suggestion-label">广告策略：</span>
                <span class="suggestion-content">{{ diagnosisData.adSuggestion }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <!-- 推荐策略（诊断风格） -->
      <div v-if="recommendations.length" class="strategy-section">
        <div class="section-header">
          <h3>策略推荐</h3>
        </div>
        <el-row :gutter="20">
          <el-col v-for="rec in recommendations" :key="rec.label" :span="8">
            <el-card shadow="hover" class="strategy-card">
              <div class="strategy-header">
                <el-tag :type="rec.tagType" size="large">{{ rec.label }}</el-tag>
                <el-tag size="small" :type="getRiskTagType(rec.riskLevel)" style="margin-left: 8px">{{ rec.riskLevel }}</el-tag>
              </div>
              <div class="strategy-desc">{{ rec.description }}</div>
              
              <el-divider style="margin: 16px 0" />
              
              <div class="strategy-detail">
                <div class="detail-row">
                  <span class="detail-label">建议价格</span>
                  <span class="detail-value price-value">${{ (rec.price || 0).toFixed(2) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">建议折扣</span>
                  <span class="detail-value">{{ (rec.discount || 0).toFixed(2) }}%</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">预测销量</span>
                  <span class="detail-value sales-value">{{ (rec.predictedSales || 0).toFixed(0) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">预测收益</span>
                  <span class="detail-value revenue-value">${{ (rec.predictedRevenue || 0).toFixed(2) }}</span>
                </div>
                
                <el-divider style="margin: 12px 0" />
                
                <div class="detail-row">
                  <span class="detail-label">优惠券</span>
                  <span class="detail-value">
                    <el-tag v-if="rec.hasCoupon" type="success" size="small">{{ rec.couponPct.toFixed(2) }}%</el-tag>
                    <el-tag v-else type="info" size="small">未启用</el-tag>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">广告投放</span>
                  <span class="detail-value">
                    <el-tag v-if="rec.hasAds" type="warning" size="small">{{ rec.adBudgetPct.toFixed(2) }}%</el-tag>
                    <el-tag v-else type="info" size="small">未启用</el-tag>
                  </span>
                </div>
              </div>
              
              <el-button type="primary" size="small" style="width: 100%; margin-top: 16px" @click="applyStrategy(rec)">
                应用此策略
              </el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 六张图表 3x2 -->
      <div v-if="chartsReady" class="chart-grid">
        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="result-title">价格竞争力分析</span></template>
              <div ref="priceSalesRef" style="width: 100%; height: 320px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="result-title">折扣-销量/收益</span></template>
              <div ref="discountCurveRef" style="width: 100%; height: 320px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="result-title">收益结构占比</span></template>
              <div ref="riskRewardRef" style="width: 100%; height: 320px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="result-title">策略效果对比</span></template>
              <div ref="waterfallRef" style="width: 100%; height: 320px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="result-title">竞争价差热力图</span></template>
              <div ref="heatmapRef" style="width: 100%; height: 320px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never" class="chart-card">
              <template #header><span class="result-title">价格带销量结构</span></template>
              <div ref="priceBandRef" style="width: 100%; height: 320px"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { decisionApi } from '@/api/decision'
import { categoryApi } from '@/api/category'
import { ElMessage } from 'element-plus'
import { DataAnalysis, DataLine, Discount, Ticket, Promotion } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const categories = ref([])

const form = ref({
  productName: '',
  category: '',
  price: 0,
  discount: 0,
  competitorPrice: 0,
  hasCoupon: false,
  couponPct: 0,
  hasAds: false,
  adBudgetPct: 0
})

const loading = ref(false)
const analysisCards = ref({})
const diagnosisData = ref(null)
const recommendations = ref([])
const charts = ref({})
const chartsReady = ref(false)

const priceSalesRef = ref(null)
const discountCurveRef = ref(null)
const riskRewardRef = ref(null)
const waterfallRef = ref(null)
const heatmapRef = ref(null)
const priceBandRef = ref(null)

let priceSalesChart = null
let discountCurveChart = null
let riskRewardChart = null
let waterfallChart = null
let heatmapChart = null
let priceBandChart = null

const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    if (Array.isArray(data)) {
      categories.value = data.map(item => item.productCategory).filter(Boolean)
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类列表失败')
  }
}

// 根据风险等级返回标签类型
const getRiskTagType = (riskLevel) => {
  if (riskLevel === '低风险') return 'success'
  if (riskLevel === '中风险') return 'warning'
  return 'danger'
}

// 根据诊断结果返回标签类型
const getDiagnosisTagType = (diagnosis) => {
  if (diagnosis === '价格合理') return 'success'
  if (diagnosis === '价格略高' || diagnosis === '价格略低') return 'warning'
  return 'danger'
}

const resetForm = () => {
  form.value = {
    productName: '',
    category: '',
    price: 0,
    discount: 0,
    competitorPrice: 0,
    hasCoupon: false,
    couponPct: 0,
    hasAds: false,
    adBudgetPct: 0,
    goal: 'balanced' // 兼容后端默认，前端不再展示
  }
  analysisCards.value = {}
  diagnosisData.value = null
  recommendations.value = []
  charts.value = {}
  chartsReady.value = false
  disposeCharts()
}

const handleAnalyze = async () => {
  if (!form.value.category || !form.value.price || !form.value.competitorPrice) {
    ElMessage.warning('请填写分类、价格、竞品均价')
    return
  }
  loading.value = true
  try {
    const resp = await decisionApi.decisionAnalysis({
      productName: form.value.productName,
      category: form.value.category,
      price: form.value.price,
      discount: form.value.discount,
      competitorPrice: form.value.competitorPrice,
      hasCoupon: form.value.hasCoupon,
      couponPct: form.value.couponPct,
      hasAds: form.value.hasAds,
      adBudgetPct: form.value.adBudgetPct
    })
    if (resp) {
      analysisCards.value = resp.cards || {}
      diagnosisData.value = resp.diagnosis || null
      recommendations.value = resp.recommendations || []
      charts.value = resp.charts || {}
      chartsReady.value = true
      await nextTick()
      renderCharts()
      ElMessage.success('预测完成')
    } else {
      ElMessage.error('预测失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('预测失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 应用策略：将推荐策略的参数填入表单并重新预测
const applyStrategy = async (strategy) => {
  ElMessage.info(`正在应用"${strategy.label}"...`)
  
  // 更新表单参数
  form.value.price = strategy.price || form.value.price
  form.value.discount = strategy.discount || 0
  form.value.hasCoupon = strategy.hasCoupon || false
  form.value.couponPct = strategy.couponPct || 0
  form.value.hasAds = strategy.hasAds || false
  form.value.adBudgetPct = strategy.adBudgetPct || 0
  
  // 滚动到页面顶部，让用户看到表单参数变化
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // 等待UI更新和滚动完成
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 自动触发预测
  await handleAnalyze()
}

const renderCharts = () => {
  renderPriceSales()
  renderDiscountCurve()
  renderRiskReward()
  renderWaterfall()
  renderHeatmap()
  renderPriceBand()
}

const renderPriceSales = () => {
  if (!priceSalesRef.value) return
  priceSalesChart?.dispose()
  priceSalesChart = echarts.init(priceSalesRef.value)
  
  // 计算雷达图各维度得分（0-100）
  const currentPrice = form.value.price || 0
  const competitorPrice = form.value.competitorPrice || currentPrice
  const discount = form.value.discount || 0
  const predictedSales = analysisCards.value.predictedSales || 0
  const predictedRevenue = analysisCards.value.predictedRevenue || 0
  
  // 价格竞争力：价格越低于竞品越好（竞品价/当前价 * 50，最高100）
  const priceCompetitiveness = competitorPrice > 0 
    ? Math.min(100, Math.max(0, (competitorPrice / currentPrice) * 50))
    : 50
  
  // 价格稳定性：折扣越低越稳定（100 - 折扣*2）
  const priceStability = Math.max(0, 100 - discount * 2)
  
  // 市场定位：基于价格与竞品的关系（接近竞品得分高）
  const priceGapPct = competitorPrice > 0 ? Math.abs((currentPrice - competitorPrice) / competitorPrice * 100) : 0
  const marketPosition = Math.max(0, 100 - priceGapPct * 2)
  
  // 价格优势：折扣带来的竞争优势
  const priceAdvantage = Math.min(100, discount * 3 + (competitorPrice > currentPrice ? 30 : 0))
  
  // 价格合理性：综合评估（折扣在10-25%之间最合理）
  const discountReasonability = discount <= 25 
    ? (discount >= 10 ? 100 : 60 + discount * 4)
    : Math.max(0, 100 - (discount - 25) * 3)
  
  priceSalesChart.setOption({
    title: {
      text: '价格竞争力多维度分析',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: [
        { name: '价格竞争力', max: 100 },
        { name: '价格稳定性', max: 100 },
        { name: '市场定位', max: 100 },
        { name: '价格优势', max: 100 },
        { name: '价格合理性', max: 100 }
      ],
      center: ['50%', '55%'],
      radius: '65%'
    },
    series: [{
      name: '价格分析',
      type: 'radar',
      data: [{
        value: [
          priceCompetitiveness.toFixed(0),
          priceStability.toFixed(0),
          marketPosition.toFixed(0),
          priceAdvantage.toFixed(0),
          discountReasonability.toFixed(0)
        ],
        name: '当前策略',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        },
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    }]
  })
}

const renderDiscountCurve = () => {
  if (!discountCurveRef.value || !charts.value.discountCurve) return
  discountCurveChart?.dispose()
  discountCurveChart = echarts.init(discountCurveRef.value)
  const data = charts.value.discountCurve
  discountCurveChart.setOption({
    tooltip: { 
      trigger: 'axis',
      formatter: params => {
        const x = params[0]?.axisValue || ''
        let res = `${x}<br/>`
        params.forEach(p => {
          const val = Number(p.value || 0).toFixed(2)
          res += `${p.marker} ${p.seriesName}: ${val}<br/>`
        })
        return res
      }
    },
    xAxis: { type: 'category', data: data.map(d => d.discount + '%'), name: '折扣(%)' },
    yAxis: [
      { type: 'value', name: '销量' },
      { type: 'value', name: '收益', position: 'right' }
    ],
    legend: { data: ['销量', '收益'] },
    series: [
      { name: '销量', type: 'line', data: data.map(d => d.predictedSales), smooth: true },
      { name: '收益', type: 'line', yAxisIndex: 1, data: data.map(d => d.predictedRevenue), smooth: true }
    ]
  })
}

const renderRiskReward = () => {
  if (!riskRewardRef.value || !analysisCards.value || !analysisCards.value.predictedSales) return
  riskRewardChart?.dispose()
  riskRewardChart = echarts.init(riskRewardRef.value)

  const price = form.value.price || 0
  const discount = form.value.discount || 0
  const hasCoupon = form.value.hasCoupon
  const couponPct = form.value.couponPct || 0
  const hasAds = form.value.hasAds
  const adBudgetPct = form.value.adBudgetPct || 0

  const sales = analysisCards.value.predictedSales || 0
  const predictedRevenue = analysisCards.value.predictedRevenue || 0

  // 原始标价收入（未打折、未用券）
  const listRevenue = price * sales

  // 实际成交价收入（打折+优惠券之后）
  const totalDiscountPct = discount + (hasCoupon ? couponPct : 0)
  const effectivePct = Math.max(0, 1 - totalDiscountPct / 100)
  const actualRevenue = listRevenue * effectivePct

  // 优惠让利成本 = 标价收入 - 实际收入
  const promoCost = Math.max(0, listRevenue - actualRevenue)

  // 广告成本 = 预测收益 * 广告占比（如果开广告）
  const adCost = hasAds ? predictedRevenue * (adBudgetPct / 100) : 0

  // 简单认为“可留存利润 = 实际收入 - 广告成本”
  const profit = Math.max(0, actualRevenue - adCost)

  const pieData = [
    { name: '商品收入', value: profit },
    { name: '优惠让利成本', value: promoCost },
    { name: '广告成本', value: adCost }
  ].filter(item => item.value > 0)

  const total = pieData.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return

  riskRewardChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: p => {
        const val = p.value
        return `${p.name}<br/>金额: $${(val / 1000).toFixed(1)}k<br/>占比: ${p.percent.toFixed(1)}%`
      }
    },
    legend: {
      orient: 'vertical',
      left: '5%',
      top: 'middle'
    },
    series: [
      {
        name: '收益结构',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '55%'],
        avoidLabelOverlap: false,
        // 如果广告成本很小，保证至少有一个可见角度
        minAngle: pieData.length >= 3 ? 5 : 0,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11
        },
        labelLine: {
          length: 15,
          length2: 10
        },
        data: pieData,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        color: ['#67C23A', '#E6A23C', '#F56C6C']
      }
    ]
  })
}

const renderWaterfall = () => {
  if (!waterfallRef.value || !recommendations.value.length) return
  waterfallChart?.dispose()
  waterfallChart = echarts.init(waterfallRef.value)
  
  // 使用策略推荐数据，对比当前策略和三个推荐策略的销量/收益
  const recs = recommendations.value
  const currentSales = analysisCards.value.predictedSales || 0
  const currentRevenue = analysisCards.value.predictedRevenue || 0
  
  const categories = ['当前策略', ...recs.map(r => r.label)]
  const salesData = [currentSales, ...recs.map(r => r.predictedSales || 0)]
  const revenueData = [currentRevenue, ...recs.map(r => r.predictedRevenue || 0)]
  
  waterfallChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        let res = `${params[0].name}<br/>`
        params.forEach(p => {
          const val = p.seriesName === '预测收益' ? `$${(p.value / 1000).toFixed(0)}k` : p.value.toFixed(0)
          res += `${p.marker} ${p.seriesName}: ${val}<br/>`
        })
        return res
      }
    },
    legend: { data: ['预测销量', '预测收益'], top: 0 },
    xAxis: { 
      type: 'category', 
      data: categories,
      axisLabel: { interval: 0, fontSize: 11 }
    },
    yAxis: [
      { type: 'value', name: '销量', position: 'left' },
      { type: 'value', name: '收益($)', position: 'right', axisLabel: { formatter: v => (v / 1000).toFixed(0) + 'k' } }
    ],
    series: [
      {
        name: '预测销量',
        type: 'bar',
        data: salesData,
        itemStyle: {
          color: (params) => {
            const colors = ['#909399', '#E6A23C', '#409EFF', '#67C23A']
            return colors[params.dataIndex] || '#409EFF'
          }
        },
        barWidth: '35%',
        label: {
          show: true,
          position: 'top',
          formatter: p => p.value.toFixed(0),
          fontSize: 10
        }
      },
      {
        name: '预测收益',
        type: 'bar',
        yAxisIndex: 1,
        data: revenueData,
        itemStyle: {
          color: (params) => {
            const colors = ['rgba(144,147,153,0.6)', 'rgba(230,162,60,0.6)', 'rgba(64,158,255,0.6)', 'rgba(103,194,58,0.6)']
            return colors[params.dataIndex] || 'rgba(64,158,255,0.6)'
          }
        },
        barWidth: '35%',
        label: {
          show: true,
          position: 'top',
          formatter: p => '$' + (p.value / 1000).toFixed(0) + 'k',
          fontSize: 10
        }
      }
    ]
  })
}

const renderHeatmap = () => {
  if (!heatmapRef.value || !charts.value.heatmap) return
  heatmapChart?.dispose()
  heatmapChart = echarts.init(heatmapRef.value)
  const data = charts.value.heatmap.data || []
  const prices = [...new Set(data.map(d => d.price))].sort((a, b) => a - b)
  const discounts = [...new Set(data.map(d => d.discount))].sort((a, b) => a - b)
  const values = data.map(d => [
    discounts.indexOf(d.discount),
    prices.indexOf(d.price),
    d.revenue
  ])
  const revs = data.map(d => d.revenue)
  const minRev = Math.min(...revs)
  const maxRev = Math.max(...revs)
  heatmapChart.setOption({
    tooltip: {
      position: 'top',
      formatter: p => {
        const price = prices[p.data[1]]
        const disc = discounts[p.data[0]]
        return `价格:$${price.toFixed(2)}<br/>折扣:${disc.toFixed(1)}%<br/>收益:$${(p.data[2] / 1000).toFixed(1)}k`
      }
    },
    grid: { height: '65%', top: '10%' },
    xAxis: { type: 'category', data: discounts.map(d => d + '%'), name: '折扣' },
    yAxis: { type: 'category', data: prices.map(p => '$' + p.toFixed(0)), name: '价格' },
    visualMap: {
      min: minRev,
      max: maxRev,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '3%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      },
      formatter: v => '$' + (v / 1000).toFixed(0) + 'k'
    },
    series: [{
      type: 'heatmap',
      data: values,
      label: {
        show: true,
        formatter: p => (p.data[2] / 1000).toFixed(0) + 'k',
        fontSize: 9,
        color: '#ffffff'
      },
      emphasis: { 
        itemStyle: { 
          shadowBlur: 10, 
          shadowColor: 'rgba(0,0,0,0.5)' 
        } 
      }
    }]
  })
}

const renderPriceBand = () => {
  if (!priceBandRef.value || !charts.value.priceBand) return
  priceBandChart?.dispose()
  priceBandChart = echarts.init(priceBandRef.value)
  const data = charts.value.priceBand
  priceBandChart.setOption({
    tooltip: { 
      trigger: 'axis',
      formatter: params => {
        const p = params[0]
        if (!p) return ''
        const name = p.axisValue
        const val = Number(p.data || 0).toFixed(2)
        return `${name}<br/>销量: ${val}`
      }
    },
    xAxis: { type: 'category', data: data.map(d => '$' + d.priceBand), name: '价格带' },
    yAxis: { type: 'value', name: '销量' },
    series: [
      {
        type: 'bar',
        data: data.map(d => d.sales),
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
}

const disposeCharts = () => {
  priceSalesChart?.dispose()
  discountCurveChart?.dispose()
  riskRewardChart?.dispose()
  waterfallChart?.dispose()
  heatmapChart?.dispose()
  priceBandChart?.dispose()
}

const handleResize = () => {
  priceSalesChart?.resize()
  discountCurveChart?.resize()
  riskRewardChart?.resize()
  waterfallChart?.resize()
  heatmapChart?.resize()
  priceBandChart?.resize()
}

onMounted(() => {
  loadCategories()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
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
.card-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}
.metric-row {
  margin-bottom: 16px;
}
.metric-card {
  text-align: center;
}
.metric-label {
  font-size: 13px;
  color: #909399;
}
.metric-value {
  font-size: 24px;
  font-weight: 700;
}
.metric-value.primary {
  color: #409eff;
}
.metric-value.success {
  color: #67c23a;
}
.metric-value.warning {
  color: #e6a23c;
}
.metric-value.info {
  color: #909399;
}
.form-section {
  margin-bottom: 12px;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
}
.diagnosis-card {
  margin-bottom: 20px;
}
.price-highlight {
  color: #e6a23c;
  font-weight: 600;
  font-size: 15px;
}
.actual-price-highlight {
  color: #67c23a;
  font-weight: 600;
  font-size: 15px;
}
.price-danger {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
  background-color: #fef0f0;
  padding: 2px 6px;
  border-radius: 4px;
}
.price-warning {
  color: #e6a23c;
  font-weight: 600;
}
.competitor-price-highlight {
  color: #409eff;
  font-weight: 600;
  font-size: 15px;
}
.gap-positive {
  color: #67c23a;
  font-weight: 600;
}
.gap-negative {
  color: #f56c6c;
  font-weight: 600;
}
.suggestion-text {
  color: #606266;
  line-height: 1.6;
}
.impact-text {
  color: #67c23a;
  font-weight: 600;
}
.detail-suggestions {
  padding: 12px 0;
}
.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.suggestion-item:last-child {
  border-bottom: none;
}
.suggestion-label {
  font-weight: 600;
  color: #303133;
  min-width: 90px;
}
.suggestion-content {
  flex: 1;
  color: #606266;
  line-height: 1.6;
}
.strategy-section {
  margin-bottom: 20px;
}
.section-header {
  margin-bottom: 16px;
}
.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.strategy-card {
  height: 100%;
}
.strategy-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.strategy-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}
.strategy-detail {
  font-size: 14px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  color: #909399;
  font-size: 13px;
}
.detail-value {
  font-weight: 600;
  color: #303133;
}
.price-value {
  color: #e6a23c;
  font-size: 16px;
}
.sales-value {
  color: #409eff;
}
.revenue-value {
  color: #67c23a;
}
.chart-card {
  margin-top: 0;
}
.chart-grid {
  margin-top: 12px;
}
.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>


