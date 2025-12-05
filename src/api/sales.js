import request from '@/utils/request'

/**
 * 销量分析相关 API
 */
export const salesApi = {
  // 销量排行榜
  getSalesRanking() {
    return request({
      url: '/analysis/sales/ranking',
      method: 'get'
    })
  },
  // 分类销量统计
  getCategoryStats() {
    return request({
      url: '/analysis/sales/category-stats',
      method: 'get'
    })
  },
  // 销量影响因素
  getSalesFactors() {
    return request({
      url: '/analysis/sales/factors',
      method: 'get'
    })
  },
  // 畅销商品（可按分类筛选）
  getBestSellers(params) {
    return request({
      url: '/analysis/sales/best-sellers',
      method: 'get',
      params
    })
  }
}


