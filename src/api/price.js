import request from '@/utils/request'

/**
 * 价格相关 API
 */
export const priceApi = {
  // 查询价格推荐列表（分页）
  getRecommendations(params) {
    return request({
      url: '/price/recommendations',
      method: 'get',
      params: {
        category: params.category,
        keyword: params.keyword,
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 20
      }
    })
  },

  // 根据商品标题查询价格预测
  getPrediction(title) {
    return request({
      url: '/price/prediction',
      method: 'get',
      params: { title }
    })
  },

  // 实时价格诊断
  diagnosePrice(data) {
    return request({
      url: '/price/diagnosis',
      method: 'post',
      data
    })
  }
}

