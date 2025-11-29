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
  }
}

