import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 引入 Vant 组件和样式
import { Toast, Dialog, Notify, Loading } from 'vant'
import 'vant/lib/index.css'

// 引入全局样式
import './styles/index.css'

// 引入 Vant Touch Emulator (开发环境)
if (import.meta.env.DEV) {
  import('@vant/touch-emulator')
}

const app = createApp(App)

// 安装 Pinia 状态管理
app.use(createPinia())

// 注册 Vant 组件
app.use(Toast)
app.use(Dialog)
app.use(Notify)
app.use(Loading)

// 安装 Vue Router
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component Info:', info)
  
  // 可以在这里发送错误到监控服务
  if (window._errorHandler) {
    window._errorHandler(err, vm, info)
  }
}

// 全局警告处理
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Vue Warning:', msg)
  console.warn('Trace:', trace)
}

// 全局属性
app.config.globalProperties.$API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// 挂载应用
app.mount('#app')