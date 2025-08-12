import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import store from '../store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '控制面板', icon: 'Dashboard' }
      },
      {
        path: 'events',
        name: 'Events',
        component: () => import('../views/Events.vue'),
        meta: { title: '活动管理', icon: 'Calendar' }
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('../views/Employees.vue'),
        meta: { title: '员工管理', icon: 'User' }
      },
      {
        path: 'programs',
        name: 'Programs',
        component: () => import('../views/Programs.vue'),
        meta: { title: '节目管理', icon: 'VideoPlay' }
      },
      {
        path: 'voting',
        name: 'Voting',
        component: () => import('../views/Voting.vue'),
        meta: { title: '投票控制', icon: 'Star' }
      },
      {
        path: 'qrcode',
        name: 'QRCode',
        component: () => import('../views/QRCode.vue'),
        meta: { title: '二维码', icon: 'QrCode' }
      },
      {
        path: 'export',
        name: 'Export',
        component: () => import('../views/Export.vue'),
        meta: { title: '数据导出', icon: 'Download' }
      },
      {
        path: 'awards',
        name: 'Awards',
        component: () => import('../views/Awards.vue'),
        meta: { title: '奖项管理', icon: 'Trophy' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const isLoggedIn = store.getters['auth/isLoggedIn']

  if (requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router