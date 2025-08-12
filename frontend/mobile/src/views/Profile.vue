<template>
  <div class="profile-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      title="个人中心"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="page-content">
      <!-- 用户信息卡片 -->
      <div class="user-card card slide-up">
        <div class="user-header">
          <div class="avatar">
            {{ user?.name?.charAt(0) || 'U' }}
          </div>
          <div class="user-info">
            <h3>{{ user?.name || '未知用户' }}</h3>
            <p class="user-detail">{{ user?.department }} | {{ user?.empNo }}</p>
            <div class="login-info">
              <span class="login-time">登录时间：{{ formatTime(user?.lastLoginAt) }}</span>
            </div>
          </div>
          <div class="status-badge">
            <van-tag type="success" size="medium">已登录</van-tag>
          </div>
        </div>
      </div>
      
      <!-- 活动信息卡片 -->
      <div class="event-card card">
        <div class="card-header">
          <h4>🎉 活动信息</h4>
        </div>
        <div class="event-content">
          <div class="event-info">
            <div class="event-name">{{ event?.name || '未知活动' }}</div>
            <div class="event-code">活动码：{{ event?.code }}</div>
            <div class="event-status">
              状态：
              <van-tag :type="getEventStatusType()">{{ getEventStatusText() }}</van-tag>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 投票统计卡片 -->
      <div class="stats-card card">
        <div class="card-header">
          <h4>📊 投票统计</h4>
        </div>
        <div class="stats-content">
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-icon">🗳️</div>
              <div class="stat-number">{{ profileData?.totalVotes || 0 }}</div>
              <div class="stat-label">已投票数</div>
            </div>
            <div class="stat-box">
              <div class="stat-icon">⭐</div>
              <div class="stat-number">{{ getAverageScore() }}</div>
              <div class="stat-label">平均评分</div>
            </div>
            <div class="stat-box">
              <div class="stat-icon">🏆</div>
              <div class="stat-number">{{ getHighestScore() }}</div>
              <div class="stat-label">最高评分</div>
            </div>
            <div class="stat-box">
              <div class="stat-icon">🎯</div>
              <div class="stat-number">{{ getParticipationRate() }}%</div>
              <div class="stat-label">参与率</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 功能菜单 -->
      <div class="menu-card card">
        <div class="card-header">
          <h4>⚙️ 功能菜单</h4>
        </div>
        <van-cell-group inset>
          <van-cell 
            title="我的投票记录" 
            icon="records" 
            is-link 
            @click="goToMyVotes"
          >
            <template #value>
              <van-tag v-if="profileData?.totalVotes > 0" type="primary" size="small">
                {{ profileData.totalVotes }}
              </van-tag>
            </template>
          </van-cell>
          <van-cell 
            title="投票结果" 
            icon="chart-trending-o" 
            is-link 
            @click="goToResults"
          />
          <van-cell 
            title="关于系统" 
            icon="info-o" 
            is-link 
            @click="goToAbout"
          />
        </van-cell-group>
      </div>
      
      <!-- 会话信息卡片 -->
      <div class="session-card card">
        <div class="card-header">
          <h4>🔐 会话信息</h4>
        </div>
        <div class="session-content">
          <div class="session-item">
            <span class="session-label">会话状态</span>
            <span class="session-value">
              <van-tag type="success" size="small">有效</van-tag>
            </span>
          </div>
          <div class="session-item">
            <span class="session-label">剩余时间</span>
            <span class="session-value">{{ getRemainingTime() }}</span>
          </div>
          <div class="session-item">
            <span class="session-label">登录IP</span>
            <span class="session-value">{{ sessionInfo?.loginIp || '未知' }}</span>
          </div>
          <div class="session-item">
            <span class="session-label">设备信息</span>
            <span class="session-value">{{ getDeviceInfo() }}</span>
          </div>
        </div>
      </div>
      
      <!-- 退出按钮 -->
      <div class="logout-section">
        <van-button 
          type="danger" 
          size="large" 
          :loading="loggingOut"
          @click="showLogoutDialog"
          class="logout-btn"
        >
          退出登录
        </van-button>
      </div>
    </div>
    
    <!-- 退出登录确认弹窗 -->
    <van-dialog
      v-model:show="logoutDialogVisible"
      title="确认退出"
      message="确定要退出登录吗？"
      show-cancel-button
      @confirm="handleLogout"
      @cancel="logoutDialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式数据
const loggingOut = ref(false)
const logoutDialogVisible = ref(false)
const profileData = ref(null)
const sessionInfo = ref(null)

// 计算属性
const user = computed(() => authStore.user)
const event = computed(() => authStore.event)

// 获取活动状态类型
const getEventStatusType = () => {
  const status = event.value?.status
  switch (status) {
    case 0: return 'default'
    case 1: return 'success'
    case 2: return 'warning'
    default: return 'default'
  }
}

// 获取活动状态文本
const getEventStatusText = () => {
  const status = event.value?.status
  switch (status) {
    case 0: return '未开始'
    case 1: return '进行中'
    case 2: return '已结束'
    default: return '未知'
  }
}

// 获取平均评分
const getAverageScore = () => {
  if (!profileData.value?.votes || profileData.value.votes.length === 0) {
    return '0.00'
  }
  const totalScore = profileData.value.votes.reduce(
    (sum, vote) => sum + vote.composite_score, 0
  )
  return (totalScore / profileData.value.votes.length).toFixed(2)
}

// 获取最高评分
const getHighestScore = () => {
  if (!profileData.value?.votes || profileData.value.votes.length === 0) {
    return '0'
  }
  const maxScore = Math.max(
    ...profileData.value.votes.map(vote => vote.composite_score)
  )
  return maxScore.toString()
}

// 获取参与率
const getParticipationRate = () => {
  // 这里应该从后端获取总节目数，简化处理
  return profileData.value?.totalVotes > 0 ? 100 : 0
}

// 获取剩余时间
const getRemainingTime = () => {
  if (!sessionInfo.value?.remainingMinutes) {
    return '未知'
  }
  const minutes = sessionInfo.value.remainingMinutes
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}小时${remainMinutes}分钟`
}

// 获取设备信息
const getDeviceInfo = () => {
  const deviceInfo = appStore.deviceInfo
  if (deviceInfo.isMobile) {
    return '移动设备'
  } else {
    return '桌面设备'
  }
}

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return '未知'
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 页面导航方法
const goBack = () => {
  router.back()
}

const goToMyVotes = () => {
  router.push('/my-votes')
}

const goToResults = () => {
  router.push('/results')
}

const goToAbout = () => {
  router.push('/about')
}

// 显示退出登录弹窗
const showLogoutDialog = () => {
  logoutDialogVisible.value = true
}

// 处理退出登录
const handleLogout = async () => {
  try {
    loggingOut.value = true
    logoutDialogVisible.value = false
    
    await authStore.logout()
    
    showSuccessToast({
      message: '退出成功',
      duration: 1500
    })
    
    // 延迟跳转到登录页
    setTimeout(() => {
      router.replace('/login')
    }, 1500)
  } catch (error) {
    console.error('Logout error:', error)
    showToast({
      type: 'fail',
      message: '退出失败，请重试',
      duration: 2000
    })
  } finally {
    loggingOut.value = false
  }
}

// 加载用户资料
const loadProfile = async () => {
  try {
    const [profileRes, sessionRes] = await Promise.allSettled([
      authStore.getProfile(),
      authStore.getSessionInfo()
    ])
    
    if (profileRes.status === 'fulfilled') {
      profileData.value = profileRes.value
    }
    
    if (sessionRes.status === 'fulfilled') {
      sessionInfo.value = sessionRes.value
    }
  } catch (error) {
    console.error('Load profile error:', error)
  }
}

// 组件挂载
onMounted(async () => {
  await loadProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f7f9fc;
}

.nav-bar {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
}

:deep(.van-nav-bar__title),
:deep(.van-nav-bar__left),
:deep(.van-nav-bar .van-icon) {
  color: white;
}

.page-content {
  padding: 16px;
  padding-bottom: 80px;
}

.user-card {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-header {
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.user-detail {
  margin: 0 0 8px 0;
  font-size: 14px;
  opacity: 0.8;
}

.login-info {
  font-size: 12px;
  opacity: 0.7;
}

.event-card,
.stats-card,
.menu-card,
.session-card {
  margin-bottom: 16px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.event-content {
  padding: 20px;
}

.event-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.event-code,
.event-status {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stats-content {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-box {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.session-content {
  padding: 20px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.session-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.session-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.session-value {
  font-size: 14px;
  color: var(--text-primary);
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.logout-section {
  margin-top: 24px;
}

.logout-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
}

/* Vant组件样式覆盖 */
:deep(.van-cell) {
  padding: 12px 16px;
}

:deep(.van-cell__title) {
  font-size: 15px;
}

:deep(.van-cell__right-icon) {
  color: #c8c9cc;
}

/* 动画 */
.slide-up {
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 375px) {
  .page-content {
    padding: 12px;
  }
  
  .user-header {
    padding: 20px;
  }
  
  .avatar {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .user-info h3 {
    font-size: 18px;
  }
  
  .stats-grid {
    gap: 12px;
  }
  
  .stat-box {
    padding: 12px;
  }
}
</style>