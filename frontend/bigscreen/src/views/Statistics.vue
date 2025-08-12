<template>
  <div class="statistics">
    <div class="stats-header">
      <h1>📊 数据统计分析</h1>
    </div>

    <div class="stats-content">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <div class="stat-card" v-for="(card, index) in overviewCards" :key="index">
          <div class="card-icon">{{ card.icon }}</div>
          <div class="card-content">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
          </div>
          <div class="card-trend" :class="card.trendClass">
            {{ card.trend }}
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <!-- 投票分布饼图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>🍰 投票分布统计</h3>
          </div>
          <v-chart class="chart" :option="pieChartOption" :autoresize="true" />
        </div>

        <!-- 时间分布柱状图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>⏰ 投票时间分布</h3>
          </div>
          <v-chart class="chart" :option="timeDistributionOption" :autoresize="true" />
        </div>

        <!-- 参与度分析 -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>📈 部门参与度对比</h3>
          </div>
          <v-chart class="chart" :option="departmentOption" :autoresize="true" />
        </div>

        <!-- 评分热力图 -->
        <div class="chart-container full-width">
          <div class="chart-header">
            <h3>🌡️ 五维度评分热力图</h3>
          </div>
          <v-chart class="chart" :option="heatmapOption" :autoresize="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'

export default {
  name: 'Statistics',
  setup() {
    const overviewCards = ref([
      { icon: '🗳️', value: '0', label: '总投票数', trend: '+0%', trendClass: 'trend-up' },
      { icon: '👥', value: '0', label: '参与人数', trend: '+0%', trendClass: 'trend-up' },
      { icon: '⭐', value: '0', label: '平均评分', trend: '+0%', trendClass: 'trend-stable' },
      { icon: '🏆', value: '0', label: '最高得分', trend: '+0%', trendClass: 'trend-up' }
    ])

    // 饼图配置
    const pieChartOption = ref({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%'
        }
      }]
    })

    // 时间分布柱状图配置
    const timeDistributionOption = ref({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: []
      },
      yAxis: {
        type: 'value',
        name: '投票数量'
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
        barWidth: '60%'
      }]
    })

    // 部门参与度配置
    const departmentOption = ref({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: { rotate: 45 }
      },
      yAxis: [
        {
          type: 'value',
          name: '参与人数',
          position: 'left'
        },
        {
          type: 'value',
          name: '参与率(%)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '参与人数',
          type: 'bar',
          data: [],
          itemStyle: { color: '#4CAF50' }
        },
        {
          name: '参与率',
          type: 'line',
          yAxisIndex: 1,
          data: [],
          itemStyle: { color: '#FF9800' },
          lineStyle: { width: 3 }
        }
      ]
    })

    // 热力图配置
    const heatmapOption = ref({
      tooltip: {
        position: 'top',
        formatter: function (params) {
          return `${params.data[1]}<br/>${params.data[0]}: ${params.data[2]}分`
        }
      },
      grid: {
        height: '50%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: ['台风表现', '表演水平', '人气指数', '团队默契', '创意创新'],
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: [],
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: 5,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: ['#e0f3ff', '#1890ff', '#003a8c']
        }
      },
      series: [{
        type: 'heatmap',
        data: [],
        label: {
          show: true,
          formatter: function (params) {
            return params.data[2].toFixed(1)
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })

    // 加载统计数据
    const loadStatistics = async () => {
      try {
        // 获取概览数据
        const overviewData = await api.getOverviewStatistics()
        if (overviewData) {
          overviewCards.value[0].value = overviewData.totalVotes || '0'
          overviewCards.value[1].value = overviewData.participantCount || '0'
          overviewCards.value[2].value = (overviewData.averageScore || 0).toFixed(1)
          overviewCards.value[3].value = (overviewData.maxScore || 0).toFixed(1)
        }

        // 获取投票分布数据
        const distributionData = await api.getVoteDistribution()
        if (distributionData && distributionData.length > 0) {
          pieChartOption.value.series[0].data = distributionData.map(item => ({
            name: item.name,
            value: item.votes,
            itemStyle: { color: item.color }
          }))
        }

        // 获取时间分布数据
        const timeData = await api.getTimeDistribution()
        if (timeData) {
          timeDistributionOption.value.xAxis.data = timeData.hours || []
          timeDistributionOption.value.series[0].data = timeData.votes || []
        }

        // 获取部门参与度数据
        const deptData = await api.getDepartmentParticipation()
        if (deptData) {
          departmentOption.value.xAxis.data = deptData.departments || []
          departmentOption.value.series[0].data = deptData.participantCounts || []
          departmentOption.value.series[1].data = deptData.participationRates || []
        }

        // 获取热力图数据
        const heatmapData = await api.getScoreHeatmap()
        if (heatmapData) {
          heatmapOption.value.yAxis.data = heatmapData.programs || []
          heatmapOption.value.series[0].data = heatmapData.scores || []
        }

      } catch (error) {
        console.error('Failed to load statistics:', error)
        // 使用默认数据
        loadDefaultData()
      }
    }

    // 加载默认数据
    const loadDefaultData = () => {
      // 默认饼图数据
      pieChartOption.value.series[0].data = [
        { name: '精彩舞蹈', value: 120 },
        { name: '动听歌曲', value: 98 },
        { name: '创意小品', value: 85 },
        { name: '互动游戏', value: 67 },
        { name: '其他表演', value: 45 }
      ]

      // 默认时间分布数据
      const hours = []
      const votes = []
      for (let i = 9; i <= 18; i++) {
        hours.push(`${i}:00`)
        votes.push(Math.floor(Math.random() * 50 + 10))
      }
      timeDistributionOption.value.xAxis.data = hours
      timeDistributionOption.value.series[0].data = votes

      // 默认部门数据
      const departments = ['技术部', '市场部', '人事部', '财务部', '运营部']
      departmentOption.value.xAxis.data = departments
      departmentOption.value.series[0].data = [25, 18, 22, 15, 20]
      departmentOption.value.series[1].data = [85, 72, 88, 75, 80]

      // 默认热力图数据
      const programs = ['精彩舞蹈', '动听歌曲', '创意小品', '互动游戏', '其他表演']
      const dimensions = ['台风表现', '表演水平', '人气指数', '团队默契', '创意创新']
      const heatData = []
      
      programs.forEach((program, i) => {
        dimensions.forEach((dimension, j) => {
          heatData.push([j, program, (Math.random() * 2 + 3).toFixed(1)])
        })
      })
      
      heatmapOption.value.yAxis.data = programs
      heatmapOption.value.series[0].data = heatData
    }

    onMounted(() => {
      loadStatistics()
    })

    return {
      overviewCards,
      pieChartOption,
      timeDistributionOption,
      departmentOption,
      heatmapOption
    }
  }
}
</script>

<style scoped>
.statistics {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
}

.stats-header {
  text-align: center;
  margin-bottom: 30px;
}

.stats-header h1 {
  color: #333;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.card-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.card-label {
  color: #666;
  font-size: 1rem;
}

.card-trend {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 20px;
  color: white;
}

.trend-up {
  background: #4CAF50;
}

.trend-down {
  background: #F44336;
}

.trend-stable {
  background: #FF9800;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.chart-container.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.chart-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.chart {
  height: 350px;
  width: 100%;
}

.chart-container.full-width .chart {
  height: 450px;
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-header h1 {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .statistics {
    padding: 10px;
  }
  
  .chart {
    height: 250px;
  }
  
  .card-icon {
    font-size: 2rem;
    width: 60px;
    height: 60px;
  }
  
  .card-value {
    font-size: 1.8rem;
  }
}
</style>