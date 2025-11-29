<template>
  <div class="rating-analysis">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><DataLine /></el-icon> 评分与价格关系</span>
        </div>
      </template>
      <div ref="chartRef" class="chart"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { analysisApi } from '@/api/analysis'

const chartRef = ref(null)

const loadChart = async () => {
  try {
    const data = await analysisApi.getRatingPriceAnalysis()
    
    await nextTick()
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      title: { text: '评分与价格分布', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.map(item => `${item.ratingBucket}.0-${item.ratingBucket}.9`)
      },
      yAxis: { type: 'value', name: '平均价格(¥)' },
      series: [{
        type: 'line',
        data: data.map(item => item.avgDiscountedPrice?.toFixed(2)),
        smooth: true,
        itemStyle: { color: '#91cc75' }
      }]
    })
  } catch (error) {
    console.error('加载评分分析失败:', error)
  }
}

onMounted(() => {
  loadChart()
})
</script>

<style scoped>
.rating-analysis {
  padding: 0;
}

.card-header {
  font-weight: 600;
}

.chart {
  width: 100%;
  height: 500px;
}
</style>

