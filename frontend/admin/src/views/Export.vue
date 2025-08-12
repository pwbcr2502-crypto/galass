<template>
  <div class="page-container">
    <h2 class="page-title">数据导出</h2>
    
    <!-- Export Options -->
    <el-card class="card-container mb-24">
      <template #header>
        <span>导出选项</span>
      </template>
      
      <el-form :model="exportForm" label-width="120px" style="max-width: 600px;">
        <el-form-item label="导出数据类型">
          <el-radio-group v-model="exportForm.dataType">
            <el-radio label="votes">投票数据</el-radio>
            <el-radio label="employees">员工数据</el-radio>
            <el-radio label="programs">节目数据</el-radio>
            <el-radio label="statistics">统计数据</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="json">JSON</el-radio>
            <el-radio label="csv">CSV</el-radio>
            <el-radio label="xlsx">Excel</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="筛选条件" v-if="exportForm.dataType === 'votes'">
          <el-select v-model="exportForm.programId" placeholder="选择节目" clearable style="width: 200px; margin-right: 12px;">
            <el-option label="所有节目" value="" />
            <el-option
              v-for="program in programs"
              :key="program.id"
              :label="program.title"
              :value="program.id"
            />
          </el-select>
          
          <el-select v-model="exportForm.department" placeholder="选择部门" clearable style="width: 200px;">
            <el-option label="所有部门" value="" />
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="销售部" value="销售部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="财务部" value="财务部" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="高级选项">
          <el-checkbox-group v-model="exportForm.options">
            <el-checkbox label="includeDeleted">包含已删除记录</el-checkbox>
            <el-checkbox label="includeDetails">包含详细信息</el-checkbox>
            <el-checkbox label="compressFile">压缩文件</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="exportLoading"
            @click="exportData"
          >
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          
          <el-button @click="resetForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Export History -->
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>导出历史</span>
          <el-button size="small" @click="refreshHistory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table
        v-loading="historyLoading"
        :data="exportHistory"
        stripe
        empty-text="暂无导出记录"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="dataType" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getDataTypeText(row.dataType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="格式" width="80">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.format.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="fileSize" label="文件大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="recordCount" label="记录数" width="100" />
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
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed'"
              type="primary"
              size="small"
              @click="downloadFile(row)"
            >
              下载
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
              type="warning"
              size="small"
              disabled
            >
              处理中
            </el-button>
            <el-popconfirm
              title="确定删除这个导出记录吗？"
              @confirm="deleteExportRecord(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Quick Export Buttons -->
    <el-card class="card-container">
      <template #header>
        <span>快速导出</span>
      </template>
      
      <div class="quick-export">
        <el-button-group>
          <el-button @click="quickExport('votes', 'csv')">
            <el-icon><Download /></el-icon>
            导出投票数据(CSV)
          </el-button>
          <el-button @click="quickExport('employees', 'xlsx')">
            <el-icon><Download /></el-icon>
            导出员工数据(Excel)
          </el-button>
          <el-button @click="quickExport('programs', 'json')">
            <el-icon><Download /></el-icon>
            导出节目数据(JSON)
          </el-button>
          <el-button @click="quickExport('statistics', 'xlsx')">
            <el-icon><Download /></el-icon>
            导出统计报告(Excel)
          </el-button>
        </el-button-group>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'Export',
  setup() {
    const store = useStore()
    
    const exportLoading = ref(false)
    const historyLoading = ref(false)

    const exportForm = reactive({
      dataType: 'votes',
      format: 'csv',
      dateRange: [],
      programId: '',
      department: '',
      options: ['includeDetails']
    })

    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    })

    // Mock data - in real app this would come from API
    const exportHistory = ref([
      {
        id: 1,
        dataType: 'votes',
        format: 'csv',
        fileName: 'votes_20241209_143022.csv',
        fileSize: 245760,
        recordCount: 1580,
        status: 'completed',
        createdAt: '2024-12-09T14:30:22Z',
        downloadUrl: '/exports/votes_20241209_143022.csv'
      },
      {
        id: 2,
        dataType: 'employees',
        format: 'xlsx',
        fileName: 'employees_20241209_142015.xlsx',
        fileSize: 52480,
        recordCount: 245,
        status: 'completed',
        createdAt: '2024-12-09T14:20:15Z',
        downloadUrl: '/exports/employees_20241209_142015.xlsx'
      },
      {
        id: 3,
        dataType: 'statistics',
        format: 'json',
        fileName: 'statistics_20241209_135500.json',
        fileSize: 15680,
        recordCount: 50,
        status: 'processing',
        createdAt: '2024-12-09T13:55:00Z'
      },
      {
        id: 4,
        dataType: 'programs',
        format: 'csv',
        fileName: 'programs_20241208_160000.csv',
        fileSize: 8960,
        recordCount: 12,
        status: 'failed',
        createdAt: '2024-12-08T16:00:00Z',
        error: 'Network timeout'
      }
    ])

    const programs = computed(() => store.state.admin.programs)

    const exportData = async () => {
      exportLoading.value = true
      
      try {
        // Simulate export API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const fileName = `${exportForm.dataType}_${new Date().toISOString().replace(/[:.]/g, '')}.${exportForm.format}`
        
        // Add to history
        exportHistory.value.unshift({
          id: Date.now(),
          dataType: exportForm.dataType,
          format: exportForm.format,
          fileName,
          fileSize: Math.floor(Math.random() * 500000) + 50000,
          recordCount: Math.floor(Math.random() * 2000) + 100,
          status: 'completed',
          createdAt: new Date().toISOString(),
          downloadUrl: `/exports/${fileName}`
        })
        
        ElMessage.success('数据导出成功')
      } catch (error) {
        ElMessage.error('导出失败')
      } finally {
        exportLoading.value = false
      }
    }

    const quickExport = async (dataType, format) => {
      exportForm.dataType = dataType
      exportForm.format = format
      await exportData()
    }

    const resetForm = () => {
      exportForm.dataType = 'votes'
      exportForm.format = 'csv'
      exportForm.dateRange = []
      exportForm.programId = ''
      exportForm.department = ''
      exportForm.options = ['includeDetails']
    }

    const refreshHistory = async () => {
      historyLoading.value = true
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('历史记录已刷新')
      } catch (error) {
        ElMessage.error('刷新失败')
      } finally {
        historyLoading.value = false
      }
    }

    const downloadFile = (record) => {
      // Simulate file download
      const link = document.createElement('a')
      link.href = '#' // In real app, this would be the actual download URL
      link.download = record.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      ElMessage.success(`开始下载 ${record.fileName}`)
    }

    const deleteExportRecord = (record) => {
      const index = exportHistory.value.findIndex(r => r.id === record.id)
      if (index !== -1) {
        exportHistory.value.splice(index, 1)
        ElMessage.success('导出记录已删除')
      }
    }

    const handleSizeChange = (size) => {
      pagination.limit = size
      pagination.page = 1
      // Refresh data
    }

    const handleCurrentChange = (page) => {
      pagination.page = page
      // Refresh data
    }

    const getDataTypeText = (dataType) => {
      const typeMap = {
        votes: '投票数据',
        employees: '员工数据',
        programs: '节目数据',
        statistics: '统计数据'
      }
      return typeMap[dataType] || dataType
    }

    const getStatusTagType = (status) => {
      const statusMap = {
        completed: 'success',
        processing: 'warning',
        failed: 'danger'
      }
      return statusMap[status] || ''
    }

    const getStatusText = (status) => {
      const statusMap = {
        completed: '完成',
        processing: '处理中',
        failed: '失败'
      }
      return statusMap[status] || status
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    onMounted(async () => {
      // Load programs for filtering
      if (programs.value.length === 0) {
        try {
          await store.dispatch('admin/fetchPrograms')
        } catch (error) {
          console.error('Failed to load programs:', error)
        }
      }
      
      pagination.total = exportHistory.value.length
    })

    return {
      exportLoading,
      historyLoading,
      exportForm,
      pagination,
      exportHistory,
      programs,
      exportData,
      quickExport,
      resetForm,
      refreshHistory,
      downloadFile,
      deleteExportRecord,
      handleSizeChange,
      handleCurrentChange,
      getDataTypeText,
      getStatusTagType,
      getStatusText,
      formatFileSize,
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.quick-export {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-export .el-button-group {
  flex-wrap: wrap;
}

.quick-export .el-button {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .quick-export .el-button-group {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .quick-export .el-button {
    width: 100%;
    justify-content: center;
  }
}
</style>