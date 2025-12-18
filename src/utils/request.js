import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8080/api', // 后端接口地址
  timeout: 60000 // 增加到60秒，因为销量预测需要生成多个价格点的预测
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 将当前登录用户信息透传给后端，用于保存预测记录和权限控制
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user && user.id != null) {
          config.headers['X-User-Id'] = user.id
        }
        if (user && user.username) {
          config.headers['X-Username'] = user.username
        }
        if (user && user.role) {
          config.headers['X-User-Role'] = user.role
        }
      } catch (e) {
        // ignore parse error
      }
    }

    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    // 如果返回的状态码不是 1，则视为错误
    if (res.code !== 1) {
      console.error('接口错误:', res.msg)
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res.data
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

export default request

