import request from '@/utils/request'

/**
 * 竞品对标 / 类目基准 API
 */
export const benchmarkApi = {
  getOverview(params) {
    return request({
      url: '/benchmark/overview',
      method: 'get',
      params
    })
  },
  getTopRated(params) {
    return request({
      url: '/benchmark/top-rated',
      method: 'get',
      params
    })
  },
  getTopSales(params) {
    return request({
      url: '/benchmark/top-sales',
      method: 'get',
      params
    })
  }
}


