<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1 class="title animate__animated animate__fadeInDown">
        🎉 {{ eventInfo.name }} 投票大屏
      </h1>
      <div class="time-info animate__animated animate__fadeInDown">
        <div class="current-time">{{ currentTime }}</div>
        <div class="event-status" :class="eventStatusClass">
          {{ eventStatusText }}
        </div>
      </div>
    </header>

    <div class="dashboard-content">
      <!-- 实时统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card animate__animated animate__fadeInUp" 
             v-for="(stat, index) in stats" 
             :key="index"
             :style="{ animationDelay: index * 0.1 + 's' }">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- 图表展示区域 -->
      <div class="charts-grid">
        <!-- 投票进度图表 -->
        <div class="chart-card animate__animated animate__fadeInLeft">
          <div class="chart-header">
            <h3>节目投票排行</h3>
            <div class="refresh-indicator" :class="{ active: isRefreshing }">
              🔄 实时更新
            </div>
          </div>
          <v-chart 
            class="chart" 
            :option="voteRankingOption" 
            :autoresize="true"
          />
        </div>

        <!-- 维度分析图表 -->
        <div class="chart-card animate__animated animate__fadeInRight">
          <div class="chart-header">
            <h3>五维度评分雷达图</h3>
          </div>
          <v-chart 
            class="chart" 
            :option="radarOption" 
            :autoresize="true"
          />
        </div>
      </div>

      <!-- 参与度统计 -->
      <div class="participation-section animate__animated animate__fadeInUp">
        <div class="section-header">
          <h3>📊 实时参与情况</h3>
        </div>
        <div class="participation-stats">
          <div class="participation-item">
            <div class="participation-bar">
              <div class="participation-fill" :style="{ width: participationRate + '%' }"></div>
            </div>
            <div class="participation-text">
              参与率: {{ participationRate }}% ({{ votedCount }}/{{ totalEmployees }})
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code 扫码区域 -->
    <div class="qr-section animate__animated animate__fadeIn">
      <div class="qr-container">
        <div class="qr-code">
          <img :src="qrCodeUrl" alt="扫码投票" />
        </div>
        <div class="qr-text">
          <div class="qr-title">📱 扫码参与投票</div>
          <div class="qr-subtitle">{{ voteUrl }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useWebSocket } from '../utils/websocket.js'
import api from '../api/index.js'

export default {
  name: 'Dashboard',
  setup() {
    // 响应式数据
    const currentTime = ref('')
    const isRefreshing = ref(false)
    const eventInfo = reactive({
      name: '2025年度周年庆典',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2小时后
    })

    const stats = ref([
      { icon: '🗳️', value: 0, label: '总投票数' },
      { icon: '👥', value: 0, label: '参与人数' },
      { icon: '🎭', value: 0, label: '参赛节目' },
      { icon: '⚡', value: '0%', label: '参与率' }
    ])

    const votedCount = ref(0)
    const totalEmployees = ref(100)
    const voteUrl = 'http://localhost:8080'
    const qrCodeUrl = ref('')

    // 计算属性
    const participationRate = computed(() => {
      return totalEmployees.value > 0 ? 
        Math.round((votedCount.value / totalEmployees.value) * 100) : 0
    })

    const eventStatusClass = computed(() => {
      const now = new Date()
      if (now < eventInfo.startTime) return 'status-waiting'
      if (now > eventInfo.endTime) return 'status-ended'
      return 'status-active'
    })

    const eventStatusText = computed(() => {
      const now = new Date()
      if (now < eventInfo.startTime) return '投票未开始'
      if (now > eventInfo.endTime) return '投票已结束'
      return '投票进行中'
    })

    // 图表配置
    const voteRankingOption = ref({
      title: {
        text: '节目投票排行榜',
        textStyle: { color: '#fff', fontSize: 18 }
      },
      grid: { top: 60, right: 30, bottom: 60, left: 100 },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#fff' },
        axisLine: { lineStyle: { color: '#fff' } }
      },
      yAxis: {
        type: 'category',
        data: [],
        axisLabel: { color: '#fff' },
        axisLine: { lineStyle: { color: '#fff' } }
      },
      series: [{
        type: 'bar',
        data: [],
        itemStyle: {
          color: (params) => {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']
            return colors[params.dataIndex % colors.length]
          }
        },
        label: {
          show: true,
          position: 'right',
          color: '#fff'
        },
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }]
    })

    const radarOption = ref({
      title: {
        text: '五维度评分雷达图',
        textStyle: { color: '#fff', fontSize: 18 }
      },
      radar: {
        indicator: [
          { name: '台风表现', max: 5 },
          { name: '表演水平', max: 5 },
          { name: '人气指数', max: 5 },
          { name: '团队默契', max: 5 },
          { name: '创意创新', max: 5 }
        ],
        axisLabel: { color: '#fff' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
        splitArea: { 
          areaStyle: { 
            color: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'] 
          } 
        }
      },
      series: [{
        type: 'radar',
        data: []
      }]
    })

    // 定时器
    let timeInterval = null
    let dataInterval = null

    // WebSocket 连接
    const { connect, disconnect } = useWebSocket()

    // 方法
    const updateTime = () => {
      currentTime.value = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const loadDashboardData = async () => {
      try {
        isRefreshing.value = true
        
        // 获取统计数据
        const statsData = await api.getVoteStatistics()
        
        // 更新统计卡片
        stats.value[0].value = statsData.totalVotes || 0
        stats.value[1].value = statsData.participantCount || 0
        stats.value[2].value = statsData.programCount || 0
        stats.value[3].value = participationRate.value + '%'
        
        votedCount.value = statsData.participantCount || 0
        totalEmployees.value = statsData.totalEmployees || 100

        // 获取节目排行数据
        const rankingData = await api.getProgramRanking()
        if (rankingData && rankingData.length > 0) {
          voteRankingOption.value.yAxis.data = rankingData.map(item => item.name)
          voteRankingOption.value.series[0].data = rankingData.map(item => item.totalScore)
        }

        // 获取五维度数据
        const dimensionData = await api.getDimensionAnalysis()
        if (dimensionData && dimensionData.length > 0) {
          radarOption.value.series[0].data = dimensionData.map(item => ({
            value: [
              item.style_score || 0,
              item.performance_score || 0,
              item.popularity_score || 0,
              item.teamwork_score || 0,
              item.creativity_score || 0
            ],
            name: item.name
          }))
        }

      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        isRefreshing.value = false
      }
    }

    const generateQRCode = async () => {
      try {
        const response = await api.generateQRCode(voteUrl)
        qrCodeUrl.value = response.qrCode || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPg=='
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }

    // 生命周期
    onMounted(() => {
      updateTime()
      timeInterval = setInterval(updateTime, 1000)
      
      loadDashboardData()
      dataInterval = setInterval(loadDashboardData, 5000) // 每5秒更新一次数据
      
      generateQRCode()
      
      // 连接 WebSocket
      connect((data) => {
        if (data.type === 'vote_update') {
          loadDashboardData()
        }
      })
    })

    onUnmounted(() => {
      if (timeInterval) clearInterval(timeInterval)
      if (dataInterval) clearInterval(dataInterval)
      disconnect()
    })

    return {
      currentTime,
      isRefreshing,
      eventInfo,
      stats,
      votedCount,
      totalEmployees,
      voteUrl,
      qrCodeUrl,
      participationRate,
      eventStatusClass,
      eventStatusText,
      voteRankingOption,
      radarOption
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  overflow-x: hidden;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.time-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 1.1rem;
}

.current-time {
  background: rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.event-status {
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.status-waiting { background: rgba(255,193,7,0.8); }
.status-active { background: rgba(40,167,69,0.8); }
.status-ended { background: rgba(220,53,69,0.8); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255,255,255,0.15);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: rgba(255,255,255,0.15);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  height: 400px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.refresh-indicator {
  font-size: 0.8rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.refresh-indicator.active {
  opacity: 1;
  animation: pulse 1s infinite;
}

.chart {
  height: 320px;
  width: 100%;
}

.participation-section {
  background: rgba(255,255,255,0.15);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  margin-bottom: 30px;
}

.section-header h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
}

.participation-bar {
  background: rgba(255,255,255,0.3);
  height: 30px;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 10px;
  position: relative;
}

.participation-fill {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  height: 100%;
  border-radius: 15px;
  transition: width 0.8s ease;
  position: relative;
}

.participation-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

.participation-text {
  text-align: center;
  font-weight: bold;
}

.qr-section {
  background: rgba(255,255,255,0.15);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.qr-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.qr-code {
  background: white;
  padding: 15px;
  border-radius: 10px;
}

.qr-code img {
  width: 120px;
  height: 120px;
}

.qr-text {
  text-align: center;
}

.qr-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.qr-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  font-family: monospace;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .qr-container {
    flex-direction: column;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .time-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>