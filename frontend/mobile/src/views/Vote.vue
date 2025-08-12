<template>
  <div class="vote-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      title="节目投票"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
      class="nav-bar"
    >
      <template #right v-if="program && program.remainingTime > 0">
        <van-count-down 
          :time="program.remainingTime * 1000"
          format="mm:ss"
          @finish="handleTimeEnd"
          class="countdown"
        />
      </template>
    </van-nav-bar>
    
    <div class="page-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
      
      <!-- 节目信息 -->
      <div v-else-if="program" class="program-info card slide-up">
        <div class="program-header">
          <div class="program-number">第{{ program.seqNo }}个节目</div>
          <div class="program-status">
            <van-tag :type="getStatusType()" size="medium">
              {{ getStatusText() }}
            </van-tag>
          </div>
        </div>
        <h2 class="program-title">{{ program.title }}</h2>
        <p class="program-performer">表演：{{ program.performer }}</p>
        <p v-if="program.description" class="program-description">{{ program.description }}</p>
        
        <!-- 投票提示 -->
        <div class="vote-hint">
          <van-notice-bar
            v-if="!showVotingForm"
            :text="getVoteHint()"
            :color="getHintColor()"
            background="#fff3cd"
            left-icon="warning-o"
          />
          <van-notice-bar
            v-else
            text="请根据节目表现给出公正的评分，每个维度1-5星"
            color="#52c41a"
            background="#f6ffed"
            left-icon="info-o"
          />
        </div>
      </div>
      
      <!-- 投票表单 -->
      <div v-if="program && showVotingForm" class="vote-form card bounce-in">
        <div class="form-header">
          <h3>🌟 五维度评分</h3>
          <div class="progress-pill">已评分：{{ getCompletedCount() }} / 5</div>
          <p>请根据节目表现给出公正评分，每个维度1-5星</p>
          <div class="scoring-tips">
            <van-notice-bar
              color="#1989fa"
              background="#ecf9ff"
              left-icon="info-o"
            >
              💡 点击星星评分，再次点击可取消。每个维度权重不同，请综合考虑。
            </van-notice-bar>
          </div>
        </div>
        
        <div class="rating-sections">
          <div 
            v-for="dimension in dimensions" 
            :key="dimension.key"
            class="rating-section"
          >
            <div class="dimension-header">
              <div class="dimension-info">
                <div class="dimension-icon-wrapper" :style="{ backgroundColor: dimension.color }">
                  <span class="dimension-icon">{{ dimension.icon }}</span>
                </div>
                <div class="dimension-text">
                  <div class="dimension-name-row">
                    <h4>{{ dimension.name }}</h4>
                    <span class="dimension-weight">权重 {{ dimension.weight }}%</span>
                  </div>
                  <p>{{ dimension.description }}</p>
                </div>
              </div>
              <div class="current-rating">
                <div class="rating-display">
                  <span class="rating-score" :style="{ color: dimension.color }">{{ scores[dimension.key] || 0 }}</span>
                  <span class="rating-label">星</span>
                </div>
                <span class="rating-text">{{ getRatingText(scores[dimension.key]) }}</span>
                <span class="count-badge" :style="{ borderColor: dimension.color, color: dimension.color }">{{ scores[dimension.key] || 0 }}/5</span>
              </div>
            </div>
            
            <!-- 增强星级评分 -->
            <div class="star-rating-container">
              <div class="star-rating">
                <div 
                  v-for="star in 5" 
                  :key="star"
                  class="star-item"
                  :class="{ 
                    active: star <= (scores[dimension.key] || 0),
                    hover: star <= hoverStars[dimension.key]
                  }"
                  @click="handleClick(dimension.key, star, $event)"
                  @touchstart="onTouchStart(dimension.key, star, $event)"
                  @touchend="onTouchEnd"
                  @mouseenter="setHoverStars(dimension.key, star)"
                  @mouseleave="clearHoverStars(dimension.key)"
                >
                  <span class="star-inner" :style="{ color: getStarColor(dimension, star) }">★</span>
                  <div class="ripple-effect" v-if="rippleStars[dimension.key] === star"></div>
                </div>
              </div>
              <div class="rating-labels">
                <span v-for="(label, index) in ratingLabels" :key="index" class="rating-label-item">
                  {{ label }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 提交按钮 -->
        <div class="submit-section">
          <div class="score-summary">
            <p>总分：<span class="total-score">{{ getTotalScore() }}</span> / 25</p>
            <p class="progress-text">已完成：{{ getCompletedCount() }} / 5 个维度</p>
          </div>
          
          <button
            class="btn-premium submit-btn-strong"
            :disabled="!canSubmitVote() || submitting"
            @click="submitVote"
          >
            <span v-if="!submitting">
              {{ getSubmitButtonText() }}
            </span>
            <span v-else>🔄 提交中...</span>
          </button>
        </div>
      </div>
      
      <!-- 已投票状态 -->
      <div v-else-if="program && hasVoted" class="voted-status card">
        <van-empty 
          image="https://fastly.jsdelivr.net/npm/@vant/assets/success.png"
          description="您已为此节目投票"
          class="voted-empty"
        >
          <div class="voted-info">
            <h4>您的评分</h4>
            <div class="voted-scores">
              <div 
                v-for="dimension in dimensions" 
                :key="dimension.key"
                class="voted-score-item"
              >
                <span class="dimension-name">{{ dimension.name }}</span>
                <div class="score-display">
                  <span class="score-stars">
                    <span v-for="star in 5" :key="star" class="star" :class="{ active: star <= (myVote?.[dimension.key] || 0) }">⭐</span>
                  </span>
                  <span class="score-number">{{ myVote?.[dimension.key] || 0 }}</span>
                </div>
              </div>
            </div>
            <p class="voted-time">投票时间：{{ formatTime(myVote?.submittedAt) }}</p>
          </div>
        </van-empty>
      </div>
      
      
      <!-- 投票不可用状态（未开始/已结束） -->
      <div v-else-if="program && !canRate()" class="unavailable-status card">
        <div class="result-panel">
          <h4 class="panel-title">{{ resultPanelTitle }}</h4>
          <p class="panel-sub">节目：{{ program.title }}（表演：{{ program.performer }}）</p>

          <!-- 已结束或已投票显示我的评分；窗口未开时不展示我的评分提示文案 -->
          <div class="my-vote-block" v-if="myVote && !canRate()">
            <h5>我的评分</h5>
            <div class="my-dimensions">
              <div class="dim" v-for="dim in dimensions" :key="dim.key">
                <span class="dim-name">{{ dim.name }}</span>
                <span class="dim-stars">
                  <span v-for="s in 5" :key="s" class="star" :class="{ active: s <= (myVote[dim.key]||0) }">⭐</span>
                </span>
                <span class="dim-score">{{ myVote[dim.key] || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="stats-block" v-if="programStats && !canRate()">
            <h5>全体统计</h5>
            <div class="stats-grid">
              <div class="stat-row" v-for="dim in dimensions" :key="dim.key">
                <span class="stat-name">{{ dim.name }}</span>
                <span class="stat-avg">平均分：{{ (programStats[dim.key]?.avg || 0).toFixed(2) }}</span>
                <span class="stat-total">总星：{{ programStats[dim.key]?.total || 0 }}</span>
                <span class="stat-five">5星票：{{ programStats[dim.key]?.fiveStar || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="stats-summary" v-else-if="!canRate()">
            <van-empty image="https://fastly.jsdelivr.net/npm/@vant/assets/success.png" description="您未参与该节目评分" />
          </div>

          <div class="stats-summary" v-else>
            <van-empty image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png" description="当前节目投票窗口未开启或已关闭" />
          </div>

          <van-button class="back-btn" type="primary" @click="goBack">返回首页</van-button>
        </div>
      </div>
      
      <!-- 节目不存在 -->
      <div v-else class="not-found card">
        <van-empty 
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          description="节目不存在或已被删除"
        >
          <van-button type="primary" @click="goBack">返回首页</van-button>
        </van-empty>
      </div>
    </div>
    
    <!-- 确认提交弹窗 -->
    <van-dialog
      v-model:show="showConfirmDialog"
      title="确认提交投票"
      show-cancel-button
      @confirm="confirmSubmit"
      @cancel="showConfirmDialog = false"
    >
      <div class="confirm-content">
        <p>请确认您的评分：</p>
        <div class="confirm-scores">
          <div v-for="dimension in dimensions" :key="dimension.key" class="confirm-score-item">
            <span>{{ dimension.name }}：{{ scores[dimension.key] || 0 }}星</span>
          </div>
        </div>
        <p class="confirm-warning">⚠️ 投票提交后无法修改</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { programApi } from '@/api/program'
import { voteApi } from '@/api/vote'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Props
const props = defineProps({
  programId: {
    type: Number,
    required: true
  }
})

// 响应式数据
const loading = ref(true)
const submitting = ref(false)
const showConfirmDialog = ref(false)
const program = ref(null)
// 方案A：不再使用 canVote；保留占位避免大改
const canVote = ref(true)
const hasVoted = ref(false)
const myVote = ref(null)
const programStats = ref(null)
const refreshTimer = ref(null)
const hoverStars = reactive({})
const rippleStars = reactive({})
const touchTimer = ref(null)

// 评分标签
const ratingLabels = ['很差', '较差', '一般', '较好', '很好']

// 评分数据
const scores = reactive({
  stagePresence: 0,
  performance: 0,
  popularity: 0,
  teamwork: 0,
  creativity: 0
})

// 评分维度定义（按设计文档要求）
const dimensions = [
  {
    key: 'stagePresence',
    name: '台风',
    englishName: 'StagePresence',
    icon: '⭐',
    description: '舞台表现力、气场、自信度',
    weight: 20,
    color: '#ff6b6b'
  },
  {
    key: 'performance',
    name: '表演',
    englishName: 'Performance', 
    icon: '🎭',
    description: '技巧水平、完成度、专业性',
    weight: 25,
    color: '#4ecdc4'
  },
  {
    key: 'popularity',
    name: '人气',
    englishName: 'Popularity',
    icon: '❤️',
    description: '观众喜爱度、互动响应',
    weight: 20,
    color: '#45b7d1'
  },
  {
    key: 'teamwork',
    name: '默契',
    englishName: 'Teamwork',
    icon: '🤝',
    description: '团队配合、协调性',
    weight: 15,
    color: '#f9ca24'
  },
  {
    key: 'creativity',
    name: '创意',
    englishName: 'Creativity',
    icon: '💡',
    description: '创新性、独特性、惊喜度',
    weight: 20,
    color: '#6c5ce7'
  }
]

// 根据维度初始化交互状态（必须在 dimensions 定义之后）
dimensions.forEach(dim => {
  hoverStars[dim.key] = 0
  rippleStars[dim.key] = 0
})

// 计算属性
const getTotalScore = () => {
  return Object.values(scores).reduce((sum, score) => sum + score, 0)
}

const getCompletedCount = () => {
  return Object.values(scores).filter(score => score > 0).length
}

const isFormValid = () => Object.values(scores).every(score => Number(score) > 0)

// 检查是否可以进行评分（使用后端的 isVotingActive 字段）
const canRate = () => {
  if (!program.value) return false
  if (hasVoted.value) return false
  
  // 优先使用后端的 isVotingActive 字段
  if (program.value.hasOwnProperty('isVotingActive')) {
    return program.value.isVotingActive
  }
  
  // 降级到基本状态判断
  return program.value.status === 1
}

// 检查是否可以提交投票
const canSubmitVote = () => {
  if (!canRate()) return false
  if (!isFormValid()) return false
  return true
}

// 获取提交按钮文本
const getSubmitButtonText = () => {
  if (!program.value) return '加载中...'
  if (hasVoted.value) return '✅ 已投票'
  if (program.value.status === 0) return '⏳ 投票未开始'
  
  // 对于状态=1的节目，检查实际的投票窗口状态
  if (program.value.status === 1) {
    if (program.value.hasOwnProperty('isVotingActive')) {
      if (!program.value.isVotingActive) return '⏰ 投票已结束'
    }
    if (!isFormValid()) return `📋 请完成评分 (${getCompletedCount()}/5)`
    return '🌟 提交评分'
  }
  
  if (program.value.status === 2) return '⏰ 投票已结束'
  return '🌟 提交评分'
}

// 获取状态类型
const getStatusType = () => {
  if (!program.value) return 'default'
  
  // 对于状态=1的节目，检查实际的投票窗口状态
  if (program.value.status === 1) {
    if (program.value.hasOwnProperty('isVotingActive')) {
      return program.value.isVotingActive ? 'primary' : 'warning'
    }
    return 'primary'
  }
  
  switch (program.value.status) {
    case 2: return 'success'
    default: return 'default'
  }
}

// 将后端统计数据标准化为五维度结构
const normalizeStats = (raw) => {
  // 兼容两种可能的返回结构：
  // 1) { overall: { stage_presence: {avg,total,fiveStar}, ... } }
  // 2) { stage_presence: {...}, performance: {...}, ... }
  const src = raw?.overall || raw || {}
  const mapKey = {
    stagePresence: 'stage_presence',
    performance: 'performance',
    popularity: 'popularity',
    teamwork: 'teamwork',
    creativity: 'creativity'
  }
  const result = {}
  Object.entries(mapKey).forEach(([frontKey, apiKey]) => {
    const item = src[apiKey] || {}
    result[frontKey] = {
      avg: item.avg || 0,
      total: item.total_stars || item.total || 0,
      voteCount: item.vote_count || 0,
      fiveStar: item.five_star_count || item.fiveStar || 0
    }
  })
  return result
}

// 获取状态文本（优先使用后端的 isVotingActive 字段，确保状态一致性）
const getStatusText = () => {
  if (!program.value) return '未知'
  if (hasVoted.value) return '已投票'
  
  // 对于状态=1的节目，需要检查实际的投票窗口状态
  if (program.value.status === 1) {
    // 如果后端提供了 isVotingActive 字段，优先使用
    if (program.value.hasOwnProperty('isVotingActive')) {
      return program.value.isVotingActive ? '投票中' : '投票已结束'
    }
    // 降级到基本状态判断
    return '投票中'
  }
  
  switch (program.value.status) {
    case 0: return '未开始'
    case 2: return '已结束'
    default: return '未知'
  }
}

// 显示投票表单：使用后端的 isVotingActive 字段确保准确性
const showVotingForm = computed(() => {
  if (!program.value || hasVoted.value) return false
  
  // 优先使用后端的 isVotingActive 字段
  if (program.value.hasOwnProperty('isVotingActive')) {
    return program.value.isVotingActive
  }
  
  // 降级到基本状态判断
  return program.value.status === 1
})

// 获取投票提示
const getVoteHint = () => {
  if (!program.value) return '节目信息加载中...'
  if (hasVoted.value) return '您已为此节目投票'
  if (program.value.status === 0) return '投票尚未开始'
  
  // 对于状态=1的节目，检查实际的投票窗口状态
  if (program.value.status === 1) {
    if (program.value.hasOwnProperty('isVotingActive')) {
      return program.value.isVotingActive ? '投票进行中' : '投票已结束'
    }
    return '投票进行中'
  }
  
  return '投票已结束'
}

// 获取提示颜色
const getHintColor = () => {
  if (hasVoted.value) return '#52c41a'
  
  // 检查实际的投票状态
  if (program.value?.status === 1) {
    if (program.value.hasOwnProperty('isVotingActive')) {
      return program.value.isVotingActive ? '#1890ff' : '#faad14'
    }
    return '#1890ff'
  }
  
  return '#faad14'
}

// 结果面板标题
const resultPanelTitle = computed(() => {
  if (!program.value) return '提示'
  if (program.value.status === 0) return '投票未开始'
  
  // 对于状态=1的节目，检查实际的投票窗口状态
  if (program.value.status === 1) {
    if (program.value.hasOwnProperty('isVotingActive')) {
      return program.value.isVotingActive ? '投票进行中' : '投票已结束'
    }
    return '投票进行中'
  }
  
  return '投票已结束'
})

// 获取评分文本
const getRatingText = (score) => {
  const texts = ['未评分', '很差', '较差', '一般', '较好', '很好']
  return texts[score] || '未评分'
}

// 获取星星颜色
const getStarColor = (dimension, starIndex) => {
  const currentScore = scores[dimension.key] || 0
  const hoverScore = hoverStars[dimension.key] || 0
  const lit = Math.max(currentScore, hoverScore)
  
  // 调试信息
  if (currentScore > 0) {
    console.log(`星星颜色计算: ${dimension.key}, 第${starIndex}颗星, 当前评分: ${currentScore}, 悬停: ${hoverScore}, 点亮: ${lit}`)
  }
  
  // 统一点亮为鲜艳黄色
  return starIndex <= lit ? '#FFC107' : '#cbd5e1'
}

// 设置悬停星级
const setHoverStars = (dimensionKey, stars) => {
  if (canRate()) {
    hoverStars[dimensionKey] = stars
  }
}

// 清除悬停星级
const clearHoverStars = (dimensionKey) => {
  hoverStars[dimensionKey] = 0
}

// 防止重复触发的标识
const isHandlingTouch = ref(false)
const touchTimeout = ref(null)
const currentTouchDimension = ref(null)

// 触摸开始（移动端立即响应评分）
const onTouchStart = (dimensionKey, star, event) => {
  if (!canRate()) return
  
  // 阻止后续的click事件
  event.preventDefault()
  
  // 防止快速重复触发
  if (isHandlingTouch.value) return
  isHandlingTouch.value = true
  currentTouchDimension.value = dimensionKey
  
  // 触觉反馈
  if (navigator.vibrate) {
    navigator.vibrate(30)
  }
  
  // 显示涟漪效果
  rippleStars[dimensionKey] = star
  // 直接设置评分，保证在移动端无需等待 click 事件
  setRating(dimensionKey, star)
  
  // 清除之前的定时器
  if (touchTimer.value) {
    clearTimeout(touchTimer.value)
  }
  
  // 0.3秒后清除涟漪效果
  touchTimer.value = setTimeout(() => {
    rippleStars[dimensionKey] = 0
  }, 300)
  
  // 300毫秒后允许下次触发
  if (touchTimeout.value) {
    clearTimeout(touchTimeout.value)
  }
  touchTimeout.value = setTimeout(() => {
    isHandlingTouch.value = false
    currentTouchDimension.value = null
  }, 300)
}

// 触摸结束
const onTouchEnd = () => {
  // 只清除当前操作维度的悬停状态，避免影响其他维度
  if (currentTouchDimension.value) {
    hoverStars[currentTouchDimension.value] = 0
  }
}

// 鼠标点击处理（桌面端）
const handleClick = (dimension, score, event) => {
  // 如果正在处理触摸事件，忽略点击事件
  if (isHandlingTouch.value) {
    event.preventDefault()
    return
  }
  
  setRating(dimension, score)
}

// 设置评分
const setRating = (dimension, score) => {
  if (!canRate()) return
  
  const currentScore = scores[dimension] || 0
  console.log(`📊 设置评分开始: ${dimension} = ${score}, 当前值: ${currentScore}`)
  
  // 简化的星级评分逻辑：点击第N颗星就设置为N分
  // 点击已选中的星级时取消评分（双击取消功能）
  if (currentScore === score) {
    // 点击已选中的星级，取消评分
    scores[dimension] = 0
    console.log(`❌ 取消评分: ${dimension} = 0, 当前所有评分:`, JSON.stringify(scores))
  } else {
    // 点击其他星级，设置新评分
    scores[dimension] = score
    console.log(`✅ 确认评分: ${dimension} = ${score}, 当前所有评分:`, JSON.stringify(scores))
  }
  
  // 清除该维度的悬停状态（只清除当前维度）
  hoverStars[dimension] = 0
  
  // 验证所有维度的评分状态
  console.log(`🔍 所有维度评分状态:`, {
    stagePresence: scores.stagePresence,
    performance: scores.performance,
    popularity: scores.popularity,
    teamwork: scores.teamwork,
    creativity: scores.creativity
  })
  
  // 触觉反馈
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
  
  // 播放音频反馈（如果需要）
  playClickSound()
  
  // 强制触发UI更新（确保所有星星显示正确）
  forceUpdateStars()
}

// 强制更新星星显示状态
const forceUpdateStars = () => {
  // 通过触发响应式更新确保UI正确显示
  setTimeout(() => {
    dimensions.forEach(dim => {
      const currentScore = scores[dim.key]
      if (currentScore > 0) {
        console.log(`🌟 维度 ${dim.key} 应该显示 ${currentScore} 颗亮星`)
      }
    })
  }, 50)
}

// 播放点击音效
const playClickSound = () => {
  // 创建简单的音效
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    // 忽略音频错误
  }
}

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 处理时间结束
const handleTimeEnd = () => {
  // 仅刷新状态，由服务端返回的 status 决定是否还能投票
  showToast('投票时间可能已结束，正在刷新...')
  loadProgramData()
}

// 返回
const goBack = () => {
  router.back()
}

// 提交投票
const submitVote = async () => {
  if (!isFormValid()) {
    const missing = dimensions
      .filter(d => (scores[d.key] || 0) === 0)
      .map(d => d.name)
    showToast(`还有未评分的维度：${missing.join('、')}，请先评分再提交`)
    return
  }
  
  // 如果没有确认弹窗需求，直接提交（移动端更顺畅）
  // showConfirmDialog.value = true
  await confirmSubmit()
}

// 确认提交
const confirmSubmit = async () => {
  try {
    submitting.value = true
    showConfirmDialog.value = false
    
    const voteData = {
      programId: props.programId,
      scores: {
        stagePresence: scores.stagePresence,
        performance: scores.performance,
        popularity: scores.popularity,
        teamwork: scores.teamwork,
        creativity: scores.creativity
      }
    }
    
    console.log('提交投票数据:', voteData)
    
    // 提交前刷新一次节目状态，避免前后端不一致导致误判
    try {
      const pr = await programApi.getProgram(props.programId)
      if (pr.code === 200 && pr.data?.program) {
        program.value = pr.data.program
        console.log('刷新节目状态:', program.value)
      }
    } catch (refreshError) {
      console.warn('刷新节目状态失败:', refreshError)
    }
    
    // 使用与其他地方一致的状态检查逻辑
    let canSubmit = false
    if (program.value?.status === 1) {
      // 优先使用后端的 isVotingActive 字段
      canSubmit = program.value.hasOwnProperty('isVotingActive') 
        ? program.value.isVotingActive 
        : true
    }
    
    if (!canSubmit) {
      const statusText = program.value?.status === 0 ? '未开始' : 
                        program.value?.status === 2 ? '已结束' : 
                        program.value?.status === 1 ? '已结束' : '未知状态'
      showToast({ 
        type: 'fail', 
        message: `当前节目投票${statusText}，无法提交评分`,
        duration: 3000
      })
      return
    }

    const response = await voteApi.submitVote(voteData)
    
    if (response.code === 200) {
      showSuccessToast({
        message: '🎉 投票提交成功！',
        duration: 2000
      })
      
      // 更新状态
      hasVoted.value = true
      myVote.value = {
        ...scores,
        submittedAt: new Date().toISOString()
      }
      
      // 重新拉取状态
      await loadProgramData()
      // 如果后端仍返回可投，提示已记录；否则显示结束面板（我的评分+统计）
      if (program.value?.status === 1) {
        showSuccessToast({ message: '✅ 已记录本次评分', duration: 1200 })
      }
    } else {
      showToast({
        type: 'fail',
        message: response.message || '投票提交失败，请重试',
        duration: 4000
      })
    }
  } catch (error) {
    console.error('Submit vote error:', error)
    
    // 详细的错误信息解析
    let errorMessage = '投票提交失败，请重试'
    const responseData = error?.response?.data || error?.data || {}
    const statusCode = error?.response?.status || error?.status
    const originalMessage = responseData.message || error?.message || ''
    
    console.log('错误详情:', { statusCode, responseData, originalMessage })
    
    if (statusCode === 400) {
      if (/window is not active|投票窗口|not active|voting window|时间已结束/i.test(originalMessage)) {
        // 检查是否是缓冲期内的时间问题
        const debugInfo = responseData?.data?.debugInfo;
        if (debugInfo?.timeDiffSeconds > 0 && debugInfo?.timeDiffSeconds <= 60) {
          errorMessage = `⏰ 投票窗口刚刚关闭\n超时 ${debugInfo.timeDiffSeconds} 秒（在${debugInfo.bufferTimeUsed}秒缓冲期内）\n正在自动刷新页面...`
          // 缓冲期内的时间问题，3秒后自动刷新
          setTimeout(async () => {
            await loadProgramData()
            showToast('页面已刷新，请查看最新状态')
          }, 3000)
        } else {
          errorMessage = `⏰ 投票窗口已关闭\n当前节目：${program.value?.title || '未知'}\n状态：${getStatusText()}\n请等待下一个节目开始投票`
        }
      } else if (/already voted|已投票|duplicate/i.test(originalMessage)) {
        errorMessage = '🚫 您已为此节目投过票了'
        hasVoted.value = true
      } else if (/program not found|节目不存在/i.test(originalMessage)) {
        errorMessage = '❌ 节目不存在或已被删除'
      } else {
        errorMessage = `❌ ${originalMessage}` || '投票数据无效，请检查评分是否完整'
      }
    } else if (statusCode === 404) {
      errorMessage = '❌ 节目不存在，可能已被删除'
    } else if (statusCode >= 500) {
      errorMessage = '🔧 服务器内部错误，请稍后重试'
    } else if (statusCode === 0 || error.name === 'NetworkError') {
      errorMessage = '🌐 网络连接失败，请检查网络后重试'
    } else {
      errorMessage = originalMessage || '未知错误，请重试'
    }
    
    showToast({ 
      type: 'fail', 
      message: errorMessage,
      duration: 5000
    })
  } finally {
    submitting.value = false
  }
}

// 加载节目数据
const loadProgramData = async () => {
  try {
    loading.value = true
    
    const [programRes, myVotesRes] = await Promise.allSettled([
      programApi.getProgram(props.programId),
      voteApi.getMyVotes()
    ])
    
    if (programRes.status === 'fulfilled' && programRes.value.code === 200) {
      program.value = programRes.value.data.program
    } else {
      showToast({
        type: 'fail',
        message: '节目信息加载失败',
        duration: 2000
      })
      return
    }
    
    if (myVotesRes.status === 'fulfilled' && myVotesRes.value.code === 200) {
      const myVoteData = myVotesRes.value.data.votes.find(vote => vote.program_id === props.programId)
      if (myVoteData) {
        myVote.value = {
          stagePresence: myVoteData.stage_presence,
          performance: myVoteData.performance,
          popularity: myVoteData.popularity,
          teamwork: myVoteData.teamwork,
          creativity: myVoteData.creativity,
          submittedAt: myVoteData.submitted_at
        }
      }
    }

    // 如果不是实际投票中，加载全体统计
    const isActuallyVoting = program.value?.status === 1 && 
      (program.value.hasOwnProperty('isVotingActive') ? program.value.isVotingActive : true)
      
    if (!isActuallyVoting) {
      try {
        const statsRes = await voteApi.getProgramVotes(props.programId)
        if (statsRes.code === 200) {
          programStats.value = normalizeStats(statsRes.data)
        }
      } catch (e) {
        console.error('Load program stats error:', e)
      }
    }
  } catch (error) {
    console.error('Load program data error:', error)
    showToast({
      type: 'fail',
      message: '数据加载失败',
      duration: 2000
    })
  } finally {
    loading.value = false
  }
}

// 设置自动刷新
const setupAutoRefresh = () => {
  // 每10秒检查一次投票状态（只有在实际投票窗口开启时才倒计时）
  refreshTimer.value = setInterval(() => {
    if (!program.value) return
    
    // 优先使用后端的 isVotingActive 字段进行状态判断
    const isActive = program.value.hasOwnProperty('isVotingActive') 
      ? program.value.isVotingActive 
      : program.value.status === 1
      
    if (isActive && program.value.remainingTime > 0) {
      program.value.remainingTime = Math.max(0, program.value.remainingTime - 10)
      
      if (program.value.remainingTime <= 0) {
        handleTimeEnd()
      }
    }
    
    // 每30秒刷新一次数据，确保状态同步
    if (Date.now() % 30000 < 10000) {
      loadProgramData()
    }
  }, 10000)
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
  await loadProgramData()
  setupAutoRefresh()
})

// 组件卸载
onUnmounted(() => {
  clearAutoRefresh()
  
  // 清理触摸相关的定时器和状态
  if (touchTimer.value) {
    clearTimeout(touchTimer.value)
    touchTimer.value = null
  }
  if (touchTimeout.value) {
    clearTimeout(touchTimeout.value)
    touchTimeout.value = null
  }
  
  // 重置触摸状态
  isHandlingTouch.value = false
  currentTouchDimension.value = null
})
</script>

<style scoped>
.vote-page {
  min-height: 100vh;
  background-color: #f7f9fc;
}

/* 弱化背景/装饰，强调评分组件 */
@media screen and (max-height: 640px), screen and (max-width: 360px) {
  .score-summary { padding: 10px; }
  .star-rating { gap: 3px; }
  .submit-btn { height: 42px; }
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

.countdown {
  color: white;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: var(--fs-sm);
}

.page-content {
  padding: 12px;
  padding-bottom: 72px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.program-info {
  margin-bottom: 16px;
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.program-number {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: var(--fs-sm);
  font-weight: 600;
}

.program-title {
  font-size: var(--fs-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.program-performer {
  font-size: var(--fs-base);
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.program-description {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.vote-hint {
  margin-top: 16px;
}

.vote-form {
  margin-bottom: 16px;
}

.form-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
}

.progress-pill {
  display: inline-block;
  margin: 6px 0 6px 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff7f7;
  color: #d32f2f;
  font-weight: 700;
  font-size: var(--fs-sm);
  border: 1px solid rgba(211,47,47,0.2);
}

.form-header h3 {
  margin: 0 0 8px 0;
  font-size: var(--fs-lg);
  color: var(--text-primary);
}

.form-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
}

.rating-sections {
  padding: 12px 16px;
}

.rating-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.rating-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.dimension-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.dimension-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dimension-icon {
  font-size: 18px;
  color: white;
}

.dimension-text {
  flex: 1;
}

.dimension-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.dimension-weight {
  font-size: var(--fs-xs);
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 8px;
}

.dimension-info h4 {
  margin: 0 0 4px 0;
  font-size: var(--fs-lg);
  color: var(--text-primary);
}

.dimension-info p {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.current-rating {
  text-align: right;
  min-width: 70px;
}

.count-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid;
  font-size: var(--fs-xs);
  font-weight: 700;
}

.rating-display {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 2px;
  margin-bottom: 2px;
}

.rating-score {
  font-size: var(--fs-2xl);
  font-weight: 700;
  line-height: 1;
}

.rating-label {
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  font-weight: 400;
}

.rating-text {
  display: block;
  font-size: var(--fs-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.star-rating-container {
  padding: 12px 0;
}

.star-rating {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 6px;
}

.star-item {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
}

.star-inner {
  font-size: 22px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  color: #cbd5e1; /* 默认灰色 */
}

.star-item.active .star-inner {
  transform: scale(1.05);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.star-item.hover .star-inner {
  transform: scale(1.05);
}

.star-item:active {
  transform: scale(0.95);
}

.ripple-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.3) 0%, transparent 70%);
  animation: ripple 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 12px;
}

.rating-label-item {
  font-size: var(--fs-xs);
  color: #9ca3af;
  text-align: center;
}

/* 闪烁效果：点亮的星星轻微呼吸闪烁 */
@keyframes twinkle {
  0%, 100% { filter: drop-shadow(0 2px 4px rgba(255, 193, 7, 0.35)); transform: scale(1.05); }
  50% { filter: drop-shadow(0 4px 8px rgba(255, 193, 7, 0.6)); transform: scale(1.1); }
}
.star-item.active .star-inner { animation: twinkle 1.2s ease-in-out infinite; }

.submit-section {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.score-summary {
  background: linear-gradient(135deg, #f8f9fa, #fff);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
}

.score-summary p {
  margin: 6px 0;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
}

.total-score {
  font-size: clamp(20px, 5vw, 24px);
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-text {
  margin-top: 8px;
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  border: none;
  font-size: var(--fs-lg);
  font-weight: 600;
}

/* 强化版提交按钮 */
.submit-btn-strong {
  width: 100%;
  height: 48px;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 18px rgba(211, 47, 47, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.submit-btn-strong:disabled {
  opacity: 0.5;
  box-shadow: none;
}
.submit-btn-strong:not(:disabled):active { transform: scale(0.98); }

.voted-status,
.unavailable-status,
.not-found {
  padding: 40px 20px;
}

.result-panel { padding: 12px; }
.panel-title { margin: 0 0 6px 0; font-size: var(--fs-lg); font-weight: 800; }
.panel-sub { margin: 0 0 12px 0; font-size: var(--fs-sm); color: var(--text-secondary); }
.my-vote-block h5 { margin: 0 0 8px 0; font-size: var(--fs-base); }
.my-dimensions { display: grid; grid-template-columns: 1fr; gap: 8px; }
.dim { display: grid; grid-template-columns: 70px 1fr 24px; align-items: center; gap: 8px; }
.dim-name { font-weight: 600; color: var(--text-secondary); }
.dim-stars .star { font-size: 16px; opacity: 0.25; }
.dim-stars .star.active { opacity: 1; }
.dim-score { text-align: right; font-weight: 700; color: var(--primary-color); }
.back-btn { margin-top: 12px; }

.stats-block { margin-top: 14px; }
.stats-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
.stat-row { display: grid; grid-template-columns: 70px 1fr 1fr 1fr; gap: 8px; align-items: center; }
.stat-name { font-weight: 600; color: var(--text-secondary); }
.stat-avg, .stat-total, .stat-five { font-size: var(--fs-sm); color: var(--text-secondary); }

.voted-info {
  margin-top: 20px;
}

.voted-info h4 {
  text-align: center;
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.voted-scores {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.voted-score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.voted-score-item:last-child {
  margin-bottom: 0;
}

.dimension-name {
  font-size: 14px;
  color: var(--text-secondary);
}

.score-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-stars {
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

.score-number {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 20px;
}

.voted-time {
  text-align: center;
  font-size: 12px;
  color: var(--text-light);
  margin: 0;
}

.confirm-content {
  padding: 16px;
}

.confirm-scores {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
}

.confirm-score-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.confirm-score-item:last-child {
  margin-bottom: 0;
}

.confirm-warning {
  text-align: center;
  color: var(--warning-color);
  font-size: 14px;
  margin: 12px 0 0 0;
}

/* 动画 */
.slide-up {
  animation: slideUp 0.4s ease;
}

.bounce-in {
  animation: bounceIn 0.6s ease;
}

/* 响应式 */
@media (max-width: 375px) {
  .page-content {
    padding: 10px;
  }
  
  .rating-sections {
    padding: 12px;
  }
  
  .submit-section {
    padding: 12px;
  }
}

/* 横屏/矮屏进一步紧凑 */
@media screen and (max-height: 640px), screen and (orientation: landscape) {
  .star-item { width: 36px; height: 36px; }
  .star-inner { font-size: 22px; }
  .program-title { margin-bottom: 4px; }
  .program-description { margin-bottom: 10px; }
}
</style>