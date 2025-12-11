import request from '@/utils/request'

/**
 * 评分分析相关 API
 */
export const ratingApi = {
  // 评分分布
  getDistribution() {
    return request({
      url: '/analysis/rating/distribution',
      method: 'get'
    })
  },
  // 评分-销量关系
  getSalesRelation() {
    return request({
      url: '/analysis/rating/sales-relation',
      method: 'get'
    })
  },
  // 评分-价格关系
  getPriceRelation() {
    return request({
      url: '/analysis/rating/price-relation',
      method: 'get'
    })
  },
  // 高评分商品
  getTopProducts(params) {
    return request({
      url: '/analysis/rating/top-products',
      method: 'get',
      params
    })
  },
  // 高评分低销量机会榜
  getHighRatingLowSales(params) {
    return request({
      url: '/analysis/rating/opportunity/high',
      method: 'get',
      params
    })
  },
  // 低评分高销量机会榜
  getLowRatingHighSales(params) {
    return request({
      url: '/analysis/rating/opportunity/low',
      method: 'get',
      params
    })
  },
  // 评分相关性
  getCorrelation() {
    return request({
      url: '/analysis/rating/correlation',
      method: 'get'
    })
  }
}


