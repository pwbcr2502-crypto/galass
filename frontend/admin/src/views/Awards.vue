<template>
  <div class="page-container">
    <h2 class="page-title">奖项管理</h2>
    
    <!-- Award Calculation Control -->
    <el-card class="card-container mb-24">
      <template #header>
        <span>奖项计算</span>
      </template>
      
      <div class="calculation-control">
        <el-form :model="calculationForm" inline>
          <el-form-item label="活动">
            <el-select v-model="calculationForm.eventId" placeholder="选择活动">
              <el-option label="公司一周年庆典晚会" value="1" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              :loading="calculating"
              @click="calculateAwards"
            >
              <el-icon><Trophy /></el-icon>
              计算奖项
            </el-button>
            
            <el-button
              :disabled="!hasAwards"
              @click="publishAwards"
            >
              <el-icon><Promotion /></el-icon>
              发布结果
            </el-button>
          </el-form-item>
        </el-form>
        
        <el-alert
          v-if="calculationStatus"
          :title="calculationStatus.message"
          :type="calculationStatus.type"
          :closable="false"
          show-icon
          class="mt-16"
        />
      </div>
    </el-card>

    <!-- Award Results -->
    <el-card v-if="awards.length > 0" class="card-container mb-24">
      <template #header>
        <div class="card-header">
          <span>获奖结果</span>
          <div class="header-actions">
            <el-button size="small" @click="exportAwards">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button size="small" @click="printAwards">
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="awards-grid">
        <div
          v-for="award in awards"
          :key="award.awardType"
          class="award-card"
        >
          <div class="award-header">
            <div class="award-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="award-title">
              {{ award.awardName }}
            </div>
          </div>
          
          <div class="award-content">
            <div class="winner-info">
              <div class="program-title">{{ award.program.title }}</div>
              <div class="program-performer">{{ award.program.performer }}</div>
              <div class="program-score">
                得分: <span class="score">{{ award.score }}</span>
              </div>
            </div>
            
            <div class="award-actions">
              <el-button size="small" @click="viewAwardDetails(award)">
                查看详情
              </el-button>
              <el-button size="small" type="primary" @click="generateCertificate(award)">
                生成证书
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Award Statistics -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="card-container">
          <template #header>
            <span>奖项统计</span>
          </template>
          
          <div class="statistics-content">
            <div class="stat-item">
              <div class="stat-label">总奖项数</div>
              <div class="stat-value">{{ awardStats.totalAwards }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">已发布奖项</div>
              <div class="stat-value">{{ awardStats.publishedAwards }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">获奖节目数</div>
              <div class="stat-value">{{ awardStats.winningPrograms }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最高得分</div>
              <div class="stat-value">{{ awardStats.highestScore }}</div>
            </div>
          </div>
          
          <el-divider />
          
          <div class="award-distribution">
            <h4>奖项分布</h4>
            <div class="distribution-chart">
              <!-- Simple bar chart representation -->
              <div v-for="item in awardDistribution" :key="item.name" class="chart-item">
                <div class="chart-label">{{ item.name }}</div>
                <div class="chart-bar">
                  <div 
                    class="chart-fill" 
                    :style="{ width: `${(item.value / Math.max(...awardDistribution.map(i => i.value))) * 100}%` }"
                  ></div>
                </div>
                <div class="chart-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card class="card-container">
          <template #header>
            <span>奖项规则</span>
          </template>
          
          <div class="award-rules">
            <el-timeline>
              <el-timeline-item
                v-for="rule in awardRules"
                :key="rule.type"
                :icon="rule.icon"
                :color="rule.color"
              >
                <div class="rule-content">
                  <h4>{{ rule.name }}</h4>
                  <p>{{ rule.description }}</p>
                  <div class="rule-criteria">
                    <el-tag size="small">{{ rule.criteria }}</el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Award Details Dialog -->
    <el-dialog
      v-model="detailsDialog.visible"
      title="奖项详情"
      width="600px"
    >
      <div v-if="detailsDialog.award">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="奖项名称">
            {{ detailsDialog.award.awardName }}
          </el-descriptions-item>
          <el-descriptions-item label="获奖节目">
            {{ detailsDialog.award.program.title }}
          </el-descriptions-item>
          <el-descriptions-item label="表演者">
            {{ detailsDialog.award.program.performer }}
          </el-descriptions-item>
          <el-descriptions-item label="节目序号">
            {{ detailsDialog.award.program.seqNo }}
          </el-descriptions-item>
          <el-descriptions-item label="核心维度得分">
            {{ detailsDialog.award.score }}
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">
            {{ detailsDialog.award.publishedAt ? formatTime(detailsDialog.award.publishedAt) : '未发布' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <div class="award-analysis">
          <h4>得分分析</h4>
          <div class="score-breakdown">
            <div class="dimension-score">
              <span class="dimension-name">台风表现:</span>
              <span class="dimension-value">{{ detailsDialog.dimensions?.stagePresence || 0 }}</span>
            </div>
            <div class="dimension-score">
              <span class="dimension-name">表演水平:</span>
              <span class="dimension-value">{{ detailsDialog.dimensions?.performance || 0 }}</span>
            </div>
            <div class="dimension-score">
              <span class="dimension-name">人气指数:</span>
              <span class="dimension-value">{{ detailsDialog.dimensions?.popularity || 0 }}</span>
            </div>
            <div class="dimension-score">
              <span class="dimension-name">团队默契:</span>
              <span class="dimension-value">{{ detailsDialog.dimensions?.teamwork || 0 }}</span>
            </div>
            <div class="dimension-score">
              <span class="dimension-name">创意创新:</span>
              <span class="dimension-value">{{ detailsDialog.dimensions?.creativity || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Certificate Generation Dialog -->
    <el-dialog
      v-model="certificateDialog.visible"
      title="生成获奖证书"
      width="800px"
    >
      <div class="certificate-preview">
        <div class="certificate">
          <div class="certificate-header">
            <h1>获奖证书</h1>
            <h2>CERTIFICATE OF ACHIEVEMENT</h2>
          </div>
          
          <div class="certificate-body">
            <p class="certificate-text">
              兹证明节目 <strong>{{ certificateDialog.award?.program.title }}</strong>
            </p>
            <p class="certificate-text">
              表演者：<strong>{{ certificateDialog.award?.program.performer }}</strong>
            </p>
            <p class="certificate-text">
              在公司一周年庆典晚会中荣获
            </p>
            <p class="award-name">{{ certificateDialog.award?.awardName }}</p>
            <p class="certificate-text">
              特此表彰！
            </p>
          </div>
          
          <div class="certificate-footer">
            <div class="date">{{ new Date().toLocaleDateString('zh-CN') }}</div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-label">颁发单位</div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="certificateDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="downloadCertificate">下载证书</el-button>
        <el-button @click="printCertificate">打印证书</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Awards',
  setup() {
    const store = useStore()
    
    const calculating = ref(false)
    const calculationForm = reactive({
      eventId: '1'
    })

    const calculationStatus = ref(null)
    
    const detailsDialog = reactive({
      visible: false,
      award: null,
      dimensions: null
    })

    const certificateDialog = reactive({
      visible: false,
      award: null
    })

    // Mock award data
    const awards = ref([
      {
        awardType: 'best_popularity',
        awardName: '最佳人气奖',
        program: {
          id: 1,
          title: '青春舞曲',
          performer: '张三、李四、王五',
          seqNo: 1
        },
        score: 95,
        publishedAt: '2024-12-09T15:30:00Z'
      },
      {
        awardType: 'best_performance',
        awardName: '最佳表演奖',
        program: {
          id: 2,
          title: '经典朗诵',
          performer: '赵六、钱七',
          seqNo: 3
        },
        score: 92,
        publishedAt: '2024-12-09T15:30:00Z'
      },
      {
        awardType: 'best_teamwork',
        awardName: '最佳默契奖',
        program: {
          id: 3,
          title: '团队合唱',
          performer: '技术部全体',
          seqNo: 5
        },
        score: 89,
        publishedAt: '2024-12-09T15:30:00Z'
      },
      {
        awardType: 'best_creativity',
        awardName: '最佳创意奖',
        program: {
          id: 4,
          title: '创意小品',
          performer: '孙八、周九',
          seqNo: 7
        },
        score: 88,
        publishedAt: '2024-12-09T15:30:00Z'
      },
      {
        awardType: 'best_stage_presence',
        awardName: '最具台风奖',
        program: {
          id: 5,
          title: '独唱表演',
          performer: '吴十',
          seqNo: 2
        },
        score: 90,
        publishedAt: '2024-12-09T15:30:00Z'
      }
    ])

    const awardRules = [
      {
        type: 'best_popularity',
        name: '最佳人气奖',
        description: '根据人气指数维度得分最高的节目获奖',
        criteria: '人气指数 > 90分',
        icon: 'Star',
        color: '#f56c6c'
      },
      {
        type: 'best_performance',
        name: '最佳表演奖',
        description: '根据表演水平维度得分最高的节目获奖',
        criteria: '表演水平 > 85分',
        icon: 'Trophy',
        color: '#e6a23c'
      },
      {
        type: 'best_teamwork',
        name: '最佳默契奖',
        description: '根据团队默契维度得分最高的节目获奖',
        criteria: '团队默契 > 85分',
        icon: 'UserFilled',
        color: '#67c23a'
      },
      {
        type: 'best_creativity',
        name: '最佳创意奖',
        description: '根据创意创新维度得分最高的节目获奖',
        criteria: '创意创新 > 85分',
        icon: 'MagicStick',
        color: '#909399'
      },
      {
        type: 'best_stage_presence',
        name: '最具台风奖',
        description: '根据台风表现维度得分最高的节目获奖',
        criteria: '台风表现 > 85分',
        icon: 'Medal',
        color: '#409eff'
      }
    ]

    const hasAwards = computed(() => awards.value.length > 0)

    const awardStats = computed(() => ({
      totalAwards: 5,
      publishedAwards: awards.value.length,
      winningPrograms: new Set(awards.value.map(a => a.program.id)).size,
      highestScore: Math.max(...awards.value.map(a => a.score), 0)
    }))

    const awardDistribution = computed(() => [
      { name: '最佳人气奖', value: 1 },
      { name: '最佳表演奖', value: 1 },
      { name: '最佳默契奖', value: 1 },
      { name: '最佳创意奖', value: 1 },
      { name: '最具台风奖', value: 1 }
    ])

    const calculateAwards = async () => {
      calculating.value = true
      calculationStatus.value = null
      
      try {
        // Simulate award calculation
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        calculationStatus.value = {
          type: 'success',
          message: '奖项计算完成！共计算出5个奖项，涵盖所有维度。'
        }
        
        ElMessage.success('奖项计算成功')
      } catch (error) {
        calculationStatus.value = {
          type: 'error',
          message: '奖项计算失败，请检查数据完整性后重试。'
        }
        ElMessage.error('计算失败')
      } finally {
        calculating.value = false
      }
    }

    const publishAwards = async () => {
      try {
        await ElMessageBox.confirm(
          '确定发布获奖结果吗？发布后结果将对外公开。',
          '确认发布',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('获奖结果已发布')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('发布失败')
        }
      }
    }

    const viewAwardDetails = (award) => {
      detailsDialog.visible = true
      detailsDialog.award = award
      detailsDialog.dimensions = {
        stagePresence: Math.floor(Math.random() * 20) + 80,
        performance: Math.floor(Math.random() * 20) + 80,
        popularity: Math.floor(Math.random() * 20) + 80,
        teamwork: Math.floor(Math.random() * 20) + 80,
        creativity: Math.floor(Math.random() * 20) + 80
      }
    }

    const generateCertificate = (award) => {
      certificateDialog.visible = true
      certificateDialog.award = award
    }

    const downloadCertificate = () => {
      ElMessage.success('证书下载功能开发中')
      certificateDialog.visible = false
    }

    const printCertificate = () => {
      window.print()
      ElMessage.success('证书打印任务已发送')
    }

    const exportAwards = () => {
      const csvContent = [
        ['奖项名称', '获奖节目', '表演者', '得分', '发布时间'],
        ...awards.value.map(award => [
          award.awardName,
          award.program.title,
          award.program.performer,
          award.score,
          formatTime(award.publishedAt)
        ])
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `获奖结果_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('获奖结果已导出')
    }

    const printAwards = () => {
      window.print()
      ElMessage.success('打印任务已发送')
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    onMounted(() => {
      // Auto-calculate awards on mount for demo
      setTimeout(calculateAwards, 1000)
    })

    return {
      calculating,
      calculationForm,
      calculationStatus,
      detailsDialog,
      certificateDialog,
      awards,
      awardRules,
      hasAwards,
      awardStats,
      awardDistribution,
      calculateAwards,
      publishAwards,
      viewAwardDetails,
      generateCertificate,
      downloadCertificate,
      printCertificate,
      exportAwards,
      printAwards,
      formatTime
    }
  }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 24px;
  color: #2c3e50;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.calculation-control {
  padding: 20px;
}

.mt-16 {
  margin-top: 16px;
}

.awards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.award-card {
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  transition: all 0.3s ease;
}

.award-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.award-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.award-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
  color: #d4710a;
}

.award-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.winner-info {
  margin-bottom: 16px;
}

.program-title {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 4px;
}

.program-performer {
  color: #666;
  margin-bottom: 8px;
}

.program-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score {
  font-size: 20px;
  font-weight: bold;
  color: #52c41a;
}

.award-actions {
  display: flex;
  gap: 8px;
}

.statistics-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.award-distribution h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-label {
  flex: 0 0 100px;
  font-size: 12px;
  color: #666;
}

.chart-bar {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.chart-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #40a9ff);
  transition: width 0.5s ease;
}

.chart-value {
  flex: 0 0 30px;
  text-align: right;
  font-size: 12px;
  color: #666;
}

.award-rules .rule-content h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.award-rules .rule-content p {
  margin: 0 0 8px 0;
  color: #666;
  line-height: 1.5;
}

.rule-criteria {
  margin-top: 8px;
}

.award-analysis h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.dimension-name {
  color: #666;
}

.dimension-value {
  font-weight: 600;
  color: #1890ff;
}

.certificate-preview {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.certificate {
  width: 600px;
  padding: 40px;
  background: white;
  border: 3px solid #d4710a;
  text-align: center;
  font-family: serif;
}

.certificate-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  color: #d4710a;
}

.certificate-header h2 {
  margin: 0 0 30px 0;
  font-size: 14px;
  color: #666;
  letter-spacing: 2px;
}

.certificate-body {
  margin: 40px 0;
}

.certificate-text {
  margin: 12px 0;
  font-size: 16px;
  color: #2c3e50;
}

.award-name {
  margin: 20px 0;
  font-size: 24px;
  font-weight: bold;
  color: #d4710a;
  text-decoration: underline;
}

.certificate-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 40px;
}

.date {
  font-size: 14px;
  color: #666;
}

.signature {
  text-align: center;
}

.signature-line {
  width: 120px;
  height: 1px;
  background: #666;
  margin-bottom: 8px;
}

.signature-label {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .awards-grid {
    grid-template-columns: 1fr;
  }
  
  .statistics-content {
    grid-template-columns: 1fr;
  }
  
  .certificate {
    width: 100%;
    padding: 20px;
  }
}
</style>