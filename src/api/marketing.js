import request from '@/utils/request'

/**
 * 营销分析相关 API
 */
export const marketingApi = {
  getDiscountEffect() {
    return request({
      url: '/analysis/marketing/discount-effect',
      method: 'get'
    })
  },
  getSponsoredEffect() {
    return request({
      url: '/analysis/marketing/sponsored-effect',
      method: 'get'
    })
  },
  getCouponEffect() {
    return request({
      url: '/analysis/marketing/coupon-effect',
      method: 'get'
    })
  },
  getBuyboxEffect() {
    return request({
      url: '/analysis/marketing/buybox-effect',
      method: 'get'
    })
  }
}


