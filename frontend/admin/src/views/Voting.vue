<template>
  <div class="page-container">
    <h2 class="page-title">投票控制</h2>
    
    <!-- Control Panel -->
    <el-card class="card-container mb-24">
      <template #header>
        <span>投票控制面板</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="control-item">
            <h4>当前投票节目</h4>
            <div v-if="currentProgram" class="current-program">
              <div class="program-info">
                <div class="program-title">{{ currentProgram.title }}</div>
                <div class="program-performer">表演者: {{ currentProgram.performer }}</div>
                <div class="program-status">
                  <el-tag type="success">投票中</el-tag>
                  <span class="vote-count">已投票: {{ currentProgram.vote_count || 0 }}</span>
                </div>
              </div>
              <div class="program-actions">
                <el-button type="danger" @click="endCurrentVoting">
                  结束投票
                </el-button>
              </div>
            </div>
            <div v-else class="no-voting">
              <el-empty description="当前没有进行中的投票" :image-size="80" />
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="control-item">
            <h4>投票统计</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ votingStats.totalVotes }}</div>
                <div class="stat-label">总投票数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ votingStats.uniqueVoters }}</div>
                <div class="stat-label">参与人数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ votingStats.participationRate }}%</div>
                <div class="stat-label">参与率</div>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="24" :lg="8">
          <div class="control-item">
            <h4>快速操作</h4>
            <div class="quick-actions">
              <el-button type="primary" @click="openVoteWindow">
                <el-icon><Star /></el-icon>
                开启投票窗口
              </el-button>
              <el-button type="warning" @click="closeAllVoting">
                <el-icon><CircleClose /></el-icon>
                关闭所有投票
              </el-button>
              <el-button @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Programs List -->
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>节目列表</span>
          <el-radio-group v-model="statusFilter" size="small" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="0">待投票</el-radio-button>
            <el-radio-button label="1">投票中</el-radio-button>
            <el-radio-button label="2">已结束</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="filteredPrograms"
        stripe
        height="400"
      >
        <el-table-column prop="seq_no" label="序号" width="80" />
        <el-table-column prop="title" label="节目名称" min-width="150" />
        <el-table-column prop="performer" label="表演者" min-width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投票时间" width="200">
          <template #default="{ row }">
            <div v-if="row.vote_start_at">
              <div class="time-info">
                开始: {{ formatTime(row.vote_start_at) }}
              </div>
              <div v-if="row.vote_end_at" class="time-info">
                结束: {{ formatTime(row.vote_end_at) }}
              </div>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="vote_count" label="投票数" width="80" />
        <el-table-column prop="avg_score" label="平均分" width="80">
          <template #default="{ row }">
            {{ row.avg_score ? parseFloat(row.avg_score).toFixed(1) : '0.0' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="startVoting(row)"
            >
              开始投票
            </el-button>
            <el-button
              v-else-if="row.status === 1"
              type="danger"
              size="small"
              @click="endVoting(row)"
            >
              结束投票
            </el-button>
            <el-button
              size="small"
              @click="viewDetails(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Vote Window Dialog -->
    <el-dialog
      v-model="voteWindowDialog.visible"
      title="开启投票窗口"
      width="500px"
    >
      <el-form :model="voteWindowDialog.form" label-width="100px">
        <el-form-item label="选择节目">
          <el-select
            v-model="voteWindowDialog.form.programId"
            placeholder="请选择节目"
            style="width: 100%"
          >
            <el-option
              v-for="program in availablePrograms"
              :key="program.id"
              :label="`${program.seq_no}. ${program.title}`"
              :value="program.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="投票时长">
          <el-input-number
            v-model="voteWindowDialog.form.duration"
            :min="1"
            :max="30"
            style="width: 100%"
          />
          <div class="form-tip">单位：分钟</div>
        </el-form-item>
        
        <el-form-item label="自动切换">
          <el-switch
            v-model="voteWindowDialog.form.autoSwitch"
            active-text="启用"
            inactive-text="禁用"
          />
          <div class="form-tip">投票结束后自动切换到下一个节目</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="voteWindowDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmOpenVoting">开始投票</el-button>
      </template>
    </el-dialog>

    <!-- Program Details Dialog -->
    <el-dialog
      v-model="detailsDialog.visible"
      title="节目详情"
      width="600px"
    >
      <div v-if="detailsDialog.program">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="节目序号">
            {{ detailsDialog.program.seq_no }}
          </el-descriptions-item>
          <el-descriptions-item label="节目名称">
            {{ detailsDialog.program.title }}
          </el-descriptions-item>
          <el-descriptions-item label="表演者">
            {{ detailsDialog.program.performer }}
          </el-descriptions-item>
          <el-descriptions-item label="演出时长">
            {{ detailsDialog.program.duration_minutes }}分钟
          </el-descriptions-item>
          <el-descriptions-item label="投票状态">
            <el-tag :type="getStatusTagType(detailsDialog.program.status)">
              {{ getStatusText(detailsDialog.program.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="投票数量">
            {{ detailsDialog.program.vote_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="平均得分" :span="2">
            {{ detailsDialog.program.avg_score || '0.0' }}
          </el-descriptions-item>
          <el-descriptions-item label="节目描述" :span="2">
            {{ detailsDialog.program.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Voting',
  setup() {
    const store = useStore()
    
    const loading = ref(false)
    const statusFilter = ref('')

    const voteWindowDialog = reactive({
      visible: false,
      form: {
        programId: null,
        duration: 5,
        autoSwitch: false
      }
    })

    const detailsDialog = reactive({
      visible: false,
      program: null
    })

    const dashboard = computed(() => store.state.admin.dashboard)
    const programs = computed(() => store.state.admin.programs)
    
    const currentProgram = computed(() => {
      return programs.value.find(p => p.status === 1)
    })

    const availablePrograms = computed(() => {
      return programs.value.filter(p => p.status === 0)
    })

    const filteredPrograms = computed(() => {
      if (!statusFilter.value) return programs.value
      return programs.value.filter(p => p.status.toString() === statusFilter.value)
    })

    const votingStats = computed(() => {
      const stats = dashboard.value.statistics || {}
      return {
        totalVotes: stats.totalVotes || 0,
        uniqueVoters: stats.uniqueVoters || 0,
        participationRate: stats.participationRate || 0
      }
    })

    const refreshData = async () => {
      loading.value = true
      try {
        await Promise.all([
          store.dispatch('admin/fetchDashboard'),
          store.dispatch('admin/fetchPrograms')
        ])
        ElMessage.success('数据已刷新')
      } catch (error) {
        ElMessage.error('刷新失败')
      } finally {
        loading.value = false
      }
    }

    const handleFilterChange = () => {
      // Filter is applied via computed property
    }

    const getStatusTagType = (status) => {
      const statusMap = {
        0: '',
        1: 'success',
        2: 'info'
      }
      return statusMap[status] || ''
    }

    const getStatusText = (status) => {
      const statusMap = {
        0: '待投票',
        1: '投票中',
        2: '已结束'
      }
      return statusMap[status] || '未知'
    }

    const openVoteWindow = () => {
      if (currentProgram.value) {
        ElMessage.warning('当前已有投票进行中，请先结束当前投票')
        return
      }
      
      if (availablePrograms.value.length === 0) {
        ElMessage.warning('没有可用的节目')
        return
      }

      voteWindowDialog.visible = true
    }

    const startVoting = async (program) => {
      try {
        await store.dispatch('admin/controlVoteWindow', {
          programId: program.id,
          action: 'open',
          duration: 5 * 60 // 5 minutes in seconds
        })

        ElMessage.success(`节目「${program.title}」投票已开始`)
        refreshData()
      } catch (error) {
        ElMessage.error('开始投票失败')
      }
    }

    const endVoting = async (program) => {
      try {
        await ElMessageBox.confirm(
          `确定结束节目「${program.title}」的投票吗？`,
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await store.dispatch('admin/controlVoteWindow', {
          programId: program.id,
          action: 'close'
        })

        ElMessage.success('投票已结束')
        refreshData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    const endCurrentVoting = async () => {
      if (currentProgram.value) {
        await endVoting(currentProgram.value)
      }
    }

    const closeAllVoting = async () => {
      try {
        await ElMessageBox.confirm(
          '确定关闭所有正在进行的投票吗？',
          '确认操作',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const votingPrograms = programs.value.filter(p => p.status === 1)
        for (const program of votingPrograms) {
          await store.dispatch('admin/controlVoteWindow', {
            programId: program.id,
            action: 'close'
          })
        }

        ElMessage.success('所有投票已关闭')
        refreshData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    const confirmOpenVoting = async () => {
      try {
        const program = programs.value.find(p => p.id === voteWindowDialog.form.programId)
        await store.dispatch('admin/controlVoteWindow', {
          programId: voteWindowDialog.form.programId,
          action: 'open',
          duration: voteWindowDialog.form.duration * 60
        })

        voteWindowDialog.visible = false
        ElMessage.success(`节目「${program.title}」投票已开始`)
        refreshData()
      } catch (error) {
        ElMessage.error('开始投票失败')
      }
    }

    const viewDetails = (program) => {
      detailsDialog.visible = true
      detailsDialog.program = program
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    onMounted(() => {
      refreshData()
    })

    return {
      loading,
      statusFilter,
      voteWindowDialog,
      detailsDialog,
      currentProgram,
      availablePrograms,
      filteredPrograms,
      votingStats,
      refreshData,
      handleFilterChange,
      getStatusTagType,
      getStatusText,
      openVoteWindow,
      startVoting,
      endVoting,
      endCurrentVoting,
      closeAllVoting,
      confirmOpenVoting,
      viewDetails,
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

.control-item {
  height: 100%;
}

.control-item h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-weight: 600;
}

.current-program {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.program-info {
  margin-bottom: 16px;
}

.program-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.program-performer {
  color: #666;
  margin-bottom: 8px;
}

.program-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vote-count {
  color: #1890ff;
  font-weight: 500;
}

.no-voting {
  text-align: center;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 4px;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions .el-button {
  justify-content: flex-start;
}

.time-info {
  font-size: 12px;
  color: #666;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions .el-button {
    width: 100%;
  }
}
</style>