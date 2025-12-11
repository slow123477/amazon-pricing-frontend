import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  }),
  getters: {
    isLogin: state => !!state.token,
    role: state => state.user?.role || 'USER',
    username: state => state.user?.username || '',
    userId: state => state.user?.id || null
  },
  actions: {
    setLogin(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})


