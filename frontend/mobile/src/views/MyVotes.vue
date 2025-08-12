<template>
  <div class="my-votes-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      title="我的投票"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="page-content">
      <!-- 投票统计卡片 -->
      <div class="vote-summary card slide-up">
        <div class="summary-header">
          <h3>投票统计</h3>
          <div class="summary-stats">
            <div class="stat-item">
              <div class="number">{{ votes.length }}</div>
              <div class="label">已投票</div>
            </div>
            <div class="stat-item">
              <div class="number">{{ getAverageScore() }}</div>
              <div class="label">平均分</div>
            </div>
            <div class="stat-item">
              <div class="number">{{ getHighestScore() }}</div>
              <div class="label">最高分</div>
            </div>
          </div>
        </div>
        
        <div class="progress-section">
          <van-progress 
            :percentage="getVotingProgress()"
            stroke-width="8"
            color="linear-gradient(135deg, #ff6b6b, #4ecdc4)"
            track-color="#f0f0f0"
          />
          <p class="progress-text">
            投票进度：{{ votes.length }} / {{ totalPrograms }} 个节目
          </p>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
      
      <!-- 投票记录列表 -->
      <div v-else-if="votes.length > 0" class="votes-list">
        <div 
          v-for="vote in votes" 
          :key="vote.id"
          class="vote-item card bounce-in"
        >
          <div class="vote-header">
            <div class="program-info">
              <h4>{{ vote.program_title }}</h4>
              <p class="performer">{{ vote.performer }}</p>
            </div>
            <div class="vote-time">
              {{ formatTime(vote.submitted_at) }}
            </div>
          </div>
          
          <div class="vote-scores">
            <div class="scores-grid">
              <div class="score-item" v-for="dimension in dimensions" :key="dimension.key">
                <div class="score-label">
                  <div class="dimension-icon-mini" :style="{ backgroundColor: dimension.color }">
                    <span class="icon">{{ dimension.icon }}</span>
                  </div>
                  <div class="dimension-text">
                    <span class="name">{{ dimension.name }}</span>
                    <span class="weight">权重{{ dimension.weight }}%</span>
                  </div>
                </div>
                <div class="score-value">
                  <div class="stars">
                    <span v-for="star in 5" :key="star" class="star" :class="{ active: star <= vote[dimension.key] }" :style="{ color: star <= vote[dimension.key] ? dimension.color : '#e0e0e0' }">⭐</span>
                  </div>
                  <span class="number" :style="{ color: dimension.color }">{{ vote[dimension.key] }}</span>
                </div>
              </div>
            </div>
            
            <div class="total-score">
              <span class="total-label">总分</span>
              <span class="total-number">{{ vote.composite_score }} / 25</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state card">
        <van-empty
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          description="还没有投票记录"
        >
          <van-button type="primary" @click="goToHome">去投票</van-button>
        </van-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { voteApi } from '@/api/vote'
import { programApi } from '@/api/program'

const router = useRouter()

// 响应式数据
const loading = ref(true)
const votes = ref([])
const totalPrograms = ref(0)

// 评分维度定义（与 Vote.vue 保持一致）
const dimensions = [
  {
    key: 'stage_presence',
    name: '台风',
    icon: '⭐',
    weight: 20,
    color: '#ff6b6b'
  },
  {
    key: 'performance',
    name: '表演',
    icon: '🎭',
    weight: 25,
    color: '#4ecdc4'
  },
  {
    key: 'popularity',
    name: '人气',
    icon: '❤️',
    weight: 20,
    color: '#45b7d1'
  },
  {
    key: 'teamwork',
    name: '默契',
    icon: '🤝',
    weight: 15,
    color: '#f9ca24'
  },
  {
    key: 'creativity',
    name: '创意',
    icon: '💡',
    weight: 20,
    color: '#6c5ce7'
  }
]

// 计算属性
const getVotingProgress = () => {
  if (totalPrograms.value === 0) return 0
  return Math.round((votes.value.length / totalPrograms.value) * 100)
}

const getAverageScore = () => {
  if (votes.value.length === 0) return '0.0'
  const totalScore = votes.value.reduce((sum, vote) => sum + vote.composite_score, 0)
  return (totalScore / votes.value.length).toFixed(1)
}

const getHighestScore = () => {
  if (votes.value.length === 0) return '0'
  return Math.max(...votes.value.map(vote => vote.composite_score))
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 页面导航
const goBack = () => {
  router.back()
}

const goToHome = () => {
  router.push('/home')
}

// 加载投票记录
const loadVotes = async () => {
  try {
    loading.value = true
    
    const [votesRes, programsRes] = await Promise.allSettled([
      voteApi.getMyVotes(),
      programApi.getPrograms()
    ])
    
    if (votesRes.status === 'fulfilled' && votesRes.value.code === 200) {
      votes.value = votesRes.value.data.votes
    }
    
    if (programsRes.status === 'fulfilled' && programsRes.value.code === 200) {
      totalPrograms.value = programsRes.value.data.programs.length
    }
  } catch (error) {
    console.error('Load votes error:', error)
    showToast({
      type: 'fail',
      message: '数据加载失败',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}

// 组件挂载
onMounted(async () => {
  await loadVotes()
})
</script>

<style scoped>
.my-votes-page {
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

.vote-summary {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-header {
  padding: 20px 20px 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.summary-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.summary-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-item .number {
  display: block;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-item .label {
  font-size: 12px;
  opacity: 0.8;
}

.progress-section {
  padding: 16px 20px 20px 20px;
}

.progress-text {
  text-align: center;
  margin: 12px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.votes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vote-item {
  overflow: hidden;
}

.vote-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.program-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.performer {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.vote-time {
  font-size: 12px;
  color: var(--text-light);
  text-align: right;
}

.vote-scores {
  padding: 20px;
}

.scores-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.dimension-icon-mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.dimension-icon-mini .icon {
  font-size: 14px;
  color: white;
}

.dimension-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dimension-text .name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.dimension-text .weight {
  font-size: 10px;
  color: #999;
}

.score-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  opacity: 0.3;
}

.star.active {
  opacity: 1;
}

.number {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 20px;
  text-align: center;
}

.total-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(78, 205, 196, 0.1));
  border-radius: 8px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.total-number {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

.empty-state {
  padding: 60px 20px;
}

/* 动画 */
.slide-up {
  animation: slideUp 0.4s ease;
}

.bounce-in {
  animation: bounceIn 0.6s ease;
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

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式 */
@media (max-width: 375px) {
  .page-content {
    padding: 12px;
  }
  
  .summary-header {
    padding: 16px 16px 0 16px;
  }
  
  .progress-section {
    padding: 12px 16px 16px 16px;
  }
  
  .vote-scores {
    padding: 16px;
  }
}
</style>