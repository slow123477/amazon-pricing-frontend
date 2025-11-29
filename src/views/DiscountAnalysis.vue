<template>
  <div class="discount-analysis">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><TrendCharts /></el-icon> 折扣与销量关系</span>
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
    const data = await analysisApi.getDiscountSalesAnalysis()
    
    await nextTick()
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      title: { text: '折扣力度对销量的影响', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.map(item => item.discountBucket)
      },
      yAxis: { type: 'value', name: '平均销量' },
      series: [{
        type: 'bar',
        data: data.map(item => item.avgMonthlySales?.toFixed(0)),
        itemStyle: { color: '#5470c6' }
      }]
    })
  } catch (error) {
    console.error('加载折扣分析失败:', error)
  }
}

onMounted(() => {
  loadChart()
})
</script>

<style scoped>
.discount-analysis {
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

