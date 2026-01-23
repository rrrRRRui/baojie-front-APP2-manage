import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/collapse/style/css'
import 'element-plus/es/components/tabs/style/css'

const app = createApp(App)

app.use(router)

app.mount('#app')
