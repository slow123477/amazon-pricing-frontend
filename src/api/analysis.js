import request from '@/utils/request'

/**
 * 分析相关 API
 */
export const analysisApi = {
  // 折扣销量关系分析
  getDiscountSalesAnalysis() {
    return request({
      url: '/analysis/discount-sales',
      method: 'get'
    })
  },

  // 评分价格关系分析
  getRatingPriceAnalysis() {
    return request({
      url: '/analysis/rating-price',
      method: 'get'
    })
  }
}

