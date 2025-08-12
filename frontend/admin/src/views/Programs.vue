<template>
  <div class="page-container">
    <h2 class="page-title">节目管理</h2>
    
    <!-- Event Selection -->
    <el-card class="event-card mb-16" shadow="never">
      <div class="event-selector">
        <div class="event-info">
          <span class="event-label">当前活动:</span>
          <el-select
            v-model="selectedEventId"
            placeholder="选择活动"
            style="width: 300px"
            @change="handleEventChange"
          >
            <el-option
              v-for="event in events"
              :key="event.id"
              :label="`${event.name} (${event.code})`"
              :value="parseInt(event.id)"
            >
              <span style="float: left">{{ event.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ event.code }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="event-status" v-if="currentEvent">
          <el-tag :type="getEventStatusType(currentEvent.status)" size="small">
            {{ getEventStatusText(currentEvent.status) }}
          </el-tag>
          <span class="event-stats">
            节目数: {{ currentEvent.program_count }} | 投票数: {{ currentEvent.vote_count }}
          </span>
        </div>
      </div>
    </el-card>
    
    <!-- Toolbar -->
    <div class="toolbar mb-16">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索节目名称或表演者"
          style="width: 250px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-button type="success" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加节目
        </el-button>
      </div>
    </div>

    <!-- Programs Table -->
    <el-card class="card-container">
      <el-table
        v-loading="loading"
        :data="programs"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="seq_no" label="序号" width="80" sortable />
        <el-table-column prop="title" label="节目名称" min-width="150" />
        <el-table-column prop="performer" label="表演者" min-width="120" />
        <el-table-column prop="description" label="节目描述" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.description && row.description.length > 30"
              :content="row.description"
              placement="top"
            >
              <span>{{ row.description.substring(0, 30) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.description || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="时长(分钟)" width="100" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editProgram(row)">
              编辑
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              size="small"
              @click="startVoting(row)"
            >
              开始投票
            </el-button>
            <el-button
              v-else-if="row.status === 1"
              type="warning"
              size="small"
              @click="endVoting(row)"
            >
              结束投票
            </el-button>
            <el-popconfirm
              title="确定删除这个节目吗？"
              @confirm="deleteProgram(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Program Dialog -->
    <el-dialog
      v-model="programDialog.visible"
      :title="programDialog.isEdit ? '编辑节目' : '添加节目'"
      width="600px"
      @close="resetProgramForm"
    >
      <el-form
        ref="programFormRef"
        :model="programDialog.form"
        :rules="programRules"
        label-width="100px"
      >
        <el-form-item label="所属活动" prop="event_id">
          <el-select
            v-model="programDialog.form.event_id"
            placeholder="选择活动"
            style="width: 100%"
            :disabled="programDialog.isEdit"
          >
            <el-option
              v-for="event in events"
              :key="event.id"
              :label="`${event.name} (${event.code})`"
              :value="parseInt(event.id)"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="序号" prop="seq_no">
          <el-input-number
            v-model="programDialog.form.seq_no"
            :min="1"
            :max="100"
            style="width: 100%"
            placeholder="节目演出顺序"
          />
        </el-form-item>
        
        <el-form-item label="节目名称" prop="title">
          <el-input
            v-model="programDialog.form.title"
            placeholder="请输入节目名称"
          />
        </el-form-item>
        
        <el-form-item label="表演者" prop="performer">
          <el-input
            v-model="programDialog.form.performer"
            type="textarea"
            :rows="3"
            placeholder="请输入表演者姓名，多人用逗号分隔"
          />
        </el-form-item>
        
        <el-form-item label="节目描述" prop="description">
          <el-input
            v-model="programDialog.form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入节目描述"
          />
        </el-form-item>
        
        <el-form-item label="演出时长" prop="duration_minutes">
          <el-input-number
            v-model="programDialog.form.duration_minutes"
            :min="1"
            :max="30"
            style="width: 100%"
            placeholder="预计演出时长(分钟)"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="programDialog.form.status">
            <el-radio :label="0">待投票</el-radio>
            <el-radio :label="1">投票中</el-radio>
            <el-radio :label="2">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="programDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="programDialog.loading"
          @click="saveProgram"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Vote Control Dialog -->
    <el-dialog
      v-model="voteDialog.visible"
      title="投票控制"
      width="400px"
    >
      <el-form :model="voteDialog.form" label-width="100px">
        <el-form-item label="节目名称">
          {{ voteDialog.program?.title }}
        </el-form-item>
        <el-form-item label="投票时长">
          <el-input-number
            v-model="voteDialog.form.duration"
            :min="1"
            :max="30"
            style="width: 100%"
          />
          <div class="form-tip">单位：分钟</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="voteDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmVoteControl">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Programs',
  setup() {
    const store = useStore()
    
    const loading = ref(false)
    const programFormRef = ref(null)
    const searchQuery = ref('')
    const selectedPrograms = ref([])
    const selectedEventId = ref(null)
    const events = ref([])
    const currentEvent = computed(() => events.value.find(e => parseInt(e.id) === selectedEventId.value))

    const programDialog = reactive({
      visible: false,
      isEdit: false,
      loading: false,
      form: {
        id: null,
        event_id: null,
        seq_no: 1,
        title: '',
        performer: '',
        description: '',
        duration_minutes: 5,
        status: 0
      }
    })

    const voteDialog = reactive({
      visible: false,
      program: null,
      action: '',
      form: {
        duration: 5
      }
    })

    const programRules = {
      event_id: [
        { required: true, message: '请选择活动', trigger: 'change' }
      ],
      seq_no: [
        { required: true, message: '请输入序号', trigger: 'blur' }
      ],
      title: [
        { required: true, message: '请输入节目名称', trigger: 'blur' },
        { min: 2, max: 50, message: '节目名称长度在2-50个字符', trigger: 'blur' }
      ],
      performer: [
        { required: true, message: '请输入表演者', trigger: 'blur' },
        { min: 2, max: 200, message: '表演者信息长度在2-200个字符', trigger: 'blur' }
      ],
      duration_minutes: [
        { required: true, message: '请输入演出时长', trigger: 'blur' }
      ]
    }

    const programs = computed(() => store.state.admin.programs)

    // Fetch events
    const fetchEvents = async () => {
      try {
        const response = await store.dispatch('admin/fetchEvents')
        events.value = response || []
        
        // Set default selected event to active event
        const activeEvent = events.value.find(e => parseInt(e.status) === 1)
        if (activeEvent && !selectedEventId.value) {
          selectedEventId.value = parseInt(activeEvent.id)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
        ElMessage.error('获取活动列表失败')
      }
    }

    const fetchPrograms = async (eventId = null) => {
      loading.value = true
      try {
        const queryEventId = eventId || selectedEventId.value
        await store.dispatch('admin/fetchPrograms', { eventId: queryEventId })
      } catch (error) {
        ElMessage.error('获取节目列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleEventChange = () => {
      fetchPrograms()
    }

    const handleSearch = () => {
      // In a real app, this would filter the programs
      fetchPrograms()
    }

    const handleSelectionChange = (selection) => {
      selectedPrograms.value = selection
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

    const getEventStatusType = (status) => {
      const statusMap = {
        0: 'info',
        1: 'success',
        2: 'warning'
      }
      return statusMap[status] || ''
    }

    const getEventStatusText = (status) => {
      const statusMap = {
        0: '未开始',
        1: '进行中',
        2: '已结束'
      }
      return statusMap[status] || '未知'
    }

    const showAddDialog = () => {
      programDialog.visible = true
      programDialog.isEdit = false
      resetProgramForm()
      // Set default event_id to current selected event
      programDialog.form.event_id = selectedEventId.value
    }

    const editProgram = (program) => {
      programDialog.visible = true
      programDialog.isEdit = true
      programDialog.form = { ...program }
    }

    const resetProgramForm = () => {
      programDialog.form = {
        id: null,
        event_id: null,
        seq_no: 1,
        title: '',
        performer: '',
        description: '',
        duration_minutes: 5,
        status: 0
      }
      programFormRef.value?.clearValidate()
    }

    const saveProgram = () => {
      programFormRef.value.validate(async (valid) => {
        if (valid) {
          programDialog.loading = true
          try {
            if (programDialog.isEdit) {
              await store.dispatch('admin/updateProgram', programDialog.form)
              ElMessage.success('节目信息更新成功')
            } else {
              await store.dispatch('admin/createProgram', programDialog.form)
              ElMessage.success('节目添加成功')
            }
            
            programDialog.visible = false
            fetchPrograms()
          } catch (error) {
            ElMessage.error('保存失败')
          } finally {
            programDialog.loading = false
          }
        }
      })
    }

    const deleteProgram = async (program) => {
      try {
        await store.dispatch('admin/deleteProgram', program.id)
        ElMessage.success('节目删除成功')
        fetchPrograms()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    }

    const startVoting = (program) => {
      voteDialog.visible = true
      voteDialog.program = program
      voteDialog.action = 'open'
      voteDialog.form.duration = 5
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
        fetchPrograms()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
    }

    const confirmVoteControl = async () => {
      try {
        await store.dispatch('admin/controlVoteWindow', {
          programId: voteDialog.program.id,
          action: voteDialog.action,
          duration: voteDialog.form.duration * 60 // Convert to seconds
        })

        voteDialog.visible = false
        ElMessage.success('操作成功')
        fetchPrograms()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }

    onMounted(async () => {
      await fetchEvents()
      fetchPrograms()
    })

    return {
      loading,
      programFormRef,
      searchQuery,
      selectedPrograms,
      selectedEventId,
      events,
      currentEvent,
      programDialog,
      voteDialog,
      programRules,
      programs,
      fetchEvents,
      fetchPrograms,
      handleEventChange,
      handleSearch,
      handleSelectionChange,
      getStatusTagType,
      getStatusText,
      getEventStatusType,
      getEventStatusText,
      showAddDialog,
      editProgram,
      resetProgramForm,
      saveProgram,
      deleteProgram,
      startVoting,
      endVoting,
      confirmVoteControl
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.event-card {
  border: 1px solid #e4e7ed;
}

.event-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-label {
  font-weight: 500;
  color: #2c3e50;
}

.event-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.event-stats {
  font-size: 13px;
  color: #606266;
}
</style>