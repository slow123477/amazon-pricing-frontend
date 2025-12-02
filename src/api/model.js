import request from '@/utils/request'

/**
 * 模型相关 API
 */
export const modelApi = {
  // 查询模型评估指标
  getModelMetrics() {
    return request({
      url: '/model/metrics',
      method: 'get'
    })
  },
  // 指标历史
  getMetricsHistory(params) {
    return request({
      url: '/model/metrics/history',
      method: 'get',
      params
    })
  },
  // 分类指标
  getCategoryMetrics(params) {
    return request({
      url: '/model/metrics/category',
      method: 'get',
      params
    })
  },
  // 误差区间分布
  getErrorDistribution() {
    return request({
      url: '/model/errors/distribution',
      method: 'get'
    })
  },
  // 高误差样本
  getTopErrorSamples(params) {
    return request({
      url: '/model/errors/top',
      method: 'get',
      params
    })
  },
  // 训练配置
  getTrainingSummary() {
    return request({
      url: '/model/training/summary',
      method: 'get'
    })
  }
}

