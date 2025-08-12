<template>
  <div class="results-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      title="投票结果"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
      class="nav-bar"
    >
      <template #right>
        <van-icon name="replay" @click="refreshData" />
      </template>
    </van-nav-bar>
    
    <div class="page-content">
      <!-- 维度切换标签 -->
      <van-tabs v-model:active="activeDimension" @change="handleDimensionChange" class="dimension-tabs">
        <van-tab title="综合排名" name="composite" />
        <van-tab title="台风表现" name="stage_presence" />
        <van-tab title="表演水平" name="performance" />
        <van-tab title="人气指数" name="popularity" />
        <van-tab title="团队默契" name="teamwork" />
        <van-tab title="创意创新" name="creativity" />
      </van-tabs>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
      
      <!-- 排行榜 -->
      <div v-else class="leaderboard-container">
        <!-- 排行榜头部 -->
        <div class="leaderboard-header card">
          <div class="header-content">
            <h3>{{ getDimensionTitle() }}</h3>
            <p class="update-time">更新时间：{{ formatTime(lastUpdateTime) }}</p>
          </div>
          <div class="participation-info">
            <div class="stat-item">
              <span class="number">{{ statistics?.totalVotes || 0 }}</span>
              <span class="label">总投票数</span>
            </div>
            <div class="stat-item">
              <span class="number">{{ statistics?.uniqueVoters || 0 }}</span>
              <span class="label">参与人数</span>
            </div>
          </div>
        </div>
        
        <!-- 前三名特殊展示 -->
        <div class="top-three-container">
          <div class="podium">
            <!-- 第二名 -->
            <div v-if="topPrograms[1]" class="podium-item second-place">
              <div class="medal">🥈</div>
              <div class="program-card">
                <div class="rank-number">2</div>
                <h4>{{ topPrograms[1].title }}</h4>
                <p>{{ topPrograms[1].performer }}</p>
                <div class="score">{{ getDisplayScore(topPrograms[1]) }}</div>
              </div>
            </div>
            
            <!-- 第一名 -->
            <div v-if="topPrograms[0]" class="podium-item first-place">
              <div class="medal">🥇</div>
              <div class="program-card winner">
                <div class="rank-number">1</div>
                <h4>{{ topPrograms[0].title }}</h4>
                <p>{{ topPrograms[0].performer }}</p>
                <div class="score">{{ getDisplayScore(topPrograms[0]) }}</div>
              </div>
            </div>
            
            <!-- 第三名 -->
            <div v-if="topPrograms[2]" class="podium-item third-place">
              <div class="medal">🥉</div>
              <div class="program-card">
                <div class="rank-number">3</div>
                <h4>{{ topPrograms[2].title }}</h4>
                <p>{{ topPrograms[2].performer }}</p>
                <div class="score">{{ getDisplayScore(topPrograms[2]) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 完整排行榜 -->
        <div class="full-leaderboard card">
          <div class="card-header">
            <h4>完整排行榜</h4>
          </div>
          <div class="leaderboard-list">
            <div 
              v-for="(program, index) in leaderboard" 
              :key="program.id"
              class="leaderboard-item"
              :class="{ 
                'top-rank': index < 3,
                'my-vote': hasVotedForProgram(program.id)
              }"
            >
              <div class="rank-badge" :class="getRankClass(index + 1)">
                {{ index + 1 }}
              </div>
              <div class="program-info">
                <h5>{{ program.title }}</h5>
                <p class="performer">{{ program.performer }}</p>
                <p class="seq-info">第{{ program.seq_no }}个节目</p>
              </div>
              <div class="score-info">
                <div class="main-score">{{ getDisplayScore(program) }}</div>
                <div class="vote-count">{{ program.vote_count || 0 }}票</div>
              </div>
              <div class="vote-indicator" v-if="hasVotedForProgram(program.id)">
                <van-icon name="success" color="#52c41a" size="16" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- 统计信息 -->
        <div class="statistics-card card">
          <div class="card-header">
            <h4>📈 统计信息</h4>
          </div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-number">{{ statistics?.participationRate || 0 }}%</div>
              <div class="stat-label">参与率</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ getAverageScore() }}</div>
              <div class="stat-label">平均分</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ getHighestScore() }}</div>
              <div class="stat-label">最高分</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ leaderboard.length }}</div>
              <div class="stat-label">参赛节目</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 刷新按钮 -->
    <van-floating-bubble
      axis="xy"
      icon="replay"
      @click="refreshData"
      :loading="refreshing"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { voteApi } from '@/api/vote'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(true)
const refreshing = ref(false)
const activeDimension = ref('composite')
const leaderboard = ref([])
const statistics = ref(null)
const lastUpdateTime = ref(new Date())
const myVotes = ref([])
const refreshTimer = ref(null)

// 计算属性
const topPrograms = computed(() => leaderboard.value.slice(0, 3))

// 维度标题映射
const dimensionTitles = {
  composite: '综合排名',
  stage_presence: '台风表现排名',
  performance: '表演水平排名',
  popularity: '人气指数排名',
  teamwork: '团队默契排名',
  creativity: '创意创新排名'
}

// 获取维度标题
const getDimensionTitle = () => {
  return dimensionTitles[activeDimension.value] || '排行榜'
}

// 获取显示分数
const getDisplayScore = (program) => {
  if (activeDimension.value === 'composite') {
    return (program.avg_score || 0).toFixed(2) + '分'
  } else {
    return (program.avg_score || 0).toFixed(2) + '星'
  }
}

// 获取排名样式类
const getRankClass = (rank) => {
  if (rank === 1) return 'rank-first'
  if (rank === 2) return 'rank-second'
  if (rank === 3) return 'rank-third'
  return 'rank-other'
}

// 检查是否为用户投票的节目
const hasVotedForProgram = (programId) => {
  return myVotes.value.some(vote => vote.program_id === programId)
}

// 获取平均分
const getAverageScore = () => {
  if (!leaderboard.value.length) return '0.00'
  const totalScore = leaderboard.value.reduce((sum, program) => sum + (program.avg_score || 0), 0)
  return (totalScore / leaderboard.value.length).toFixed(2)
}

// 获取最高分
const getHighestScore = () => {
  if (!leaderboard.value.length) return '0.00'
  const maxScore = Math.max(...leaderboard.value.map(program => program.avg_score || 0))
  return maxScore.toFixed(2)
}

// 格式化时间
const formatTime = (date) => {
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 处理维度切换
const handleDimensionChange = (dimension) => {
  activeDimension.value = dimension
  loadLeaderboard()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载排行榜数据
const loadLeaderboard = async () => {
  try {
    const response = await voteApi.getLeaderboard({
      dimension: activeDimension.value,
      limit: 20
    })
    
    if (response.code === 200) {
      leaderboard.value = response.data.programs
      lastUpdateTime.value = new Date(response.data.timestamp)
    }
  } catch (error) {
    console.error('Load leaderboard error:', error)
    showToast({
      type: 'fail',
      message: '排行榜加载失败',
      duration: 2000
    })
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await voteApi.getVotingStatistics()
    
    if (response.code === 200) {
      statistics.value = response.data.overall
    }
  } catch (error) {
    console.error('Load statistics error:', error)
  }
}

// 加载我的投票记录
const loadMyVotes = async () => {
  try {
    const response = await voteApi.getMyVotes()
    
    if (response.code === 200) {
      myVotes.value = response.data.votes
    }
  } catch (error) {
    console.error('Load my votes error:', error)
  }
}

// 加载所有数据
const loadAllData = async () => {
  try {
    loading.value = true
    
    await Promise.allSettled([
      loadLeaderboard(),
      loadStatistics(),
      loadMyVotes()
    ])
  } catch (error) {
    console.error('Load all data error:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  try {
    refreshing.value = true
    
    await loadAllData()
    
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
  // 每30秒自动刷新一次排行榜
  refreshTimer.value = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadLeaderboard()
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
  await loadAllData()
  setupAutoRefresh()
})

// 组件卸载
onUnmounted(() => {
  clearAutoRefresh()
})
</script>

<style scoped>
.results-page {
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
  font-size: var(--fs-lg);
}

.page-content {
  padding-bottom: 72px;
}

.dimension-tabs {
  background: white;
  margin-bottom: 12px;
}

:deep(.van-tab) {
  font-size: var(--fs-base);
}

:deep(.van-tabs__line) {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.leaderboard-container {
  padding: 0 12px;
}

.leaderboard-header {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  padding: 14px 14px 0 14px;
}

.header-content h3 {
  margin: 0 0 6px 0;
  font-size: var(--fs-xl);
  font-weight: 600;
}

.update-time {
  margin: 0;
  opacity: 0.8;
  font-size: var(--fs-sm);
}

.participation-info {
  display: flex;
  justify-content: space-around;
  padding: 12px 14px 14px 14px;
}

.stat-item {
  text-align: center;
}

.stat-item .number {
  display: block;
  font-size: var(--fs-xl);
  font-weight: 600;
  margin-bottom: 2px;
}

.stat-item .label {
  font-size: var(--fs-xs);
  opacity: 0.8;
}

.top-three-container {
  margin-bottom: 16px;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 6px;
  padding: 0 6px;
}

.podium-item {
  flex: 1;
  text-align: center;
  position: relative;
}

.medal {
  font-size: 32px;
  margin-bottom: 8px;
}

.program-card {
  background: white;
  border-radius: 12px;
  padding: 12px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: transform 0.2s ease;
}

.program-card.winner {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
}

.first-place {
  order: 2;
}

.second-place {
  order: 1;
}

.third-place {
  order: 3;
}

.rank-number {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  font-size: var(--fs-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.program-card h4 {
  margin: 6px 0 4px 0;
  font-size: var(--fs-base);
  font-weight: 600;
}

.program-card p {
  margin: 0 0 6px 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}

.program-card .score {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--primary-color);
}

.full-leaderboard {
  margin-bottom: 16px;
}

.leaderboard-list {
  padding: 0 14px 14px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  position: relative;
  transition: background-color 0.2s ease;
}

.leaderboard-item:hover {
  background-color: #fafafa;
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.leaderboard-item.top-rank {
  background: linear-gradient(90deg, rgba(255, 107, 107, 0.05) 0%, rgba(78, 205, 196, 0.05) 100%);
}

.leaderboard-item.my-vote {
  background: rgba(82, 196, 26, 0.05);
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--fs-sm);
  margin-right: 10px;
}

.rank-first {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
}

.rank-second {
  background: linear-gradient(135deg, #c0c0c0, #e6e6e6);
  color: #333;
}

.rank-third {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: white;
}

.rank-other {
  background: #f0f0f0;
  color: var(--text-secondary);
}

.program-info {
  flex: 1;
}

.program-info h5 {
  margin: 0 0 4px 0;
  font-size: var(--fs-lg);
  color: var(--text-primary);
}

.performer {
  margin: 0 0 2px 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
}

.seq-info {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--text-light);
}

.score-info {
  text-align: right;
  margin-right: 8px;
}

.main-score {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 2px;
}

.vote-count {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
}

.vote-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
}

.statistics-card {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px;
}

.stat-box {
  text-align: center;
  padding: 12px 6px;
  background: #fafafa;
  border-radius: 8px;
}

.stat-number {
  font-size: var(--fs-xl);
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
}

:deep(.van-floating-bubble) {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
}

/* 响应式 */
@media (max-width: 375px) {
  .leaderboard-container {
    padding: 0 10px;
  }
  
  .podium {
    padding: 0 2px;
    gap: 2px;
  }
  
  .program-card {
    padding: 10px 6px;
  }
  
  .program-card h4 {
    font-size: 13px;
  }
  
  .program-card p {
    font-size: 11px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }
}

/* 小屏/矮屏：隐藏领奖台，专注列表信息 */
@media screen and (max-height: 640px), screen and (max-width: 360px) {
  .top-three-container { display: none; }
}
</style>