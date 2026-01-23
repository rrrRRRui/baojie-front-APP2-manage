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
    proxy: {
      // 只代理 /api/v1 前缀，避免误伤其它 /api 路径
      '/api/v1': {
        target: 'http://124.223.16.213:8000',
        changeOrigin: true,
        // /api/v1/*  =>  /v1/*
        rewrite: (path) => path.replace(/^\/api\/v1/, '/v1'),
        // 如后端是自签证书可加 secure:false；此处 http 不需要
        // secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
