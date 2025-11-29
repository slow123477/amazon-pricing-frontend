<template>
  <div class="category-stats">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><PieChart /></el-icon> 分类价格统计</span>
        </div>
      </template>
      <div ref="chartRef" class="chart"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { categoryApi } from '@/api/category'

const chartRef = ref(null)

const loadChart = async () => {
  try {
    const data = await categoryApi.getCategoryStats()
    
    await nextTick()
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      title: { text: '各分类平均价格与销量', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均价格', '平均销量'], top: 30 },
      xAxis: {
        type: 'category',
        data: data.map(item => item.productCategory),
        axisLabel: { rotate: 45 }
      },
      yAxis: [
        { type: 'value', name: '价格(¥)', position: 'left' },
        { type: 'value', name: '销量', position: 'right' }
      ],
      series: [
        {
          name: '平均价格',
          type: 'bar',
          data: data.map(item => item.avgDiscountedPrice?.toFixed(2))
        },
        {
          name: '平均销量',
          type: 'line',
          yAxisIndex: 1,
          data: data.map(item => item.avgMonthlySales?.toFixed(0))
        }
      ]
    })
  } catch (error) {
    console.error('加载分类统计失败:', error)
  }
}

onMounted(() => {
  loadChart()
})
</script>

<style scoped>
.category-stats {
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

