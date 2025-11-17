import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 导入 element-plus 组件样式
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/upload/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'


const app = createApp(App)

// 测试控制台日志是否正常工作
console.log('=== 应用启动测试日志 ===')
console.log('当前环境:', import.meta.env.MODE)
console.log('是否为开发环境:', import.meta.env.DEV)

app.use(router)

app.mount('#app')
console.log('=== 应用已成功挂载 ===')
