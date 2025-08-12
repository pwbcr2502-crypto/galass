import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// ECharts
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'

// ECharts 组件
import {
  CanvasRenderer
} from 'echarts/renderers'
import {
  BarChart,
  PieChart,
  LineChart,
  RadarChart,
  ScatterChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  PolarComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  PolarComponent,
  DataZoomComponent,
  ToolboxComponent
])

// 动画库
import 'animate.css'

// 全局样式
import './styles/index.css'

// 创建应用实例
const app = createApp(App)

// 注册 ECharts 组件
app.component('v-chart', ECharts)

// 安装插件
app.use(createPinia())
app.use(router)

// 全局错误处理
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue error:', error)
  console.error('Component:', instance)
  console.error('Info:', info)
  
  // 在生产环境中发送错误到监控服务
  if (import.meta.env.PROD) {
    // sendErrorToMonitoring(error, info)
  }
}

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
  if (import.meta.env.DEV) {
    console.warn('Vue warning:', msg)
    console.warn('Trace:', trace)
  }
}

// 挂载应用
app.mount('#app')