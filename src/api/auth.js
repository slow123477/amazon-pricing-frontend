import request from '@/utils/request'

export const authApi = {
  login(data) {
    return request({
      url: '/auth/login',
      method: 'post',
      data
    })
  },
  // 用户管理（管理员）
  listUsers() {
    return request({
      url: '/admin/users',
      method: 'get'
    })
  },
  createUser(data) {
    return request({
      url: '/admin/users',
      method: 'post',
      data
    })
  },
  updateUser(id, data) {
    return request({
      url: `/admin/users/${id}`,
      method: 'put',
      data
    })
  },
  deleteUser(id) {
    return request({
      url: `/admin/users/${id}`,
      method: 'delete'
    })
  }
}


