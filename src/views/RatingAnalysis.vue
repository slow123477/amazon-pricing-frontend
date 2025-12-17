<template>
  <div class="page rating-analysis">
    <!-- 顶部关键统计指标卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">评分-销量相关系数</div>
            <div class="stat-value" :style="{ color: getCorrelationColor(stats.ratingSalesCorr) }">
              {{ formatCorrelation(stats.ratingSalesCorr) }}
            </div>
            <div class="stat-desc">整体相关性分析</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">评分-价格相关系数</div>
            <div class="stat-value" :style="{ color: getCorrelationColor(stats.ratingPriceCorr) }">
              {{ formatCorrelation(stats.ratingPriceCorr) }}
            </div>
            <div class="stat-desc">整体相关性分析</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">高评分商品平均销量</div>
            <div class="stat-value" style="color: #67C23A">
              {{ formatNumber(stats.highRatingAvgSales) }}
            </div>
            <div class="stat-desc">vs 低评分: {{ formatNumber(stats.lowRatingAvgSales) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">高评分商品占比</div>
            <div class="stat-value" style="color: #409EFF">
              {{ formatPercent(stats.highRatingRatio) }}
            </div>
            <div class="stat-desc">评分≥4.5的商品占比</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 顶部筛选卡片暂时移除，只保留下方核心图表和机会榜 -->

    <!-- 核心分析图表：评分对销量和价格的影响分析（整体卡片 + 内部两张图） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="chart-header">
          <div>
            <span class="chart-title">评分对销量和价格的影响分析</span>
          </div>
          <el-button type="primary" :loading="loading" @click="loadAll">
            重新加载
          </el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>评分对销量的影响分析</span>
              </div>
            </template>
            <div ref="salesChart" class="medium-chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>评分对价格的影响分析</span>
              </div>
            </template>
            <div ref="priceChart" class="medium-chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 核心分析图表3：评分对收益的综合影响分析（拆成两张图：柱状 + 饼图） -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="chart-header">
          <div>
            <span class="chart-title">评分对收益的综合影响分析</span>
          </div>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>不同评分区间的平均收益</span>
              </div>
            </template>
            <div ref="revenueBarChart" class="medium-chart"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <div class="card-header">
                <span>各评分区间对总收益的贡献占比</span>
              </div>
            </template>
            <div ref="revenuePieChart" class="medium-chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="section-card">
      <template #header>高评分低销量机会榜</template>
      <el-table :data="highRatingLowSales" height="360px" v-loading="loadingOpportunity">
        <el-table-column prop="productTitle" label="商品" min-width="200" show-overflow-tooltip />
        <el-table-column prop="productRating" label="评分" width="80" />
        <el-table-column prop="purchasedLastMonth" label="月销量" width="90" />
        <el-table-column prop="totalReviews" label="评论数" width="90" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import { ratingApi } from '@/api/rating'
import { ElMessage } from 'element-plus'

const distributionChart = ref(null)
const salesChart = ref(null)
const priceChart = ref(null)
const revenueBarChart = ref(null)
const revenuePieChart = ref(null)
let distributionInstance = null
let salesInstance = null
let priceInstance = null
let revenueBarInstance = null
let revenuePieInstance = null

const distribution = ref([])
const salesRelation = ref([])
const priceRelation = ref([])
const revenueHeatmapData = ref([]) // 收益热力图数据
const highRatingLowSales = ref([])
const ratingCorrelation = ref([])

// 顶部统计指标
const stats = ref({
  ratingSalesCorr: null,      // 评分-销量相关系数（整体）
  ratingPriceCorr: null,      // 评分-价格相关系数（整体）
  highRatingAvgSales: null,   // 高评分商品平均销量（≥4.5）
  lowRatingAvgSales: null,    // 低评分商品平均销量（<4.0）
  highRatingRatio: null       // 高评分商品占比
})

const loading = ref(false)
const loadingOpportunity = ref(false)
const loadingCorrelation = ref(false)

const disposeCharts = () => {
  if (salesInstance) salesInstance.dispose()
  if (priceInstance) priceInstance.dispose()
  if (revenueBarInstance) revenueBarInstance.dispose()
  if (revenuePieInstance) revenuePieInstance.dispose()
  // 暂时移除其他图表实例
  // if (distributionInstance) distributionInstance.dispose()
  salesInstance = null
  priceInstance = null
  revenueBarInstance = null
  revenuePieInstance = null
  // distributionInstance = null
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
  
  // 准备数据：评分作为X轴，销量作为Y轴
  const data = salesRelation.value.map(item => {
    const ratingBucket = item.ratingBucket || 0
    const avgSales = item.avgMonthlySales || 0
    const productCount = item.productCount || 0
    return [ratingBucket, avgSales, productCount] // [评分, 销量, 商品数（用于气泡大小）]
  })
  
  // 计算趋势线（线性回归）
  const trendLine = calculateTrendLine(data)
  
  // 找出关键数据点
  const maxSalesPoint = data.reduce((max, point) => point[1] > max[1] ? point : max, data[0])
  const minSalesPoint = data.reduce((min, point) => point[1] < min[1] ? point : min, data[0])
  
  salesInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesName === '散点数据') {
          const point = data[params.dataIndex]
          return [
            `评分区间：${point[0].toFixed(1)}分`,
            `平均销量：${point[1].toFixed(0)}`,
            `商品数量：${point[2]}`
          ].join('<br/>')
        } else if (params.seriesName === '趋势线') {
          return `趋势线：评分 ${params.value[0].toFixed(1)}分 → 销量 ${params.value[1].toFixed(0)}`
        }
        return ''
      }
    },
    legend: {
      data: ['散点数据', '趋势线', '关键点'],
      bottom: 10
    },
    xAxis: {
      type: 'value',
      name: '评分',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 5,
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed' }
      }
    },
    yAxis: {
      type: 'value',
      name: '平均销量',
      nameLocation: 'middle',
      nameGap: 50,
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed' }
      }
    },
    series: [
      {
        name: '散点数据',
        type: 'scatter',
        data: data.map((point, index) => ({
          value: [point[0], point[1]],
          symbolSize: Math.max(20, Math.min(60, point[2] / 100)), // 根据商品数调整大小
          itemStyle: {
            color: '#409EFF',
            opacity: 0.7
          }
        })),
        emphasis: {
          itemStyle: {
            borderColor: '#409EFF',
            borderWidth: 2
          }
        }
      },
      {
        name: '趋势线',
        type: 'line',
        data: trendLine,
        smooth: true,
        lineStyle: {
          color: '#67C23A',
          width: 3,
          type: 'dashed'
        },
        symbol: 'none',
        tooltip: {
          show: true
        }
      },
      {
        name: '关键点',
        type: 'scatter',
        data: [
          {
            value: [maxSalesPoint[0], maxSalesPoint[1]],
            symbol: 'pin',
            symbolSize: 50,
            itemStyle: { color: '#67C23A' },
            label: {
              show: true,
              formatter: '最高销量',
              position: 'top',
              color: '#67C23A',
              fontWeight: 'bold'
            }
          },
          {
            value: [minSalesPoint[0], minSalesPoint[1]],
            symbol: 'pin',
            symbolSize: 50,
            itemStyle: { color: '#F56C6C' },
            label: {
              show: true,
              formatter: '最低销量',
              position: 'bottom',
              color: '#F56C6C',
              fontWeight: 'bold'
            }
          }
        ]
      }
    ],
    grid: {
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '15%',
      containLabel: true
    }
  })
}

// 计算趋势线（简单线性回归）
const calculateTrendLine = (data) => {
  if (!data || data.length === 0) return []
  
  // 计算线性回归
  const n = data.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  
  data.forEach(point => {
    const x = point[0]
    const y = point[1]
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // 生成趋势线上的点
  const minX = Math.min(...data.map(p => p[0]))
  const maxX = Math.max(...data.map(p => p[0]))
  const trendPoints = []
  
  for (let x = minX; x <= maxX; x += 0.1) {
    const y = slope * x + intercept
    trendPoints.push([x, y])
  }
  
  return trendPoints
}

// 获取销量分析洞察
const getSalesInsight = () => {
  if (!salesRelation.value || salesRelation.value.length === 0) return ''
  
  const data = salesRelation.value.map(item => ({
    rating: item.ratingBucket || 0,
    sales: item.avgMonthlySales || 0
  }))
  
  // 找出高评分和低评分的平均销量
  const highRating = data.filter(d => d.rating >= 4.5)
  const lowRating = data.filter(d => d.rating < 4.0)
  
  const highAvg = highRating.length > 0 
    ? highRating.reduce((sum, d) => sum + d.sales, 0) / highRating.length 
    : 0
  const lowAvg = lowRating.length > 0 
    ? lowRating.reduce((sum, d) => sum + d.sales, 0) / lowRating.length 
    : 0
  
  const ratio = lowAvg > 0 ? (highAvg / lowAvg).toFixed(2) : '--'
  
  // 找出销量最高的评分区间
  const maxSalesData = data.reduce((max, d) => d.sales > max.sales ? d : max, data[0])
  
  let insight = `分析发现：`
  if (highAvg > 0 && lowAvg > 0) {
    insight += `高评分商品（≥4.5分）平均销量为 ${highAvg.toFixed(0)}，`
    insight += `低评分商品（<4.0分）平均销量为 ${lowAvg.toFixed(0)}，`
    insight += `高评分商品销量是低评分的 ${ratio} 倍。`
  }
  insight += `销量最高的评分区间为 ${maxSalesData.rating.toFixed(1)} 分，平均销量 ${maxSalesData.sales.toFixed(0)}。`
  
  return insight
}

const renderPriceRelation = () => {
  if (!priceRelation.value.length || !priceChart.value) return
  if (priceInstance) priceInstance.dispose()
  priceInstance = echarts.init(priceChart.value)

  // 准备数据：按评分区间展示“平均折后价 vs 平均原价”的对比条形图
  const categories = priceRelation.value.map(item => {
    const ratingBucket = item.ratingBucket || item.rating_bucket || 0
    return `${ratingBucket.toFixed(1)}分`
  })
  const discountedPrices = priceRelation.value.map(item => item.avgDiscountedPrice || item.avg_discounted_price || 0)
  const originalPrices = priceRelation.value.map(item => item.avgOriginalPrice || item.avg_original_price || 0)

  priceInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          const value = param.value || 0
          result += `${param.seriesName}: $${value.toFixed(2)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['平均折后价', '平均原价'],
      bottom: 10
    },
    xAxis: {
      type: 'category',
      data: categories,
      name: '评分区间',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: '价格 ($)',
      nameLocation: 'middle',
      nameGap: 50,
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed' }
      }
    },
    series: [
      {
        name: '平均折后价',
        type: 'bar',
        data: discountedPrices,
        itemStyle: {
          color: '#67C23A'
        },
        label: {
          show: true,
          position: 'top',
          formatter: params => `$${params.value.toFixed(2)}`,
          fontSize: 11
        }
      },
      {
        name: '平均原价',
        type: 'bar',
        data: originalPrices,
        itemStyle: {
          color: '#F56C6C'
        },
        label: {
          show: true,
          position: 'top',
          formatter: params => `$${params.value.toFixed(2)}`,
          fontSize: 11
        }
      }
    ],
    grid: {
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '15%',
      containLabel: true
    }
  })
}

// 获取价格分析洞察
const getPriceInsight = () => {
  if (!priceRelation.value || priceRelation.value.length === 0) return ''
  
  const data = priceRelation.value.map(item => ({
    rating: item.ratingBucket || 0,
    discountedPrice: item.avgDiscountedPrice || 0,
    originalPrice: item.avgOriginalPrice || 0
  }))
  
  // 找出高评分和低评分的平均价格
  const highRating = data.filter(d => d.rating >= 4.5)
  const lowRating = data.filter(d => d.rating < 4.0)
  
  const highAvgDiscounted = highRating.length > 0 
    ? highRating.reduce((sum, d) => sum + d.discountedPrice, 0) / highRating.length 
    : 0
  const lowAvgDiscounted = lowRating.length > 0 
    ? lowRating.reduce((sum, d) => sum + d.discountedPrice, 0) / lowRating.length 
    : 0
  
  const highAvgOriginal = highRating.length > 0 
    ? highRating.reduce((sum, d) => sum + d.originalPrice, 0) / highRating.length 
    : 0
  const lowAvgOriginal = lowRating.length > 0 
    ? lowRating.reduce((sum, d) => sum + d.originalPrice, 0) / lowRating.length 
    : 0
  
  // 找出价格最高的评分区间
  const maxPriceData = data.reduce((max, d) => d.discountedPrice > max.discountedPrice ? d : max, data[0])
  const minPriceData = data.reduce((min, d) => d.discountedPrice < min.discountedPrice ? d : min, data[0])
  
  let insight = `分析发现：`
  if (highAvgDiscounted > 0 && lowAvgDiscounted > 0) {
    insight += `高评分商品（≥4.5分）平均折后价为 $${highAvgDiscounted.toFixed(2)}，`
    insight += `低评分商品（<4.0分）平均折后价为 $${lowAvgDiscounted.toFixed(2)}，`
    const priceDiff = highAvgDiscounted - lowAvgDiscounted
    if (priceDiff > 0) {
      insight += `高评分商品价格比低评分高 $${priceDiff.toFixed(2)}。`
    } else {
      insight += `高评分商品价格比低评分低 $${Math.abs(priceDiff).toFixed(2)}。`
    }
  }
  insight += `折后价最高的评分区间为 ${maxPriceData.rating.toFixed(1)} 分，平均价格 $${maxPriceData.discountedPrice.toFixed(2)}；`
  insight += `折后价最低的评分区间为 ${minPriceData.rating.toFixed(1)} 分，平均价格 $${minPriceData.discountedPrice.toFixed(2)}。`
  
  return insight
}

// 渲染收益分析图（拆成两张图：柱状图 + 饼图）
const renderRevenueHeatmap = () => {
  try {
    console.log('开始渲染收益分析图', {
      salesLength: salesRelation.value?.length || 0,
      priceLength: priceRelation.value?.length || 0,
      barChartRef: !!revenueBarChart.value,
      pieChartRef: !!revenuePieChart.value,
      salesData: salesRelation.value,
      priceData: priceRelation.value
    })
    
    if (!salesRelation.value || !salesRelation.value.length || !priceRelation.value || !priceRelation.value.length || !revenueBarChart.value || !revenuePieChart.value) {
      console.warn('收益分析图：数据未准备好', {
        salesLength: salesRelation.value?.length || 0,
        priceLength: priceRelation.value?.length || 0,
        barChartRef: !!revenueBarChart.value,
        pieChartRef: !!revenuePieChart.value
      })
      return
    }
    
    if (revenueBarInstance) revenueBarInstance.dispose()
    if (revenuePieInstance) revenuePieInstance.dispose()
    revenueBarInstance = echarts.init(revenueBarChart.value)
    revenuePieInstance = echarts.init(revenuePieChart.value)
    
    // 合并销量和价格数据，计算收益
    const revenueData = []
    const ratingBuckets = []
    
    // 为每个评分区间计算收益
    salesRelation.value.forEach(salesItem => {
      // 兼容不同的字段命名方式
      const rating = salesItem.ratingBucket || salesItem.rating_bucket || 0
      const avgSales = salesItem.avgMonthlySales || salesItem.avg_monthly_sales || 0
      
      // 找到对应的价格数据
      const priceItem = priceRelation.value.find(p => 
        (p.ratingBucket || p.rating_bucket) === rating
      )
      if (!priceItem) {
        console.warn('未找到对应的价格数据', { rating, salesItem })
        return
      }
      
      const avgPrice = priceItem.avgDiscountedPrice || priceItem.avg_discounted_price || 0
      const revenue = avgPrice * avgSales
      
      if (rating > 0 && avgSales > 0 && avgPrice > 0) {
        revenueData.push({
          rating,
          price: avgPrice,
          sales: avgSales,
          revenue
        })
        
        if (!ratingBuckets.includes(rating)) {
          ratingBuckets.push(rating)
        }
      } else {
        console.warn('跳过无效数据点', { rating, avgSales, avgPrice, salesItem, priceItem })
      }
    })
    
    console.log('收益数据计算结果', { revenueData, ratingBuckets })
    
    if (revenueData.length === 0) {
      console.warn('收益热力图：没有有效数据', {
        salesRelation: salesRelation.value,
        priceRelation: priceRelation.value
      })
      // 显示提示信息
      ElMessage.warning('收益热力图：数据为空，请确保已运行评分分析任务并同步数据到MySQL')
      return
    }
    
    ratingBuckets.sort((a, b) => a - b)

    // 将数据按评分聚合，得到每个评分区间的总收益 / 平均收益
    const barCategories = ratingBuckets.map(r => `${r.toFixed(1)}分`)
    const barData = []
    const pieData = []

    ratingBuckets.forEach(rating => {
      const list = revenueData.filter(d => Math.abs(d.rating - rating) < 0.1)
      if (list.length === 0) return

      const totalRevenue = list.reduce((sum, d) => sum + d.revenue, 0)
      const avgRevenue = totalRevenue / list.length

      barData.push(avgRevenue)
      pieData.push({
        name: `${rating.toFixed(1)}分`,
        value: totalRevenue
      })
    })

    if (!barData.length || !pieData.length) {
      console.warn('收益分析：聚合后无有效数据', { revenueData, ratingBuckets })
      ElMessage.warning('收益分析：数据为空，请确认评分-销量和评分-价格分析任务已完成')
      return
    }

    const maxRevenue = Math.max(...barData, 1)

    // 左侧：柱状图（不同评分区间的平均收益）
    revenueBarInstance.setOption({
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '10%',
        right: '5%',
        top: '15%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: barCategories,
        name: '评分',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '平均收益 ($)',
        nameLocation: 'middle',
        nameGap: 55,
        max: maxRevenue * 1.1,
        axisLabel: {
          formatter: (value) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
            if (value >= 1000) return (value / 1000).toFixed(0) + 'K'
            return value.toFixed(0)
          }
        }
      },
      series: [
        {
          name: '平均收益',
          type: 'bar',
          data: barData,
          itemStyle: {
            color: '#409EFF'
          },
          label: {
            show: true,
            position: 'top',
            formatter: (val) => {
              const v = val.value
              if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
              if (v >= 1000) return (v / 1000).toFixed(0) + 'K'
              return v.toFixed(0)
            },
            fontSize: 11
          }
        }
      ]
    })

    // 右侧：饼图（各评分区间对总收益的贡献占比）
    revenuePieInstance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const v = params.value
          let valueStr = ''
          if (v >= 1000000) valueStr = (v / 1000000).toFixed(1) + 'M'
          else if (v >= 1000) valueStr = (v / 1000).toFixed(0) + 'K'
          else valueStr = v.toFixed(0)
          return `${params.name}<br/>总收益：$${valueStr}<br/>占比：${params.percent}%`
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20
      },
      series: [
        {
          name: '收益占比',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          data: pieData,
          label: {
            formatter: '{b}\n{d}%',
            fontSize: 11
          },
          labelLine: {
            length: 10,
            length2: 8
          }
        }
      ]
    })

    // 保存明细数据用于洞察文字
    revenueHeatmapData.value = revenueData
  } catch (error) {
    console.error('渲染收益热力图失败:', error)
    ElMessage.error('渲染收益热力图失败: ' + (error.message || '未知错误'))
  }
}

// 获取收益分析洞察
const getRevenueInsight = () => {
  if (!revenueHeatmapData.value || revenueHeatmapData.value.length === 0) return ''
  
  const data = revenueHeatmapData.value
  
  // 找出高评分和低评分的平均收益
  const highRating = data.filter(d => d.rating >= 4.5)
  const lowRating = data.filter(d => d.rating < 4.0)
  
  const highAvgRevenue = highRating.length > 0 
    ? highRating.reduce((sum, d) => sum + d.revenue, 0) / highRating.length 
    : 0
  const lowAvgRevenue = lowRating.length > 0 
    ? lowRating.reduce((sum, d) => sum + d.revenue, 0) / lowRating.length 
    : 0
  
  // 找出收益最高的组合
  const maxRevenueData = data.reduce((max, d) => d.revenue > max.revenue ? d : max, data[0])
  
  let insight = `分析发现：`
  if (highAvgRevenue > 0 && lowAvgRevenue > 0) {
    insight += `高评分商品（≥4.5分）平均收益为 $${highAvgRevenue.toFixed(2)}，`
    insight += `低评分商品（<4.0分）平均收益为 $${lowAvgRevenue.toFixed(2)}，`
    const ratio = lowAvgRevenue > 0 ? (highAvgRevenue / lowAvgRevenue).toFixed(2) : '--'
    insight += `高评分商品收益是低评分的 ${ratio} 倍。`
  }
  insight += `收益最高的组合为评分 ${maxRevenueData.rating.toFixed(1)} 分、价格 $${maxRevenueData.price.toFixed(2)}，收益 $${maxRevenueData.revenue.toFixed(2)}。`
  
  return insight
}

const renderCharts = () => {
  renderSalesRelation()
  renderPriceRelation()
  renderRevenueHeatmap()
  // 暂时移除其他图表，后续会重新添加
  // renderDistribution()
}

const loadDistribution = () => ratingApi.getDistribution().then(res => { distribution.value = res || [] })
const loadSalesRelation = () => ratingApi.getSalesRelation().then(res => { salesRelation.value = res || [] })
const loadPriceRelation = () => ratingApi.getPriceRelation().then(res => { priceRelation.value = res || [] })

const loadOpportunities = async () => {
  loadingOpportunity.value = true
  try {
    const res = await ratingApi.getHighRatingLowSales()
    highRatingLowSales.value = res || []
  } catch (e) {
    console.error(e)
    ElMessage.error('加载机会榜失败')
  } finally {
    loadingOpportunity.value = false
  }
}

const loadCorrelation = async () => {
  loadingCorrelation.value = true
  try {
    const data = await ratingApi.getCorrelation()
    ratingCorrelation.value = data || []
  } catch (e) {
    console.error(e)
    ElMessage.error('加载相关性数据失败')
  } finally {
    loadingCorrelation.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadDistribution(), loadSalesRelation(), loadPriceRelation(), loadCategories(), loadCorrelation()])
    await nextTick()
    calculateStats() // 计算统计指标
    renderCharts()
    await loadOpportunities()
    ElMessage.success('评分分析数据已更新')
  } catch (e) {
    console.error(e)
    ElMessage.error('加载评分分析数据失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {}

const formatCorr = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  return Number(val).toFixed(2)
}

const formatNumber = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  return Number(val).toFixed(2)
}

// 格式化相关系数
const formatCorrelation = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  const num = Number(val)
  return num.toFixed(2)
}

// 格式化百分比
const formatPercent = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '--'
  return (Number(val) * 100).toFixed(1) + '%'
}

// 根据相关系数返回颜色
const getCorrelationColor = val => {
  if (val === null || val === undefined || Number.isNaN(val)) return '#909399'
  const num = Math.abs(Number(val))
  if (num >= 0.5) return '#67C23A'  // 强相关 - 绿色
  if (num >= 0.3) return '#E6A23C'  // 中等相关 - 橙色
  if (num >= 0.1) return '#409EFF'  // 弱相关 - 蓝色
  return '#909399'                  // 几乎无关 - 灰色
}

// 计算统计指标
const calculateStats = () => {
  // 1. 计算整体相关系数（从分类相关性数据中加权平均）
  if (ratingCorrelation.value && ratingCorrelation.value.length > 0) {
    let totalSampleSize = 0
    let weightedSalesCorr = 0
    let weightedPriceCorr = 0
    
    ratingCorrelation.value.forEach(item => {
      const sampleSize = item.sampleSize || 0
      if (sampleSize > 0) {
        totalSampleSize += sampleSize
        weightedSalesCorr += (item.corrRatingSales || 0) * sampleSize
        weightedPriceCorr += (item.corrRatingPrice || 0) * sampleSize
      }
    })
    
    if (totalSampleSize > 0) {
      stats.value.ratingSalesCorr = weightedSalesCorr / totalSampleSize
      stats.value.ratingPriceCorr = weightedPriceCorr / totalSampleSize
    }
  }
  
  // 2. 计算高评分vs低评分平均销量（从评分-销量关系数据中计算）
  if (salesRelation.value && salesRelation.value.length > 0) {
    let highRatingTotal = 0
    let highRatingCount = 0
    let lowRatingTotal = 0
    let lowRatingCount = 0
    
    salesRelation.value.forEach(item => {
      const ratingBucket = item.ratingBucket || 0
      const avgSales = item.avgMonthlySales || 0
      const productCount = item.productCount || 0
      
      if (ratingBucket >= 4.5) {
        // 高评分（≥4.5）
        highRatingTotal += avgSales * productCount
        highRatingCount += productCount
      } else if (ratingBucket < 4.0) {
        // 低评分（<4.0）
        lowRatingTotal += avgSales * productCount
        lowRatingCount += productCount
      }
    })
    
    if (highRatingCount > 0) {
      stats.value.highRatingAvgSales = highRatingTotal / highRatingCount
    }
    if (lowRatingCount > 0) {
      stats.value.lowRatingAvgSales = lowRatingTotal / lowRatingCount
    }
  }
  
  // 3. 计算高评分商品占比（从评分分布数据中计算）
  if (distribution.value && distribution.value.length > 0) {
    let totalProducts = 0
    let highRatingProducts = 0
    
    distribution.value.forEach(item => {
      const ratingBucket = item.ratingBucket || 0
      const productCount = item.productCount || 0
      
      totalProducts += productCount
      if (ratingBucket >= 4.5) {
        highRatingProducts += productCount
      }
    })
    
    if (totalProducts > 0) {
      stats.value.highRatingRatio = highRatingProducts / totalProducts
    }
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
.filter-bar {
  margin-top: 8px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 8px;
}
.inner-card {
  margin-bottom: 12px;
}
.tall-card .el-table {
  --el-table-header-bg-color: #fafafa;
}
.chart {
  width: 100%;
  height: 320px;
}

/* 大图表样式 */
.large-chart {
  width: 100%;
  height: 320px;
}

/* 中等图表样式（并排显示） */
.medium-chart {
  width: 100%;
  height: 320px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
}

.chart-desc {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

.chart-insight {
  margin-top: 16px;
}
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}

/* 顶部统计卡片样式 */
.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  height: 100%;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  padding: 8px 0;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.2;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>

