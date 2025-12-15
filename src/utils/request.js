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

