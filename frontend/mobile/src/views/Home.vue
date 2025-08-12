<template>
  <div class="home-page premium-red-bg">
    <!-- Ultra Premium Animated Background -->
    <div class="animated-bg">
      <div class="gradient-wave wave-1"></div>
      <div class="gradient-wave wave-2"></div>
      <div class="gradient-wave wave-3"></div>
      <div class="floating-particles">
        <div class="particle" v-for="i in 15" :key="i"></div>
      </div>
    </div>
    
    <!-- Premium Navigation Bar -->
    <van-nav-bar 
      :title="event?.name || '年会投票系统'"
      fixed
      placeholder
      class="nav-bar glass-nav nav-red-theme"
    >
      <template #left>
        <div class="nav-logo pulse-red">🎊</div>
      </template>
      <template #right>
        <div class="nav-profile-btn" @click="goToProfile">
          <van-icon name="user-o" />
          <span class="profile-badge"></span>
        </div>
      </template>
    </van-nav-bar>
    
    <!-- Mobile-Optimized Content Container -->
    <div class="page-content page-content-mobile home-compact-aware">
      <!-- Mobile-Optimized Welcome Card -->
      <div class="welcome-card card-mobile card-red-light touch-enhanced">
        <div class="card-glow"></div>
        <div class="welcome-content">
          <div class="user-section">
            <div class="avatar-wrapper">
              <div class="avatar-glow"></div>
              <div class="avatar gradient-avatar">
                <span class="avatar-text">{{ user?.name?.charAt(0) || 'U' }}</span>
              </div>
              <div class="avatar-badge float-animation">
                <span>VIP</span>
              </div>
            </div>
            <div class="user-details">
              <h3 class="welcome-text text-mobile-title">
                <span class="greeting text-mobile-body">你好，</span>
                <span class="username gradient-text-red text-mobile-heading">{{ user?.name }}!</span>
              </h3>
              <p class="user-meta">
                <span class="department">{{ user?.department }}</span>
                <span class="separator">•</span>
                <span class="empno">{{ user?.empNo }}</span>
              </p>
            </div>
          </div>
          <div class="status-section">
            <div class="status-badge" :class="`status-${event?.status || 0}`">
              <span class="status-icon">{{ getEventStatusIcon() }}</span>
              <span class="status-text">{{ getEventStatusText() }}</span>
            </div>
          </div>
        </div>
        <div class="card-decoration">
          <div class="decoration-line"></div>
        </div>
      </div>
      
      <!-- Mobile-Optimized Current Voting Card -->
      <div v-if="currentProgram" :class="['current-program','card-mobile','card-red-medium','touch-enhanced', { 'is-voting': currentProgram?.status === 1 || currentProgram?.isVotingActive }, { 'is-voted': hasVotedForProgram(currentProgram.id) }]">
        <div class="card-spotlight"></div>
        <div class="card-header glass">
          <div class="header-left">
            <span class="live-indicator pulse-red"></span>
            <h4 class="gradient-text-red">正在投票</h4>
          </div>
          <div class="countdown-wrapper" v-if="currentProgram.remainingTime > 0">
            <span class="countdown-icon">⏱️</span>
            <van-count-down 
              :time="currentProgram.remainingTime * 1000"
              format="mm:ss"
              @finish="handleVoteTimeEnd"
              class="premium-countdown"
            />
          </div>
        </div>
        <div class="program-showcase">
          <div class="program-number">
            <span class="number-badge">{{ currentProgram.seqNo }}</span>
            <span class="number-label">号节目</span>
          </div>
            <div class="program-main">
            <h3 class="program-title text-mobile-heading">{{ currentProgram.title }}</h3>
            <div class="performer-info">
              <span class="performer-icon">🎤</span>
              <span class="performer-name">{{ currentProgram.performer }}</span>
            </div>
            <!-- 移除底部大号胶囊按钮，保持信息区更简洁 -->
          </div>
        </div>
        <div class="card-effects">
          <div class="effect-line line-1"></div>
          <div class="effect-line line-2"></div>
        </div>
      </div>
      
      <!-- Premium Empty State -->
      <div v-else class="no-current-voting glass-card">
        <div class="empty-illustration">
          <div class="empty-icon float-animation">🎪</div>
          <div class="empty-circles">
            <span class="circle circle-1"></span>
            <span class="circle circle-2"></span>
            <span class="circle circle-3"></span>
          </div>
        </div>
        <h4 class="empty-title">暂无进行中的投票</h4>
        <p class="empty-desc">精彩节目即将开始，请耐心等待</p>
      </div>
      
      <!-- Premium Progress Dashboard -->
      <div class="voting-progress neu-card fade-in-up compact-card">
        <div class="progress-header">
          <h4 class="section-title">
            <span class="title-icon">📊</span>
            <span class="title-text gradient-text-red">投票进度</span>
          </h4>
          <div class="progress-badge glass">
            <span>{{ getVotingPercentage() }}%</span>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card glass" v-for="(stat, index) in statsData" :key="index">
            <div class="stat-icon-wrapper">
              <div class="stat-icon" :style="{ background: stat.color }">
                {{ stat.icon }}
              </div>
            </div>
            <div class="stat-info">
              <div class="stat-number" :data-value="stat.value">
                <span class="number-animate">{{ stat.value }}</span>
              </div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
            <div class="stat-decoration"></div>
          </div>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: getVotingPercentage() + '%' }">
              <span class="progress-glow"></span>
            </div>
          </div>
          <div class="progress-particles">
            <span v-for="i in 5" :key="i" class="particle" :style="{ left: (i * 20) + '%' }"></span>
          </div>
        </div>
      </div>
      
      <!-- Mobile-Optimized Programs List -->
      <div class="programs-section card-mobile">
        <div class="section-header">
          <h4 class="section-title">
            <span class="title-icon">🎪</span>
            <span class="title-text gradient-text-red">精彩节目</span>
          </h4>
          <div class="filter-tabs">
            <span class="filter-tab active">全部</span>
            <span class="filter-tab">进行中</span>
            <span class="filter-tab">已完成</span>
          </div>
        </div>
        <div class="programs-list">
          <div 
            v-for="(program, index) in programs" 
            :key="program.id"
            class="program-card premium-program compact-program-card program-card-elevated"
            :class="{ 'is-active': program.status === 1, 'is-voted': hasVotedForProgram(program.id), 'need-vote': program.status === 1 && !hasVotedForProgram(program.id) }"
            @click="handleProgramClick(program)"
            :style="{ animationDelay: index * 0.06 + 's' }"
          >
            <div class="program-backdrop"></div>
            <div class="program-number-badge">
              <span class="number">{{ program.seqNo }}</span>
              <span class="number-glow"></span>
            </div>
            <div class="program-body">
              <h5 class="program-name text-mobile-title">
                {{ program.title }}
              </h5>
              <p class="program-performer">
                <span class="performer-icon">👤</span>
                {{ program.performer }}
              </p>
            </div>
              <div class="program-actions">
              <div class="status-indicator" :class="`status-${program.status}`">
                <span class="status-dot"></span>
                <span class="status-text">{{ getProgramStatusText(program) }}</span>
              </div>
               <div
                 v-if="program.status === 1 && !hasVotedForProgram(program.id)"
                 class="cta-chip"
                 @click.stop="goToVote(program.id)"
               >去评分</div>
              <div v-if="hasVotedForProgram(program.id)" class="voted-badge">
                <span class="badge-icon">✓</span>
              </div>
            </div>
            <div class="card-shine"></div>
          </div>
        </div>
      </div>
      
      <!-- Premium Quick Actions -->
      <div class="quick-actions fade-in-up">
        <div class="actions-grid">
          <div class="action-card quick-chip" @click="goToResults">
            <div class="action-icon float-animation">
              <span>📈</span>
            </div>
            <span class="action-text">投票结果</span>
          </div>
          <div class="action-card quick-chip" @click="goToMyVotes">
            <div class="action-icon float-animation" style="animation-delay: 0.2s">
              <span>📋</span>
            </div>
            <span class="action-text">我的投票</span>
          </div>
          <div class="action-card quick-chip" @click="goToAbout">
            <div class="action-icon float-animation" style="animation-delay: 0.4s">
              <span>ℹ️</span>
            </div>
            <span class="action-text">关于我们</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Premium Floating Action Button -->
    <div class="fab-container">
      <button class="fab premium-fab" @click="refreshData" :class="{ 'loading': refreshing }">
        <span class="fab-icon" :class="{ 'spin': refreshing }">🔄</span>
        <span class="fab-bg"></span>
        <span class="fab-glow"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { programApi } from '@/api/program'
import { voteApi } from '@/api/vote'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const refreshing = ref(false)
const currentProgram = ref(null)
const programs = ref([])
const votingSummary = ref(null)
const myVotes = ref([])
const refreshTimer = ref(null)

// 计算属性
const user = computed(() => authStore.user)
const event = computed(() => authStore.event)

// 统计数据
const statsData = computed(() => [
  {
    icon: '📋',
    value: votingSummary.value?.totalPrograms || 0,
    label: '总节目数',
    color: 'var(--gradient-primary)'
  },
  {
    icon: '✅',
    value: votingSummary.value?.votedPrograms || 0,
    label: '已投票',
    color: 'var(--gradient-gold)'
  },
  {
    icon: '⏳',
    value: votingSummary.value?.remainingPrograms || 0,
    label: '待投票',
    color: 'var(--gradient-elegant)'
  }
])

// 获取事件状态类型
const getEventStatusType = () => {
  const status = event.value?.status
  switch (status) {
    case 0: return 'default'
    case 1: return 'success'
    case 2: return 'warning'
    default: return 'default'
  }
}

// 获取事件状态文本
const getEventStatusText = () => {
  const status = event.value?.status
  switch (status) {
    case 0: return '未开始'
    case 1: return '进行中'
    case 2: return '已结束'
    default: return '未知'
  }
}

// 获取事件状态图标
const getEventStatusIcon = () => {
  const status = event.value?.status
  switch (status) {
    case 0: return '⏰'
    case 1: return '🔥'
    case 2: return '🏁'
    default: return '❓'
  }
}

// 获取投票百分比
const getVotingPercentage = () => {
  if (!votingSummary.value || votingSummary.value.totalPrograms === 0) {
    return 0
  }
  return Math.round((votingSummary.value.votedPrograms / votingSummary.value.totalPrograms) * 100)
}

// 获取节目状态类型
const getProgramStatusType = (program) => {
  if (program.status === 1) return 'primary'
  if (program.status === 2) return 'success'
  return 'default'
}

// 获取节目状态文本
const getProgramStatusText = (program) => {
  switch (program.status) {
    case 0: return '未开始'
    case 1: return '投票中'
    case 2: return '已结束'
    default: return '未知'
  }
}

// 检查是否已经为某个节目投票
const hasVotedForProgram = (programId) => {
  return myVotes.value?.some(vote => vote.program_id === programId) || false
}

// 处理投票时间结束
const handleVoteTimeEnd = () => {
  showToast('投票时间已结束')
  refreshData()
}

// 处理节目点击
const handleProgramClick = (program) => {
  if (program.status === 1 && !hasVotedForProgram(program.id)) {
    goToVote(program.id)
  } else {
    // 显示节目详情或投票状态
    showToast({
      message: hasVotedForProgram(program.id) ? '您已为此节目投票' : '投票暂未开始',
      duration: 2000
    })
  }
}

// 页面导航方法
const goToProfile = () => {
  router.push('/profile')
}

const goToVote = (programId) => {
  router.push(`/vote/${programId}`)
}

const goToResults = () => {
  router.push('/results')
}

const goToMyVotes = () => {
  router.push('/my-votes')
}

const goToAbout = () => {
  router.push('/about')
}

// 加载数据
const loadData = async () => {
  try {
    const [currentProgramRes, programsRes, summaryRes] = await Promise.allSettled([
      programApi.getCurrentProgram(),
      programApi.getPrograms(),
      voteApi.getVotingSummary()
    ])
    
    if (currentProgramRes.status === 'fulfilled' && currentProgramRes.value.code === 200) {
      currentProgram.value = currentProgramRes.value.data.currentProgram
    }
    
    if (programsRes.status === 'fulfilled' && programsRes.value.code === 200) {
      programs.value = programsRes.value.data.programs
    }
    
    if (summaryRes.status === 'fulfilled' && summaryRes.value.code === 200) {
      votingSummary.value = summaryRes.value.data.summary
      myVotes.value = summaryRes.value.data.myVotes || []
    }
  } catch (error) {
    console.error('Load data error:', error)
    showToast({
      type: 'fail',
      message: '数据加载失败',
      duration: 2000
    })
  }
}

// 刷新数据
const refreshData = async () => {
  try {
    refreshing.value = true
    await loadData()
    showToast({
      type: 'success',
      message: '刷新成功',
      duration: 1500
    })
  } catch (error) {
    showToast({
      type: 'fail',
      message: '刷新失败',
      duration: 2000
    })
  } finally {
    refreshing.value = false
  }
}

// 设置自动刷新
const setupAutoRefresh = () => {
  // 每30秒自动刷新一次数据
  refreshTimer.value = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadData()
    }
  }, 30000)
}

// 清除自动刷新
const clearAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 组件挂载
onMounted(async () => {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true
  })
  
  try {
    await loadData()
    setupAutoRefresh()
  } finally {
    closeToast()
  }
})

// 组件卸载
onUnmounted(() => {
  clearAutoRefresh()
})
</script>

<style scoped>
/* 🎨 Ultra Premium Home Dashboard Design */

.home-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Animated Background */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
  opacity: 0.07;
}

.gradient-wave {
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at center, var(--hero-red) 0%, transparent 70%);
  opacity: 0.05;
  animation: wave-motion 20s infinite ease-in-out;
}

.wave-1 {
  top: -50%;
  left: -50%;
  animation-duration: 25s;
}

.wave-2 {
  bottom: -50%;
  right: -50%;
  animation-duration: 30s;
  animation-delay: -10s;
}

.wave-3 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 35s;
  animation-delay: -20s;
}

@keyframes wave-motion {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(1.1);
  }
  50% {
    transform: rotate(180deg) scale(1);
  }
  75% {
    transform: rotate(270deg) scale(0.9);
  }
}

/* Floating Particles System */
.floating-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-particles .particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--hero-red);
  border-radius: 50%;
  opacity: 0.6;
  animation: float-particle 8s linear infinite;
}

.floating-particles .particle:nth-child(odd) {
  background: var(--accent-red);
  animation-duration: 12s;
  width: 6px;
  height: 6px;
}

.floating-particles .particle:nth-child(3n) {
  background: var(--gradient-gold);
  animation-duration: 15s;
  width: 3px;
  height: 3px;
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-20px) translateX(100px) rotate(360deg);
    opacity: 0;
  }
}

/* Dynamic particle positioning */
.floating-particles .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.floating-particles .particle:nth-child(2) { left: 20%; animation-delay: -2s; }
.floating-particles .particle:nth-child(3) { left: 30%; animation-delay: -4s; }
.floating-particles .particle:nth-child(4) { left: 40%; animation-delay: -6s; }
.floating-particles .particle:nth-child(5) { left: 50%; animation-delay: -8s; }
.floating-particles .particle:nth-child(6) { left: 60%; animation-delay: -10s; }
.floating-particles .particle:nth-child(7) { left: 70%; animation-delay: -12s; }
.floating-particles .particle:nth-child(8) { left: 80%; animation-delay: -14s; }
.floating-particles .particle:nth-child(9) { left: 90%; animation-delay: -16s; }
.floating-particles .particle:nth-child(10) { left: 15%; animation-delay: -18s; }
.floating-particles .particle:nth-child(11) { left: 25%; animation-delay: -20s; }
.floating-particles .particle:nth-child(12) { left: 35%; animation-delay: -22s; }
.floating-particles .particle:nth-child(13) { left: 45%; animation-delay: -24s; }
.floating-particles .particle:nth-child(14) { left: 55%; animation-delay: -26s; }
.floating-particles .particle:nth-child(15) { left: 65%; animation-delay: -28s; }

/* Premium Navigation */
.nav-bar {
  z-index: 100;
}

.glass-nav {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
}

:deep(.van-nav-bar__title) {
  color: var(--text-primary);
  font-weight: 700;
  font-size: var(--fs-lg);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-logo {
  font-size: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

.nav-profile-btn {
  position: relative;
  padding: 8px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.5);
  transition: all var(--transition-base);
  cursor: pointer;
}

.nav-profile-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

.profile-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: var(--hero-red);
  border-radius: 50%;
  border: 2px solid white;
}

:deep(.van-nav-bar .van-icon) {
  color: var(--text-primary);
  font-size: 1.25rem;
}

.page-content {
  padding: var(--spacing-xl) var(--spacing-lg) calc(var(--spacing-4xl) + 64px);
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

/* Premium Card Styles */
.neu-card {
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-neu);
  margin-bottom: var(--spacing-2xl);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-base);
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-2xl);
  overflow: hidden;
  transition: all var(--transition-base);
}

.premium-card {
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-2xl);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(211, 47, 47, 0.1);
  transition: all var(--transition-base);
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(211, 47, 47, 0.2);
}

/* Welcome Card */
.welcome-card {
  padding: var(--spacing-xl);
  animation: fadeInDown 0.8s ease-out;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 150%;
  height: 100%;
  background: radial-gradient(ellipse at center, var(--hero-red) 0%, transparent 60%);
  opacity: 0.1;
  filter: blur(40px);
  pointer-events: none;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  position: relative;
  z-index: 2;
}

.user-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.avatar-wrapper {
  position: relative;
}

.avatar-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, var(--accent-red) 0%, transparent 70%);
  opacity: 0.3;
  filter: blur(20px);
  animation: pulse 3s infinite;
}

.gradient-avatar {
  width: 48px;
  height: 48px;
  background: var(--gradient-primary);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: var(--shadow-red);
  overflow: hidden;
}

.gradient-avatar::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--gradient-gold);
  border-radius: var(--radius-xl);
  z-index: -1;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.gradient-avatar:hover::before {
  opacity: 1;
}

.avatar-text {
  font-size: var(--fs-xl);
  font-weight: 800;
  color: var(--text-white);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.avatar-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: var(--gradient-gold);
  color: var(--text-primary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--bg-primary);
}

.user-details {
  flex: 1;
}

.welcome-text {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--fs-lg);
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.greeting {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
}

.username {
  font-weight: 800;
}

.user-meta {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.separator {
  opacity: 0.5;
}

.status-section {
  display: flex;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--fs-sm);
  transition: all var(--transition-base);
}

.status-badge.status-0 {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
  color: var(--warning-color);
}

.status-badge.status-1 {
  background: rgba(211, 47, 47, 0.1);
  border-color: rgba(211, 47, 47, 0.3);
  color: var(--hero-red);
}

.status-badge.status-2 {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
  color: var(--success-color);
}

.status-icon {
  font-size: 1rem;
}

.card-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  opacity: 0.5;
}

.decoration-line {
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 2s infinite;
}

/* Current Program Card */
.current-program {
  padding: 0;
  overflow: visible;
  animation: slideInUp 0.8s ease-out;
}

/* 投票中：整卡低频横向光带扫动 */
.current-program.is-voting {
  position: relative;
}
.current-program.is-voting::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
  opacity: 0.25;
  transform: translateX(-100%);
  animation: sweep 3.5s linear infinite;
  pointer-events: none;
}
@keyframes sweep {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}

.card-spotlight {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--accent-red) 0%, transparent 60%);
  opacity: 0.2;
  filter: blur(60px);
  pointer-events: none;
}

.card-header {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* 已投票：右上角金色对勾角标 */
.current-program.is-voted::before {
  content: '✓';
  position: absolute;
  top: 10px;
  right: 12px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FFED4E);
  color: #7A5E00;
  font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px rgba(255,215,0,0.35);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.live-indicator {
  width: 12px;
  height: 12px;
  background: var(--hero-red);
  border-radius: 50%;
  position: relative;
}

.live-indicator::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: var(--hero-red);
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

.countdown-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-full);
}

.countdown-icon {
  font-size: 1rem;
}

.premium-countdown {
  font-weight: 700;
  font-size: 1rem;
  color: var(--hero-red);
}

.program-showcase {
  padding: var(--spacing-xl);
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: var(--spacing-lg);
  align-items: center;
}

.program-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.number-badge {
  width: 52px;
  height: 52px;
  background: radial-gradient(circle at 30% 30%, #ffdede, #ff8a80);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-xl);
  font-weight: 900;
  color: var(--text-white);
  box-shadow: 0 6px 16px rgba(211, 47, 47, 0.25);
  position: relative;
  overflow: hidden;
}

.number-badge::before {
  content: '';
  position: absolute;
  width: 140%; height: 140%;
  background: conic-gradient(from 180deg, rgba(255,255,255,0.3), rgba(255,255,255,0) 40%);
  top: -20%; left: -20%;
  transform: rotate(25deg);
  opacity: 0.35;
}

.number-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 700;
  letter-spacing: 1px;
}

.program-main {
  flex: 1;
}

/* 标题与副标题排版更突出主标题 */
.program-main .program-title { margin-top: -2px; }
.program-main .performer-info { opacity: 0.9; }

.program-title {
  margin: 0 0 6px 0;
  font-size: clamp(20px, 6vw, 26px);
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.2px;
}

.performer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--spacing-lg);
  color: var(--text-secondary);
}

.performer-icon {
  font-size: 14px;
  opacity: 0.7;
}

.performer-name {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.vote-action {
  margin-top: var(--spacing-xl);
}

.premium-vote-btn {
  position: relative;
  width: 100%;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-full);
  overflow: hidden;
  font-size: var(--fs-base);
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all var(--transition-base);
}

.btn-bg {
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  transition: all var(--transition-base);
  z-index: 1;
}

.premium-vote-btn:hover .btn-bg {
  transform: scale(1.05);
}

.premium-vote-btn.voted .btn-bg {
  background: var(--gradient-gold);
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--text-white);
}

.check-icon {
  font-size: 1.25rem;
}

.vote-icon {
  font-size: 1.25rem;
}

.btn-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
  z-index: 3;
}

.premium-vote-btn:hover .btn-glow {
  opacity: 1;
}

.premium-vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-effects {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  pointer-events: none;
}

.effect-line {
  position: absolute;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0.3;
}

.line-1 {
  bottom: 20px;
  left: 20px;
  right: 40%;
  animation: line-pulse 3s infinite;
}

.line-2 {
  bottom: 10px;
  right: 20px;
  left: 30%;
  animation: line-pulse 3s infinite 1.5s;
}

@keyframes line-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scaleX(1);
  }
  50% {
    opacity: 0.6;
    transform: scaleX(1.05);
  }
}

.no-current-voting {
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.progress-content {
  padding: 24px;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
  background: var(--bg-accent);
  padding: 20px;
  border-radius: var(--border-radius-small);
}

.stat-item {
  text-align: center;
  position: relative;
}

.stat-item::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -1px;
  transform: translateY(-50%);
  width: 1px;
  height: 40px;
  background: rgba(220, 20, 60, 0.2);
}

.stat-item:last-child::after {
  display: none;
}

.stat-item .number {
  font-size: 32px;
  font-weight: 900;
  background: var(--gradient-red);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-item .label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-text {
  text-align: center;
  margin: 20px 0 0 0;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 600;
}

:deep(.van-progress__portion) {
  background: var(--gradient-red) !important;
}

:deep(.van-progress__pivot) {
  background: var(--primary-red) !important;
  color: white !important;
  font-weight: 700 !important;
}

.programs-list {
  padding: 8px 16px 16px;
}

/* 列表卡片基础（统一风格） */
.program-card {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

/* 紧凑列表卡片：在移动设备上展示更多可视信息 */
.compact-program-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.compact-program-card .program-number-badge { grid-column: 1; }
.compact-program-card .program-body { grid-column: 2; }
.compact-program-card .program-actions { grid-column: 3; }

.compact-card { padding: 12px; }

/* 高级质感的节目卡样式增强 */
.program-card-elevated {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(211, 47, 47, 0.06);
}

.program-card-elevated::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(211, 47, 47, 0.05) 50%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.program-card-elevated:hover::before { opacity: 1; }

.program-card-elevated .program-number-badge .number { font-weight: 800; }
.program-card-elevated .program-name { font-weight: 700; color: var(--text-primary); }
.program-card-elevated .program-performer { color: var(--text-secondary); }

.program-card-elevated .status-indicator {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.03);
}

.program-card-elevated.is-active {
  border-color: rgba(211, 47, 47, 0.18);
  box-shadow: 0 6px 18px rgba(211, 47, 47, 0.08);
}

.program-card-elevated.is-voted { border-color: rgba(255, 215, 0, 0.25); }

/* 待评分高亮：温和的红系渐变背景+边框，提高可见度且不过于刺眼 */
.program-card-elevated.need-vote {
  background: linear-gradient(180deg, #fff6f6 0%, #ffffff 60%);
  border-color: rgba(211, 47, 47, 0.16);
}

.program-card-elevated.need-vote .program-name { color: #B71C1C; }
.program-card-elevated.need-vote .program-performer { color: #775555; }

.cta-chip {
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: #B71C1C;
  background: linear-gradient(135deg, rgba(211,47,47,0.12), rgba(255,82,82,0.12));
  border: 1px solid rgba(211,47,47,0.25);
}

.program-name {
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}

.program-performer {
  display: flex; align-items: center; gap: 6px; font-size: var(--fs-sm); margin: 2px 0 0 0;
}

.program-number-badge { position: relative; }
.program-number-badge .number-glow {
  position: absolute; inset: -6px; border-radius: inherit;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, transparent 60%);
  opacity: 0; transition: opacity var(--transition-base);
}
.program-card-elevated:hover .program-number-badge .number-glow,
.program-card-elevated.need-vote .program-number-badge .number-glow { opacity: 1; }

.status-indicator { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
.status-indicator .status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-indicator.status-0 .status-dot { background: #FFB020; }
.status-indicator.status-1 .status-dot { background: #D32F2F; box-shadow: 0 0 0 4px rgba(211,47,47,0.12); animation: pulse-ring 1.2s infinite; }
.status-indicator.status-2 .status-dot { background: #4CAF50; }

/* 投票中：柔和脉冲闪烁 */
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(211,47,47,0.18); }
  70% { box-shadow: 0 0 0 8px rgba(211,47,47,0); }
  100% { box-shadow: 0 0 0 0 rgba(211,47,47,0); }
}

/* 矮屏/横屏，进一步压缩模块间距与隐藏非关键信息 */
@media screen and (max-height: 640px), screen and (orientation: landscape) {
  .welcome-card { padding: var(--spacing-xl); }
  .program-showcase { padding: var(--spacing-xl); gap: var(--spacing-lg); }
  .premium-vote-btn { height: 48px; }
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

.program-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  margin: 8px 0;
  background: var(--bg-primary);
  border-radius: var(--border-radius-small);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.program-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(220, 20, 60, 0.05), transparent);
  transition: left 0.5s;
}

.program-item:hover {
  border-color: var(--secondary-red);
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

.program-item:hover::before {
  left: 100%;
}

.program-item:active {
  transform: translateY(0);
}

.program-index {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--gradient-red);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  margin-right: 16px;
  box-shadow: 0 4px 16px rgba(220, 20, 60, 0.3);
  position: relative;
}

.program-index::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--gradient-red);
  border-radius: 16px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.program-item:hover .program-index::before {
  opacity: 0.5;
}

.program-content {
  flex: 1;
  min-width: 0;
}

.program-content h5 {
  margin: 0 0 6px 0;
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  word-break: break-word;
}

.program-content p {
  margin: 0;
  font-size: var(--fs-base);
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.4;
}

.program-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
}

.program-status .van-tag {
  border-radius: 20px !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  padding: 6px 12px !important;
  border: none !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.program-status .van-tag--primary {
  background: var(--gradient-red-light) !important;
  color: var(--dark-red) !important;
}

.program-status .van-tag--success {
  background: linear-gradient(135deg, #4CAF50, #81C784) !important;
  color: white !important;
}

.program-status .van-tag--default {
  background: linear-gradient(135deg, #E0E0E0, #BDBDBD) !important;
  color: var(--text-secondary) !important;
}

.quick-actions {
  margin-top: 24px;
}

/* 重新设计底部三按钮为胶囊快操作 */
.actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.quick-chip {
  background: linear-gradient(135deg, #fff5f5, #ffffff);
  border: 1px solid rgba(211,47,47,0.16);
  border-radius: 999px;
  padding: 10px 12px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.quick-chip:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(211,47,47,0.12); }
.quick-chip .action-icon span { font-size: 18px; }
.quick-chip .action-text { font-weight: 700; font-size: var(--fs-base); }

:deep(.van-floating-bubble) {
  background: var(--gradient-red) !important;
  box-shadow: var(--shadow-red) !important;
  width: 56px !important;
  height: 56px !important;
  border: 3px solid rgba(255, 255, 255, 0.9) !important;
}

:deep(.van-floating-bubble .van-icon) {
  font-size: 24px !important;
}

/* 增强动画效果 */
.slide-up {
  animation: slideUpEnhanced 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.bounce-in {
  animation: bounceInEnhanced 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes slideUpEnhanced {
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceInEnhanced {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(20px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) translateY(-5px);
  }
  75% {
    opacity: 0.9;
    transform: scale(0.95) translateY(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  50% {
    transform: translate(-45%, -55%) rotate(2deg);
  }
}

/* 状态指示器动画 */
.stat-item .number {
  animation: countUp 1s ease-out;
}

@keyframes countUp {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 375px) {
  .page-content {
    padding: 16px 12px 80px;
  }
  
  .welcome-content {
    padding: 20px;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .user-info {
    flex-direction: column;
    gap: 12px;
  }
  
  .program-info {
    padding: 20px;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-item::after {
    display: none;
  }
  
  .program-item {
    padding: 14px 16px;
  }
  
  .program-index {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
}

@media (min-width: 768px) {
  .page-content {
    max-width: 600px;
    padding: 24px 20px 120px;
  }
  
  .welcome-content {
    padding: 32px;
  }
  
  .card-header {
    padding: 24px 32px 20px;
  }
  
  .program-info {
    padding: 32px;
  }
  
  .progress-content {
    padding: 32px;
  }
}

/* 小屏/矮屏：弱化装饰元素，提高信息密度 */
@media screen and (max-height: 640px), screen and (max-width: 360px) {
  .animated-bg { display: none; }
  .card-glow, .card-spotlight, .card-effects { display: none; }
  .welcome-card { padding: var(--spacing-lg); }
  .programs-list { padding: 6px 10px 10px; }
  .program-card { padding: 8px 10px; }
  .filter-tabs .filter-tab { font-size: var(--fs-sm); }
}
</style>