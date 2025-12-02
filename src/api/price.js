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
    // 添加诊断结果筛选
    if (params.diagnosis !== undefined && params.diagnosis !== null && params.diagnosis !== '') {
      requestParams.diagnosis = params.diagnosis
    }
    // 添加排序参数
    if (params.sortBy !== undefined && params.sortBy !== null && params.sortBy !== '') {
      requestParams.sortBy = params.sortBy
    }
    if (params.sortOrder !== undefined && params.sortOrder !== null && params.sortOrder !== '') {
      requestParams.sortOrder = params.sortOrder
    }
    
    return request({
      url: '/price/recommendations',
      method: 'get',
      params: requestParams
    })
  },

  // 获取价格推荐概览统计
  getRecommendationsOverview(params) {
    const requestParams = {}
    if (params?.category) {
      requestParams.category = params.category
    }
    if (params?.keyword) {
      requestParams.keyword = params.keyword
    }
    if (params?.minPrice !== undefined && params?.minPrice !== null) {
      requestParams.minPrice = params.minPrice
    }
    if (params?.maxPrice !== undefined && params?.maxPrice !== null) {
      requestParams.maxPrice = params.maxPrice
    }
    if (params?.diagnosis !== undefined && params?.diagnosis !== null && params?.diagnosis !== '') {
      requestParams.diagnosis = params.diagnosis
    }
    return request({
      url: '/price/recommendations/overview',
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
  },

  // 获取诊断分布统计
  getDiagnosisStatistics(params) {
    const requestParams = {}
    if (params?.category) {
      requestParams.category = params.category
    }
    if (params?.minPrice !== undefined && params?.minPrice !== null) {
      requestParams.minPrice = params.minPrice
    }
    if (params?.maxPrice !== undefined && params?.maxPrice !== null) {
      requestParams.maxPrice = params.maxPrice
    }
    return request({
      url: '/price/diagnosis/statistics',
      method: 'get',
      params: requestParams
    })
  }
}

