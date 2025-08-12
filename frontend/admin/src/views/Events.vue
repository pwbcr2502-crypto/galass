<template>
  <div class="page-container">
    <h2 class="page-title">活动管理</h2>
    
    <!-- Toolbar -->
    <div class="toolbar mb-16">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索活动代码或名称"
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
          添加活动
        </el-button>
      </div>
    </div>

    <!-- Events Table -->
    <el-card class="card-container">
      <el-table
        v-loading="loading"
        :data="events"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="活动代码" width="120" />
        <el-table-column prop="name" label="活动名称" min-width="150" />
        <el-table-column prop="mode" label="模式" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.mode === 1 ? 'success' : 'info'">
              {{ row.mode === 1 ? '开放' : '管理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="window_minutes" label="投票窗口(分钟)" width="120" />
        <el-table-column prop="program_count" label="节目数量" width="100" />
        <el-table-column prop="vote_count" label="投票数量" width="100" />
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
        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editEvent(row)">
              编辑
            </el-button>
            <el-button type="info" size="small" @click="generateQRCode(row)">
              二维码
            </el-button>
            <el-popconfirm
              title="确定删除这个活动吗？删除后无法恢复！"
              @confirm="deleteEvent(row)"
            >
              <template #reference>
                <el-button type="danger" size="small" :disabled="row.vote_count > 0">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Event Dialog -->
    <el-dialog
      v-model="eventDialog.visible"
      :title="eventDialog.isEdit ? '编辑活动' : '添加活动'"
      width="600px"
      @close="resetEventForm"
    >
      <el-form
        ref="eventFormRef"
        :model="eventDialog.form"
        :rules="eventRules"
        label-width="120px"
      >
        <el-form-item label="活动代码" prop="code">
          <el-input
            v-model="eventDialog.form.code"
            placeholder="请输入活动代码(如: ANNIV2025)"
            :disabled="eventDialog.isEdit"
          />
          <div class="form-tip">活动代码用于用户登录，只能包含字母和数字</div>
        </el-form-item>
        
        <el-form-item label="活动名称" prop="name">
          <el-input
            v-model="eventDialog.form.name"
            placeholder="请输入活动名称"
          />
        </el-form-item>
        
        <el-form-item label="投票模式" prop="mode">
          <el-radio-group v-model="eventDialog.form.mode">
            <el-radio :label="1">开放模式 - 用户可随时投票</el-radio>
            <el-radio :label="0">管理模式 - 管理员控制投票窗口</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="投票窗口" prop="window_minutes">
          <el-input-number
            v-model="eventDialog.form.window_minutes"
            :min="1"
            :max="60"
            style="width: 100%"
            placeholder="默认投票窗口时长(分钟)"
          />
          <div class="form-tip">每个节目的默认投票时长</div>
        </el-form-item>

        <el-form-item label="评分权重" prop="weights">
          <div class="weights-container">
            <div class="weight-item">
              <span>台风表现:</span>
              <el-input-number
                v-model="eventDialog.form.weights.stage_presence"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                size="small"
                style="width: 120px"
              />
            </div>
            <div class="weight-item">
              <span>表演水平:</span>
              <el-input-number
                v-model="eventDialog.form.weights.performance"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                size="small"
                style="width: 120px"
              />
            </div>
            <div class="weight-item">
              <span>人气指数:</span>
              <el-input-number
                v-model="eventDialog.form.weights.popularity"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                size="small"
                style="width: 120px"
              />
            </div>
            <div class="weight-item">
              <span>团队默契:</span>
              <el-input-number
                v-model="eventDialog.form.weights.teamwork"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                size="small"
                style="width: 120px"
              />
            </div>
            <div class="weight-item">
              <span>创意创新:</span>
              <el-input-number
                v-model="eventDialog.form.weights.creativity"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                size="small"
                style="width: 120px"
              />
            </div>
            <div class="weight-total">
              总计: {{ weightTotal.toFixed(2) }}
              <el-tag :type="weightTotal === 1 ? 'success' : 'warning'" size="small">
                {{ weightTotal === 1 ? '正确' : '请调整至1.0' }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="活动状态" prop="status" v-if="eventDialog.isEdit">
          <el-radio-group v-model="eventDialog.form.status">
            <el-radio :label="0">准备中</el-radio>
            <el-radio :label="1">进行中</el-radio>
            <el-radio :label="2">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="eventDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="eventDialog.loading"
          :disabled="weightTotal !== 1"
          @click="saveEvent"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- QR Code Dialog -->
    <el-dialog
      v-model="qrDialog.visible"
      title="活动二维码"
      width="400px"
    >
      <div class="qr-container">
        <div class="qr-info">
          <h4>{{ qrDialog.event?.name }}</h4>
          <p>活动代码: {{ qrDialog.event?.code }}</p>
          <p>扫描下方二维码或访问链接参与投票</p>
        </div>
        
        <div class="qr-code" v-if="qrDialog.qrCodeUrl">
          <img :src="qrDialog.qrCodeUrl" alt="活动二维码" />
        </div>
        
        <div class="qr-url" v-if="qrDialog.url">
          <el-input
            :value="qrDialog.url"
            readonly
          >
            <template #append>
              <el-button @click="copyUrl">复制</el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="qrDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="downloadQRCode">下载二维码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminRequest } from '@/api/request'

export default {
  name: 'Events',
  setup() {
    const store = useStore()
    
    const loading = ref(false)
    const eventFormRef = ref(null)
    const searchQuery = ref('')
    const selectedEvents = ref([])
    const events = ref([])

    const eventDialog = reactive({
      visible: false,
      isEdit: false,
      loading: false,
      form: {
        id: null,
        code: '',
        name: '',
        mode: 1,
        window_minutes: 5,
        weights: {
          stage_presence: 0.2,
          performance: 0.25,
          popularity: 0.2,
          teamwork: 0.15,
          creativity: 0.2
        },
        theme_config: null,
        status: 0
      }
    })

    const qrDialog = reactive({
      visible: false,
      event: null,
      qrCodeUrl: '',
      url: ''
    })

    const eventRules = {
      code: [
        { required: true, message: '请输入活动代码', trigger: 'blur' },
        { min: 3, max: 32, message: '活动代码长度在3-32个字符', trigger: 'blur' },
        { pattern: /^[A-Za-z0-9]+$/, message: '活动代码只能包含字母和数字', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入活动名称', trigger: 'blur' },
        { min: 2, max: 100, message: '活动名称长度在2-100个字符', trigger: 'blur' }
      ],
      mode: [
        { required: true, message: '请选择投票模式', trigger: 'change' }
      ],
      window_minutes: [
        { required: true, message: '请输入投票窗口时长', trigger: 'blur' }
      ]
    }

    const weightTotal = computed(() => {
      const weights = eventDialog.form.weights
      return weights.stage_presence + weights.performance + weights.popularity + 
             weights.teamwork + weights.creativity
    })

    const fetchEvents = async () => {
      loading.value = true
      try {
        const response = await adminRequest.get('/events')
        console.log('Fetched events:', response.data)
        events.value = response.data.data || response.data
      } catch (error) {
        console.error('Failed to fetch events:', error)
        ElMessage.error('获取活动列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      fetchEvents()
    }

    const handleSelectionChange = (selection) => {
      selectedEvents.value = selection
    }

    const getStatusTagType = (status) => {
      const statusMap = {
        0: 'info',
        1: 'success',
        2: 'warning'
      }
      return statusMap[status] || ''
    }

    const getStatusText = (status) => {
      const statusMap = {
        0: '准备中',
        1: '进行中',
        2: '已结束'
      }
      return statusMap[status] || '未知'
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('zh-CN')
    }

    const showAddDialog = () => {
      eventDialog.visible = true
      eventDialog.isEdit = false
      resetEventForm()
    }

    const editEvent = (event) => {
      eventDialog.visible = true
      eventDialog.isEdit = true
      eventDialog.form = { 
        ...event,
        weights: event.weights || {
          stage_presence: 0.2,
          performance: 0.25,
          popularity: 0.2,
          teamwork: 0.15,
          creativity: 0.2
        }
      }
    }

    const resetEventForm = () => {
      eventDialog.form = {
        id: null,
        code: '',
        name: '',
        mode: 1,
        window_minutes: 5,
        weights: {
          stage_presence: 0.2,
          performance: 0.25,
          popularity: 0.2,
          teamwork: 0.15,
          creativity: 0.2
        },
        theme_config: null,
        status: 0
      }
      eventFormRef.value?.clearValidate()
    }

    const saveEvent = () => {
      eventFormRef.value.validate(async (valid) => {
        if (valid && weightTotal.value === 1) {
          eventDialog.loading = true
          try {
            if (eventDialog.isEdit) {
              await adminRequest.put(`/events/${eventDialog.form.id}`, eventDialog.form)
              ElMessage.success('活动信息更新成功')
            } else {
              await adminRequest.post('/events', eventDialog.form)
              ElMessage.success('活动添加成功')
            }
            
            eventDialog.visible = false
            fetchEvents()
          } catch (error) {
            ElMessage.error(error.response?.data?.message || '保存失败')
          } finally {
            eventDialog.loading = false
          }
        }
      })
    }

    const deleteEvent = async (event) => {
      try {
        await adminRequest.delete(`/events/${event.id}`)
        ElMessage.success('活动删除成功')
        fetchEvents()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '删除失败')
      }
    }

    const generateQRCode = async (event) => {
      try {
        const response = await adminRequest.get(`/qrcode/${event.code}`)
        qrDialog.event = event
        qrDialog.qrCodeUrl = response.data.data.qrCodeDataUrl
        qrDialog.url = response.data.data.qrUrl
        qrDialog.visible = true
      } catch (error) {
        ElMessage.error('生成二维码失败')
      }
    }

    const copyUrl = async () => {
      try {
        await navigator.clipboard.writeText(qrDialog.url)
        ElMessage.success('链接已复制到剪贴板')
      } catch (error) {
        ElMessage.error('复制失败')
      }
    }

    const downloadQRCode = () => {
      const link = document.createElement('a')
      link.href = qrDialog.qrCodeUrl
      link.download = `${qrDialog.event.code}_qrcode.png`
      link.click()
    }

    onMounted(() => {
      fetchEvents()
    })

    return {
      loading,
      eventFormRef,
      searchQuery,
      selectedEvents,
      events,
      eventDialog,
      qrDialog,
      eventRules,
      weightTotal,
      fetchEvents,
      handleSearch,
      handleSelectionChange,
      getStatusTagType,
      getStatusText,
      formatDate,
      showAddDialog,
      editEvent,
      resetEventForm,
      saveEvent,
      deleteEvent,
      generateQRCode,
      copyUrl,
      downloadQRCode
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

.weights-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background-color: #fafafa;
}

.weight-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 0;
}

.weight-item span {
  font-weight: 500;
  min-width: 80px;
}

.weight-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #dcdfe6;
  font-weight: 600;
}

.qr-container {
  text-align: center;
}

.qr-info {
  margin-bottom: 20px;
}

.qr-info h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.qr-info p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.qr-code {
  margin: 20px 0;
}

.qr-code img {
  max-width: 200px;
  max-height: 200px;
}

.qr-url {
  margin-top: 20px;
}
</style>