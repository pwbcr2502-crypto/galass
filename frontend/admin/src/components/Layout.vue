<template>
  <el-container class="admin-layout">
    <!-- Sidebar -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">Admin Panel</span>
        <span v-else>A</span>
      </div>
      
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#1890ff"
      >
        <el-menu-item
          v-for="route in menuRoutes"
          :key="route.path"
          :index="route.path"
        >
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <template #title>{{ route.meta.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Main content -->
    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            size="large"
            @click="toggleSidebar"
          >
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>
          
          <el-breadcrumb separator=">">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ getCurrentPageTitle() }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              <span>管理员</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Content -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Layout',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const isCollapse = ref(false)

    const menuRoutes = computed(() => {
      return router.options.routes
        .find(r => r.path === '/')
        ?.children?.filter(r => r.meta?.title) || []
    })

    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value
    }

    const getCurrentPageTitle = () => {
      const currentRoute = menuRoutes.value.find(r => r.path === route.path.replace('/', ''))
      return currentRoute?.meta?.title || '页面'
    }

    const handleCommand = (command) => {
      if (command === 'logout') {
        store.dispatch('auth/logout')
        router.push('/login')
        ElMessage.success('已退出登录')
      }
    }

    return {
      isCollapse,
      menuRoutes,
      toggleSidebar,
      getCurrentPageTitle,
      handleCommand
    }
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.2s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f1f1f;
}


.header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #666;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f5f5;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
  color: #ffffff !important;
}

:deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff !important;
}

:deep(.el-menu-item:hover) {
  background-color: #40a9ff !important;
  color: #ffffff !important;
}

:deep(.el-menu-item:hover .el-icon) {
  color: #ffffff !important;
}
</style>