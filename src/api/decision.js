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
  },

  // 新版决策分析
  decisionAnalysis(data) {
    return request({
      url: '/decision/analysis',
      method: 'post',
      data
    })
  },

  // 决策中心预测记录列表（分页）
  listRecords(params) {
    return request({
      url: '/decision/records',
      method: 'get',
      params
    })
  }
}

