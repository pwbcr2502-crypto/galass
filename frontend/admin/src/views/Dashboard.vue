<template>
  <div class="page-container">
    <h2 class="page-title">控制面板</h2>
    
    <!-- Statistics Cards -->
    <el-row :gutter="20" class="mb-24">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-number">{{ statistics.totalEmployees || 0 }}</div>
          <div class="stat-label">总员工数</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-number">{{ statistics.totalPrograms || 0 }}</div>
          <div class="stat-label">节目数量</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-number">{{ statistics.totalVotes || 0 }}</div>
          <div class="stat-label">总投票数</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-number">{{ statistics.participationRate || 0 }}%</div>
          <div class="stat-label">参与率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- Active Programs -->
      <el-col :xs="24" :lg="14">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>当前节目状态</span>
              <el-button type="primary" size="small" @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <el-table :data="activePrograms" stripe>
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
            <el-table-column prop="vote_count" label="投票数" width="80" />
            <el-table-column prop="avg_score" label="平均分" width="80">
              <template #default="{ row }">
                {{ row.avg_score ? parseFloat(row.avg_score).toFixed(1) : '0.0' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
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
                <span v-else class="text-muted">已结束</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- Recent Activity -->
      <el-col :xs="24" :lg="10">
        <el-card class="card-container">
          <template #header>
            <span>最近投票活动</span>
          </template>
          
          <div class="activity-list">
            <div
              v-for="activity in recentActivity"
              :key="activity.timestamp"
              class="activity-item"
            >
              <div class="activity-content">
                <div class="activity-text">
                  <strong>{{ activity.employee_name }}</strong>
                  为「{{ activity.program_title }}」投票
                </div>
                <div class="activity-score">
                  综合得分: {{ activity.composite_score }}
                </div>
              </div>
              <div class="activity-time">
                {{ formatTime(activity.timestamp) }}
              </div>
            </div>
          </div>
          
          <div v-if="!recentActivity.length" class="empty-state">
            <el-empty description="暂无投票活动" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Vote Window Control Dialog -->
    <el-dialog
      v-model="voteWindowDialog.visible"
      title="投票窗口控制"
      width="400px"
    >
      <el-form :model="voteWindowDialog.form" label-width="80px">
        <el-form-item label="节目">
          {{ voteWindowDialog.program?.title }}
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number
            v-model="voteWindowDialog.form.duration"
            :min="1"
            :max="30"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="voteWindowDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmVoteWindow">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()
    
    const voteWindowDialog = reactive({
      visible: false,
      program: null,
      action: '',
      form: {
        duration: 5
      }
    })

    const dashboard = computed(() => store.state.admin.dashboard)
    const statistics = computed(() => dashboard.value.statistics)
    const recentActivity = computed(() => dashboard.value.recentActivity)
    const activePrograms = computed(() => dashboard.value.activePrograms)

    const refreshData = async () => {
      try {
        await store.dispatch('admin/fetchDashboard')
        ElMessage.success('数据已刷新')
      } catch (error) {
        console.error('Dashboard refresh error:', error)
        // Don't show error message for authentication errors on page load
        if (error.response?.status !== 403) {
          ElMessage.error('刷新失败: ' + (error.response?.data?.message || error.message))
        }
      }
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

    const startVoting = (program) => {
      voteWindowDialog.visible = true
      voteWindowDialog.program = program
      voteWindowDialog.action = 'open'
      voteWindowDialog.form.duration = 5
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

    const confirmVoteWindow = async () => {
      try {
        await store.dispatch('admin/controlVoteWindow', {
          programId: voteWindowDialog.program.id,
          action: voteWindowDialog.action,
          duration: voteWindowDialog.form.duration * 60 // Convert to seconds
        })

        voteWindowDialog.visible = false
        ElMessage.success('操作成功')
        refreshData()
      } catch (error) {
        ElMessage.error('操作失败')
      }
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
      statistics,
      recentActivity,
      activePrograms,
      voteWindowDialog,
      refreshData,
      getStatusTagType,
      getStatusText,
      startVoting,
      endVoting,
      confirmVoteWindow,
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

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin-bottom: 4px;
  color: #2c3e50;
}

.activity-score {
  font-size: 12px;
  color: #909399;
}

.activity-time {
  font-size: 12px;
  color: #c0c4cc;
  white-space: nowrap;
  margin-left: 12px;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 20px;
}
</style>