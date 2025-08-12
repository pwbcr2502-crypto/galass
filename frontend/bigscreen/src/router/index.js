import { createRouter, createWebHistory } from 'vue-router'

// 异步加载组件
const Dashboard = () => import('../views/Dashboard.vue')
const Results = () => import('../views/Results.vue')
const Statistics = () => import('../views/Statistics.vue')
const Settings = () => import('../views/Settings.vue')

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '周年庆投票大屏 - 仪表盘',
      keepAlive: true
    }
  },
  {
    path: '/results',
    name: 'Results', 
    component: Results,
    meta: {
      title: '周年庆投票大屏 - 实时结果',
      keepAlive: true
    }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: {
      title: '周年庆投票大屏 - 数据统计',
      keepAlive: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '周年庆投票大屏 - 系统设置',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 权限检查
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      // 可以重定向到登录页或显示认证对话框
      console.warn('需要管理员权限')
    }
  }

  next()
})

router.afterEach((to, from) => {
  // 路由切换后的处理
  console.log(`Route changed from ${from.name} to ${to.name}`)
})

export default router