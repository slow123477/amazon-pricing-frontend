import request from '@/utils/request'

/**
 * 决策中心相关 API
 */
export const decisionApi = {
  // 价格诊断
  diagnosePrice(data) {
    return request({
      url: '/decision/price-diagnosis',
      method: 'post',
      data
    })
  },

  // 销量预测
  predictSales(data) {
    return request({
      url: '/decision/sales-prediction',
      method: 'post',
      data
    })
  },

  // 场景模拟
  simulateScenarios(data) {
    return request({
      url: '/decision/scenario-simulation',
      method: 'post',
      data
    })
  }
}

