import request from '@/utils/request'

/**
 * 价格相关 API
 */
export const priceApi = {
  // 查询价格推荐列表（分页）
  getRecommendations(params) {
    const requestParams = {
      category: params.category,
      keyword: params.keyword,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 20
    }
    
    // 添加价格区间参数
    if (params.minPrice !== undefined && params.minPrice !== null) {
      requestParams.minPrice = params.minPrice
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      requestParams.maxPrice = params.maxPrice
    }
    
    return request({
      url: '/price/recommendations',
      method: 'get',
      params: requestParams
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

