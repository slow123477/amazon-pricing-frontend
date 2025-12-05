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
  }
}


