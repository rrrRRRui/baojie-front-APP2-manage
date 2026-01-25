import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    user: {
      name: '管理员',
      avatar: '',
      permissions: []
    },
    sidebarCollapsed: false
  }),
  
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    setUser(user) {
      this.user = user
    }
  }
})