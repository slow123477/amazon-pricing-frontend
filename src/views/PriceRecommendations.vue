<template>
  <div class="price-recommendations">
    <!-- 功能说明 -->
    <el-card shadow="hover" class="intro-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 决策中心 · 价格评估</span>
        </div>
      </template>
      <div class="card-subtitle">
        面向批量商品的价格评估分析工具，基于预测模型诊断价格合理性，可按分类/价格区间/诊断结果筛选，支持批量导出。
      </div>
    </el-card>

    <!-- 统计概览卡片 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="总商品数" :value="overview.totalCount || 0">
            <template #prefix>
              <el-icon style="vertical-align: -0.125em"><Box /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="价格偏高" :value="overview.highPriceCount || 0">
            <template #prefix>
              <el-icon style="vertical-align: -0.125em; color: #F56C6C"><ArrowUp /></el-icon>
            </template>
            <template #suffix>
              <span style="font-size: 14px; color: #909399; margin-left: 4px">
                ({{ getPercentage(overview.highPriceCount, overview.totalCount) }}%)
              </span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="价格偏低" :value="overview.lowPriceCount || 0">
            <template #prefix>
              <el-icon style="vertical-align: -0.125em; color: #E6A23C"><ArrowDown /></el-icon>
            </template>
            <template #suffix>
              <span style="font-size: 14px; color: #909399; margin-left: 4px">
                ({{ getPercentage(overview.lowPriceCount, overview.totalCount) }}%)
              </span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6" :md="6" :lg="6">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="价格合理" :value="overview.reasonablePriceCount || 0">
            <template #prefix>
              <el-icon style="vertical-align: -0.125em; color: #67C23A"><Check /></el-icon>
            </template>
            <template #suffix>
              <span style="font-size: 14px; color: #909399; margin-left: 4px">
                ({{ getPercentage(overview.reasonablePriceCount, overview.totalCount) }}%)
              </span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="overview-row" style="margin-top: 10px">
      <el-col :xs="12" :sm="8" :md="8" :lg="8">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="平均价格差距" :value="overview.avgPriceGap || 0" :precision="2">
            <template #prefix>$</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="8" :lg="8">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="平均实际价格" :value="overview.avgActualPrice || 0" :precision="2">
            <template #prefix>$</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="8" :lg="8">
        <el-card shadow="hover" class="overview-card">
          <el-statistic title="平均预测价格" :value="overview.avgPredictedPrice || 0" :precision="2">
            <template #prefix>$</template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据可视化 -->
    <el-row :gutter="20" class="chart-row" style="margin-top: 20px">
      <el-col :xs="24" :sm="12" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><PieChart /></el-icon> 诊断结果分布</span>
            </div>
          </template>
          <div ref="diagnosisChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><DataAnalysis /></el-icon> 价格差距分布</span>
              <el-tooltip content="价格差距 = 实际价格 - 预测价格。正值表示实际价格高于预测，负值表示实际价格低于预测。" placement="top">
                <el-icon style="cursor: help; color: #909399; margin-left: 5px"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="priceGapChartRef" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和操作栏 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span><el-icon><Document /></el-icon> 价格评估列表</span>
          <div style="float: right">
            <el-button 
              type="primary" 
              size="small" 
              @click="exportData" 
              :disabled="recommendations.length === 0 || exporting" 
              :loading="exporting">
              <el-icon><Download /></el-icon> 导出数据
            </el-button>
          </div>
        </div>
        <div class="card-subtitle">
          当前列表按商品聚合展示推荐价格和调整幅度，可通过筛选、勾选与导出功能，支持批量落地执行。
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入商品名称" clearable style="width: 200px" />
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
        <el-form-item label="诊断结果">
          <el-select v-model="searchForm.diagnosis" placeholder="全部" clearable style="width: 120px">
            <el-option label="价格偏高" value="价格偏高" />
            <el-option label="价格偏低" value="价格偏低" />
            <el-option label="价格合理" value="价格合理" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number
            v-model="searchForm.minPrice"
            :precision="2"
            :min="0"
            placeholder="最低价"
            style="width: 120px"
            clearable
          />
          <span style="margin: 0 8px">-</span>
          <el-input-number
            v-model="searchForm.maxPrice"
            :precision="2"
            :min="0"
            placeholder="最高价"
            style="width: 120px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">清空</el-button>
        </el-form-item>
      </el-form>

      <!-- 快速筛选按钮 -->
      <div style="margin-bottom: 15px;">
        <el-button-group>
          <el-button size="small" :type="searchForm.diagnosis === '价格偏高' ? 'primary' : ''" @click="quickFilter('价格偏高')">
            价格偏高 ({{ allOverview.highPriceCount || 0 }})
          </el-button>
          <el-button size="small" :type="searchForm.diagnosis === '价格偏低' ? 'primary' : ''" @click="quickFilter('价格偏低')">
            价格偏低 ({{ allOverview.lowPriceCount || 0 }})
          </el-button>
          <el-button size="small" :type="searchForm.diagnosis === '价格合理' ? 'primary' : ''" @click="quickFilter('价格合理')">
            价格合理 ({{ allOverview.reasonablePriceCount || 0 }})
          </el-button>
          <el-button size="small" :type="searchForm.diagnosis === '' ? 'primary' : ''" @click="quickFilter('')">
            全部
          </el-button>
        </el-button-group>
      </div>

      <el-table
        :data="recommendations"
        stripe
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="productTitle" label="商品名称" min-width="200" show-overflow-tooltip sortable="custom" />
        <el-table-column prop="productCategory" label="分类" width="120" />
        <el-table-column prop="actualPrice" label="实际价格" width="120" sortable="custom">
          <template #default="{ row }">
            <span style="color: #E6A23C; font-weight: 600">${{ row.actualPrice?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="predictedPrice" label="预测价格" width="120" sortable="custom">
          <template #default="{ row }">
            <span style="color: #409EFF; font-weight: 600">${{ row.predictedPrice?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priceGap" label="价格差距" width="130" sortable="custom">
          <template #default="{ row }">
            <span :style="{ color: getPriceGapColor(row.priceGap), fontWeight: 600 }">
              {{ row.priceGap > 0 ? '+' : '' }}${{ row.priceGap?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断结果" width="120">
          <template #default="{ row }">
            <el-tag :type="getDiagnosisTagType(row.diagnosis)" size="small">
              {{ row.diagnosis }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actualMonthlySales" label="月销量" width="100" sortable="custom">
          <template #default="{ row }">
            {{ row.actualMonthlySales ? row.actualMonthlySales.toFixed(0) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" label="优化建议" min-width="250" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
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

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="商品价格诊断详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称" :span="2">
            {{ currentDetail.productTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="商品分类">
            {{ currentDetail.productCategory }}
          </el-descriptions-item>
          <el-descriptions-item label="诊断结果">
            <el-tag :type="getDiagnosisTagType(currentDetail.diagnosis)">
              {{ currentDetail.diagnosis }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="实际价格">
            <span style="color: #E6A23C; font-weight: 600">${{ currentDetail.actualPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="预测价格">
            <span style="color: #409EFF; font-weight: 600">${{ currentDetail.predictedPrice?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="价格差距">
            <span :style="{ color: getPriceGapColor(currentDetail.priceGap), fontWeight: 600 }">
              {{ currentDetail.priceGap > 0 ? '+' : '' }}${{ currentDetail.priceGap?.toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="月销量">
            {{ currentDetail.actualMonthlySales ? currentDetail.actualMonthlySales.toFixed(0) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="分类平均价格">
            ${{ currentDetail.categoryAvgPrice?.toFixed(2) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="优化建议" :span="2">
            <span style="color: #606266">{{ currentDetail.suggestion }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="预计影响" :span="2" v-if="currentDetail.expectedSalesImpact">
            <span style="color: #67C23A; font-weight: 600">{{ currentDetail.expectedSalesImpact }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToDiagnosis">前往价格诊断</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { categoryApi } from '@/api/category'
import { priceApi } from '@/api/price'
import { ElMessage } from 'element-plus'
import { 
  Document, Search, Box, ArrowUp, ArrowDown, Check, 
  PieChart, DataAnalysis, Download, QuestionFilled
} from '@element-plus/icons-vue'

const router = useRouter()

const searchForm = ref({
  keyword: '',
  category: '',
  diagnosis: '',
  minPrice: null,
  maxPrice: null
})

const recommendations = ref([])
const categories = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const overview = ref({
  totalCount: 0,
  highPriceCount: 0,
  lowPriceCount: 0,
  reasonablePriceCount: 0,
  avgPriceGap: 0,
  avgActualPrice: 0,
  avgPredictedPrice: 0
})
// 全部数据的概览统计（用于快速筛选按钮显示，不受当前筛选条件影响）
const allOverview = ref({
  highPriceCount: 0,
  lowPriceCount: 0,
  reasonablePriceCount: 0
})

const diagnosisChartRef = ref(null)
const priceGapChartRef = ref(null)
let diagnosisChart = null
let priceGapChart = null

const detailDialogVisible = ref(false)
const currentDetail = ref(null)

// 排序状态
const sortBy = ref('')
const sortOrder = ref('')

// 图表数据（全部筛选后的数据，不分页）
const chartData = ref([])

// 去重显示控制（功能已取消，仅保留全部记录展示）
const allRecommendations = ref([]) // 存储所有原始数据
const exporting = ref(false) // 导出状态
const EXPORT_PAGE_SIZE = 10000

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    categories.value = data.map(item => item.productCategory)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载全部数据的概览统计（用于快速筛选按钮）
const loadAllOverview = async () => {
  try {
    const params = {
      category: searchForm.value.category || undefined,
      keyword: searchForm.value.keyword || undefined,
      minPrice: searchForm.value.minPrice || undefined,
      maxPrice: searchForm.value.maxPrice || undefined
      // 不传diagnosis，获取全部诊断结果的统计
    }
    const data = await priceApi.getRecommendationsOverview(params)
    if (data) {
      allOverview.value = {
        highPriceCount: data.highPriceCount || 0,
        lowPriceCount: data.lowPriceCount || 0,
        reasonablePriceCount: data.reasonablePriceCount || 0
      }
    }
  } catch (error) {
    console.error('加载全部概览统计失败:', error)
  }
}

// 加载概览统计（基于当前筛选条件）
const loadOverview = async () => {
  try {
    const params = {
      category: searchForm.value.category || undefined,
      keyword: searchForm.value.keyword || undefined,
      minPrice: searchForm.value.minPrice || undefined,
      maxPrice: searchForm.value.maxPrice || undefined,
      diagnosis: searchForm.value.diagnosis || undefined
    }
    const data = await priceApi.getRecommendationsOverview(params)
    if (data) {
      overview.value = {
        totalCount: data.totalCount || 0,
        highPriceCount: data.highPriceCount || 0,
        lowPriceCount: data.lowPriceCount || 0,
        reasonablePriceCount: data.reasonablePriceCount || 0,
        avgPriceGap: data.avgPriceGap || 0,
        avgActualPrice: data.avgActualPrice || 0,
        avgPredictedPrice: data.avgPredictedPrice || 0
      }
    }
  } catch (error) {
    console.error('加载概览统计失败:', error)
  }
}

// 加载图表数据（全部筛选后的数据，不分页）
const loadChartData = async () => {
  try {
    const params = {
      category: searchForm.value.category || undefined,
      keyword: searchForm.value.keyword || undefined,
      diagnosis: searchForm.value.diagnosis || undefined,
      minPrice: searchForm.value.minPrice || undefined,
      maxPrice: searchForm.value.maxPrice || undefined,
      pageNum: 1,
      pageSize: 100000 // 获取所有数据用于图表统计
    }
    const data = await priceApi.getRecommendations(params)
    chartData.value = data.list || []
  } catch (error) {
    console.error('加载图表数据失败:', error)
  }
}

// 存储原始总数（用于分页计算）
const originalTotal = ref(0)

// 加载价格评估列表
const loadRecommendations = async () => {
  loading.value = true
  try {
    const params = {
      category: searchForm.value.category || undefined,
      keyword: searchForm.value.keyword || undefined,
      diagnosis: searchForm.value.diagnosis || undefined,
      minPrice: searchForm.value.minPrice || undefined,
      maxPrice: searchForm.value.maxPrice || undefined,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value || undefined,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    const data = await priceApi.getRecommendations(params)
    allRecommendations.value = data.list || []
    originalTotal.value = data.total || 0

    // 直接显示全部记录
    recommendations.value = allRecommendations.value
    total.value = originalTotal.value
    
    // 加载完数据后更新图表
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('加载推荐列表失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderCharts = () => {
  // 诊断结果分布饼图
  if (diagnosisChartRef.value) {
    if (diagnosisChart) {
      diagnosisChart.dispose()
    }
    diagnosisChart = echarts.init(diagnosisChartRef.value)
    
    const totalDiagnosis = (overview.value.highPriceCount || 0) + 
                          (overview.value.lowPriceCount || 0) + 
                          (overview.value.reasonablePriceCount || 0)
    
    if (totalDiagnosis > 0) {
      const diagnosisData = [
        { value: overview.value.highPriceCount || 0, name: '价格偏高', itemStyle: { color: '#F56C6C' } },
        { value: overview.value.lowPriceCount || 0, name: '价格偏低', itemStyle: { color: '#E6A23C' } },
        { value: overview.value.reasonablePriceCount || 0, name: '价格合理', itemStyle: { color: '#67C23A' } }
      ]
      
      diagnosisChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            type: 'pie',
            radius: '60%',
            data: diagnosisData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}\n{c} ({d}%)'
            }
          }
        ]
      })
    } else {
      // 没有数据时显示提示
      diagnosisChart.setOption({
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 16,
            color: '#999'
          }
        },
        xAxis: { show: false },
        yAxis: { show: false }
      })
    }
  }

  // 价格差距分布柱状图（使用全部筛选后的数据）
  if (priceGapChartRef.value && chartData.value.length > 0) {
    if (priceGapChart) {
      priceGapChart.dispose()
    }
    priceGapChart = echarts.init(priceGapChartRef.value)
    
    // 计算价格差距分布（使用更清晰的标签）
    const gapRanges = [
      { name: '低于预测$50以上', desc: '实际价格比预测价格低$50以上', min: -Infinity, max: -50, count: 0 },
      { name: '低于预测$20-$50', desc: '实际价格比预测价格低$20-$50', min: -50, max: -20, count: 0 },
      { name: '低于预测$0-$20', desc: '实际价格比预测价格低$0-$20', min: -20, max: 0, count: 0 },
      { name: '高于预测$0-$20', desc: '实际价格比预测价格高$0-$20', min: 0, max: 20, count: 0 },
      { name: '高于预测$20-$50', desc: '实际价格比预测价格高$20-$50', min: 20, max: 50, count: 0 },
      { name: '高于预测$50以上', desc: '实际价格比预测价格高$50以上', min: 50, max: Infinity, count: 0 }
    ]
    
    chartData.value.forEach(item => {
      const gap = item.priceGap || 0
      gapRanges.forEach(range => {
        if (gap >= range.min && gap < range.max) {
          range.count++
        }
      })
    })
    
    // 使用chartData的实际长度作为统计基数（与柱状图统计一致）
    const totalCount = chartData.value.length
    
    priceGapChart.setOption({
      title: {
        text: `共 ${totalCount} 个商品`,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 14,
          color: '#666'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const param = params[0]
          const range = gapRanges[param.dataIndex]
          const percentage = totalCount > 0 ? ((range.count / totalCount) * 100).toFixed(2) : 0
          return `${range.desc}<br/>商品数量: ${range.count} (${percentage}%)`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: gapRanges.map(r => r.name),
        axisLabel: {
          rotate: 15,
          interval: 0,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: '商品数量',
        nameLocation: 'middle',
        nameGap: 50
      },
      series: [
        {
          type: 'bar',
          data: gapRanges.map(r => ({
            value: r.count,
            itemStyle: {
              color: r.min < 0 ? '#E6A23C' : '#409EFF' // 负值用橙色，正值用蓝色
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: (params) => {
              const count = params.value
              const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(2) : 0
              return count > 0 ? `${count}\n(${percentage}%)` : ''
            },
            fontSize: 11
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  } else if (priceGapChartRef.value && chartData.value.length === 0) {
    // 没有数据时显示提示
    if (priceGapChart) {
      priceGapChart.dispose()
    }
    priceGapChart = echarts.init(priceGapChartRef.value)
    priceGapChart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: 16,
          color: '#999'
        }
      },
      xAxis: { show: false },
      yAxis: { show: false }
    })
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 加载所有数据（概览+列表+图表数据）
const loadData = async () => {
  // 并行加载：全部概览（用于按钮）、当前筛选概览（用于卡片）、图表数据、列表数据
  await Promise.all([
    loadAllOverview(), // 加载全部数据的概览（用于快速筛选按钮）
    loadOverview(),    // 加载当前筛选条件的概览（用于概览卡片）
    loadChartData(), 
    loadRecommendations()
  ])
  // 所有数据加载完成后再渲染图表
  await nextTick()
  renderCharts()
}

// 重置搜索表单
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    category: '',
    diagnosis: '',
    minPrice: null,
    maxPrice: null
  }
  currentPage.value = 1
  loadData()
}

// 快速筛选
const quickFilter = (diagnosis) => {
  searchForm.value.diagnosis = diagnosis
  handleSearch()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
  if (prop && order) {
    // Element Plus 的 order 值：'ascending' 或 'descending'
    sortBy.value = prop
    sortOrder.value = order // 直接使用，因为后端也接受 'ascending' 和 'descending'
  } else {
    // 取消排序，恢复默认
    sortBy.value = ''
    sortOrder.value = ''
  }
  
  // 重置到第一页并重新加载数据
  currentPage.value = 1
  loadRecommendations()
}

// 查看详情
const viewDetail = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

// 前往商品决策（已合并诊断能力）
const goToDiagnosis = () => {
  detailDialogVisible.value = false
  router.push({
    path: '/decision-center',
    query: {
      category: currentDetail.value.productCategory,
      price: currentDetail.value.actualPrice
    }
  })
}

// 导出数据
const fetchAllRecommendationsForExport = async () => {
  const allData = []
  let pageNumForExport = 1
  let totalRecords = 0
  while (true) {
    const params = {
      category: searchForm.value.category || undefined,
      keyword: searchForm.value.keyword || undefined,
      diagnosis: searchForm.value.diagnosis || undefined,
      minPrice: searchForm.value.minPrice || undefined,
      maxPrice: searchForm.value.maxPrice || undefined,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value || undefined,
      pageNum: pageNumForExport,
      pageSize: EXPORT_PAGE_SIZE
    }

    const data = await priceApi.getRecommendations(params)
    const list = data.list || []
    if (list.length === 0) break

    allData.push(...list)
    totalRecords = data.total || totalRecords

    if (allData.length >= totalRecords || list.length < EXPORT_PAGE_SIZE || pageNumForExport > 200) {
      break
    }
    pageNumForExport += 1
  }

  return allData
}

const exportData = async () => {
  try {
    exporting.value = true
    const allData = await fetchAllRecommendationsForExport()
    if (!allData.length) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const exportList = allData
    const headers = ['商品名称', '分类', '实际价格', '预测价格', '价格差距', '诊断结果', '月销量', '优化建议']
    const rows = exportList.map(item => [
    item.productTitle,
    item.productCategory,
    item.actualPrice?.toFixed(2) || '',
    item.predictedPrice?.toFixed(2) || '',
    item.priceGap?.toFixed(2) || '',
    item.diagnosis || '',
    item.actualMonthlySales?.toFixed(0) || '',
    item.suggestion || ''
  ])
  
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `价格评估列表_${new Date().getTime()}.csv`
    link.click()
    
    ElMessage.success(`导出成功，共 ${rows.length} 条记录`)
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}

// 获取诊断结果的标签类型
const getDiagnosisTagType = (diagnosis) => {
  if (diagnosis?.includes('偏高')) return 'danger'
  if (diagnosis?.includes('偏低')) return 'warning'
  return 'success'
}

// 获取价格差距颜色
const getPriceGapColor = (gap) => {
  if (!gap) return '#909399'
  if (gap > 50) return '#F56C6C'
  if (gap > 0) return '#E6A23C'
  if (gap > -20) return '#67C23A'
  return '#409EFF'
}

// 计算百分比
const getPercentage = (value, total) => {
  if (!total || total === 0) return '0.00'
  return ((value / total) * 100).toFixed(2)
}

// 监听筛选条件变化，自动更新概览和图表数据
watch(
  () => [searchForm.value.category, searchForm.value.keyword, searchForm.value.diagnosis, searchForm.value.minPrice, searchForm.value.maxPrice],
  async () => {
    await Promise.all([loadOverview(), loadChartData()])
    await nextTick()
    renderCharts()
  },
  { deep: true }
)

onMounted(() => {
  loadCategories()
  loadData()
})

// 组件卸载时销毁图表
onUnmounted(() => {
  if (diagnosisChart) {
    diagnosisChart.dispose()
  }
  if (priceGapChart) {
    priceGapChart.dispose()
  }
})
</script>

<style scoped>
.price-recommendations {
  padding: 0;
}

.intro-card {
  margin-bottom: 16px;
}

.overview-row {
  margin-bottom: 0;
}

.overview-card {
  text-align: center;
}

.chart-row {
  margin-bottom: 0;
}

.chart-card {
  height: 100%;
}

.card-header {
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.intro-card .card-header .el-icon {
  margin-right: 8px;
}

.card-subtitle {
  font-size: 13px;
  color: #909399;
}

.search-form {
  margin-bottom: 20px;
}

.quick-filters {
  margin-top: 10px;
}

.detail-content {
  padding: 10px 0;
}
</style>
