import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 导入完整的Element Plus样式
import 'element-plus/dist/index.css'
// 导入Element Plus
import ElementPlus from 'element-plus'
// 导入Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 测试控制台日志是否正常工作
console.log('=== 应用启动测试日志 ===')
console.log('当前环境:', import.meta.env.MODE)
console.log('是否为开发环境:', import.meta.env.DEV)

app.use(router)
app.use(ElementPlus)

app.mount('#app')
console.log('=== 应用已成功挂载 ===')
