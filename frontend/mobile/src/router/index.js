import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { showFailToast } from 'vant'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      keepAlive: false
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/vote/:id',
    name: 'Vote',
    component: () => import('@/views/Vote.vue'),
    meta: {
      title: '投票',
      requiresAuth: true,
      keepAlive: false
    },
    props: (route) => ({
      programId: parseInt(route.params.id)
    })
  },
  {
    path: '/results',
    name: 'Results',
    component: () => import('@/views/Results.vue'),
    meta: {
      title: '投票结果',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/my-votes',
    name: 'MyVotes',
    component: () => import('@/views/MyVotes.vue'),
    meta: {
      title: '我的投票',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true,
      keepAlive: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '关于',
      requiresAuth: false,
      keepAlive: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
      keepAlive: false
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置，恢复到该位置
    if (savedPosition) {
      return savedPosition
    }
    
    // 如果有锚点，滚动到锚点
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    
    // 默认滚动到顶部
    return { top: 0 }
  }
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 年会投票系统`
  }
  
  const authStore = useAuthStore()
  
  // 如果不需要认证，直接通过
  if (!to.meta.requiresAuth) {
    // 但是如果已经登录了且要去登录页，重定向到首页
    if (to.name === 'Login' && authStore.isLoggedIn) {
      next('/home')
      return
    }
    next()
    return
  }
  
  // 需要认证的页面
  if (!authStore.isLoggedIn) {
    // 未登录，重定向到登录页
    showFailToast('请先登录')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 检查认证状态
  try {
    const authStatus = await authStore.checkAuthStatus()
    
    if (authStatus.needLogin) {
      // 需要重新登录
      showFailToast('登录已过期，请重新登录')
      
      authStore.clearAuth()
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 认证有效，继续访问
    next()
    
  } catch (error) {
    console.error('Route guard auth check error:', error)
    
    // 认证检查失败，清除认证信息并重定向到登录页
    authStore.clearAuth()
    showFailToast('认证失败，请重新登录')
    
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 页面访问统计（如果需要）
  console.log(`Navigation: ${from.path} -> ${to.path}`)
  
  // 如果是移动端，隐藏地址栏
  if (/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    setTimeout(() => {
      window.scrollTo(0, 1)
    }, 100)
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
  
  showFailToast('页面加载失败，请刷新重试')
})

export default router