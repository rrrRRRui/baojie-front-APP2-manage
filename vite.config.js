import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  server: {
    // 允许局域网访问（方便你用手机连同一个WiFi测试）
    host: '0.0.0.0',
    
    // 这里是解决跨域和 Base.invalid 报错的关键配置
    proxy: {
      '/api': {
        target: 'http://124.223.16.213:8000', // 你的后端地址
        changeOrigin: true,
        // 路径重写：把前端发的 /api/v1... 变成后端的 /v1...
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})