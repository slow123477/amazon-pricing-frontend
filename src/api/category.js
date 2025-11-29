import request from '@/utils/request'

/**
 * 分类统计 API
 */
export const categoryApi = {
  // 查询所有分类统计
  getCategoryStats() {
    return request({
      url: '/category/stats',
      method: 'get'
    })
  }
}

