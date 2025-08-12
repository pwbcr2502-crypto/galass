<template>
  <div class="results">
    <header class="results-header">
      <h1>🏆 实时投票结果</h1>
      <div class="header-actions">
        <button @click="refreshData" class="refresh-btn" :disabled="isLoading">
          <span class="refresh-icon" :class="{ spinning: isLoading }">🔄</span>
          刷新数据
        </button>
        <button @click="exportResults" class="export-btn">
          📊 导出结果
        </button>
      </div>
    </header>

    <div class="results-content">
      <!-- 排行榜 -->
      <div class="ranking-section">
        <div class="section-title">🥇 节目排行榜</div>
        <div class="ranking-list">
          <div 
            v-for="(program, index) in programs" 
            :key="program.id"
            class="ranking-item animate__animated animate__fadeInLeft"
            :style="{ animationDelay: index * 0.1 + 's' }"
          >
            <div class="rank-number" :class="getRankClass(index)">
              {{ index + 1 }}
            </div>
            <div class="program-info">
              <div class="program-name">{{ program.name }}</div>
              <div class="program-details">
                表演者: {{ program.performers }} | 
                总票数: {{ program.totalVotes }} | 
                平均分: {{ program.averageScore.toFixed(2) }}
              </div>
            </div>
            <div class="score-chart">
              <v-chart 
                class="mini-chart" 
                :option="getMiniChartOption(program)"
                :autoresize="true"
              />
            </div>
            <div class="total-score">{{ program.totalScore.toFixed(1) }}</div>
          </div>
        </div>
      </div>

      <!-- 维度分析 -->
      <div class="dimension-section">
        <div class="section-title">📊 五维度详细分析</div>
        <div class="dimension-charts">
          <v-chart 
            class="dimension-chart" 
            :option="dimensionComparisonOption"
            :autoresize="true"
          />
        </div>
      </div>

      <!-- 投票趋势 -->
      <div class="trend-section">
        <div class="section-title">📈 投票趋势分析</div>
        <v-chart 
          class="trend-chart" 
          :option="trendOption"
          :autoresize="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import api from '../api/index.js'
import { useWebSocket } from '../utils/websocket.js'

export default {
  name: 'Results',
  setup() {
    const isLoading = ref(false)
    const programs = ref([])
    
    // WebSocket 连接
    const { connect, disconnect } = useWebSocket()

    // 图表配置
    const dimensionComparisonOption = ref({
      title: {
        text: '各节目五维度对比',
        textStyle: { color: '#333', fontSize: 18 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['台风表现', '表演水平', '人气指数', '团队默契', '创意创新'],
        top: 30
      },
      grid: { top: 80, right: 30, bottom: 60, left: 60 },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        max: 5,
        axisLabel: { formatter: '{value}分' }
      },
      series: [
        { name: '台风表现', type: 'bar', data: [], stack: 'total' },
        { name: '表演水平', type: 'bar', data: [], stack: 'total' },
        { name: '人气指数', type: 'bar', data: [], stack: 'total' },
        { name: '团队默契', type: 'bar', data: [], stack: 'total' },
        { name: '创意创新', type: 'bar', data: [], stack: 'total' }
      ]
    })

    const trendOption = ref({
      title: {
        text: '投票时间趋势',
        textStyle: { color: '#333', fontSize: 18 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let result = params[0].axisValue + '<br/>'
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value} 票<br/>`
          })
          return result
        }
      },
      legend: { top: 30 },
      grid: { top: 80, right: 30, bottom: 60, left: 60 },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: { formatter: value => value.split(' ')[1] }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value} 票' }
      },
      series: []
    })

    // 方法
    const getRankClass = (index) => {
      if (index === 0) return 'rank-gold'
      if (index === 1) return 'rank-silver'  
      if (index === 2) return 'rank-bronze'
      return 'rank-normal'
    }

    const getMiniChartOption = (program) => ({
      radar: {
        indicator: [
          { name: '台风', max: 5 },
          { name: '表演', max: 5 },
          { name: '人气', max: 5 },
          { name: '默契', max: 5 },
          { name: '创意', max: 5 }
        ],
        radius: 30,
        axisLabel: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.1)' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: [
            program.styleScore || 0,
            program.performanceScore || 0,
            program.popularityScore || 0,
            program.teamworkScore || 0,
            program.creativityScore || 0
          ],
          itemStyle: { color: getColorByRank(program.rank) },
          areaStyle: { opacity: 0.3 }
        }]
      }]
    })

    const getColorByRank = (rank) => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']
      return colors[(rank - 1) % colors.length]
    }

    const loadResults = async () => {
      try {
        isLoading.value = true

        // 获取节目排行数据
        const rankingData = await api.getProgramRanking()
        programs.value = rankingData.map((program, index) => ({
          ...program,
          rank: index + 1,
          totalScore: (program.totalScore || 0),
          averageScore: (program.averageScore || 0),
          totalVotes: (program.totalVotes || 0),
          styleScore: (program.styleScore || 0),
          performanceScore: (program.performanceScore || 0),
          popularityScore: (program.popularityScore || 0),
          teamworkScore: (program.teamworkScore || 0),
          creativityScore: (program.creativityScore || 0)
        }))

        // 更新维度对比图表
        if (programs.value.length > 0) {
          dimensionComparisonOption.value.xAxis.data = programs.value.map(p => p.name)
          dimensionComparisonOption.value.series[0].data = programs.value.map(p => p.styleScore)
          dimensionComparisonOption.value.series[1].data = programs.value.map(p => p.performanceScore)
          dimensionComparisonOption.value.series[2].data = programs.value.map(p => p.popularityScore)
          dimensionComparisonOption.value.series[3].data = programs.value.map(p => p.teamworkScore)
          dimensionComparisonOption.value.series[4].data = programs.value.map(p => p.creativityScore)
        }

        // 获取投票趋势数据
        const trendData = await api.getVoteTrend()
        if (trendData && trendData.timestamps && trendData.programs) {
          trendOption.value.xAxis.data = trendData.timestamps
          trendOption.value.series = trendData.programs.map(program => ({
            name: program.name,
            type: 'line',
            data: program.data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6
          }))
        }

      } catch (error) {
        console.error('Failed to load results:', error)
      } finally {
        isLoading.value = false
      }
    }

    const refreshData = () => {
      loadResults()
    }

    const exportResults = async () => {
      try {
        const response = await api.exportResults('excel')
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `投票结果_${new Date().toLocaleDateString()}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Export failed:', error)
        alert('导出失败，请稍后重试')
      }
    }

    // 生命周期
    onMounted(() => {
      loadResults()
      
      // 连接 WebSocket 监听实时更新
      connect((data) => {
        if (data.type === 'vote_update' || data.type === 'results_update') {
          loadResults()
        }
      })
    })

    onUnmounted(() => {
      disconnect()
    })

    return {
      isLoading,
      programs,
      dimensionComparisonOption,
      trendOption,
      getRankClass,
      getMiniChartOption,
      refreshData,
      exportResults
    }
  }
}
</script>

<style scoped>
.results {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.results-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.refresh-btn, .export-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.refresh-btn {
  background: #4CAF50;
  color: white;
}

.refresh-btn:hover {
  background: #45a049;
}

.refresh-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.export-btn {
  background: #2196F3;
  color: white;
}

.export-btn:hover {
  background: #1976D2;
}

.refresh-icon {
  display: inline-block;
  margin-right: 5px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.ranking-section {
  margin-bottom: 30px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ranking-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.ranking-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.rank-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  margin-right: 20px;
}

.rank-gold { background: linear-gradient(135deg, #FFD700, #FFA500); }
.rank-silver { background: linear-gradient(135deg, #C0C0C0, #808080); }
.rank-bronze { background: linear-gradient(135deg, #CD7F32, #A0522D); }
.rank-normal { background: linear-gradient(135deg, #6c757d, #495057); }

.program-info {
  flex: 1;
  margin-right: 20px;
}

.program-name {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.program-details {
  color: #666;
  font-size: 0.9rem;
}

.score-chart {
  width: 120px;
  height: 80px;
  margin-right: 20px;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

.total-score {
  font-size: 2rem;
  font-weight: bold;
  color: #ff6b6b;
  min-width: 80px;
  text-align: center;
}

.dimension-section, .trend-section {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.dimension-chart, .trend-chart {
  height: 400px;
  width: 100%;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .ranking-item {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .program-info {
    margin-right: 0;
  }

  .score-chart {
    margin-right: 0;
  }
}
</style>