import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 代理 /v1 前缀的请求
      '/v1': {
        target: 'http://124.223.16.213:8000',
        changeOrigin: true,
        secure: false, // 允许不安全的SSL证书
        rewrite: (path) => path, // 保留原始路径
        // 添加详细日志以便调试
        logLevel: 'debug',
        // 代理配置调试信息
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('发送代理请求:', req.method, req.url, '转发到:', options.target);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('收到代理响应:', proxyRes.statusCode, req.url);
          });
        }
      },
      // 保留原有配置以兼容可能的旧请求
      '/api/v1': {
        target: 'http://124.223.16.213:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/v1'),
        logLevel: 'debug'
      },
    },
    // 确保服务器配置正确
    strictPort: true,
    cors: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
