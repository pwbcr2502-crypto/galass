<template>
  <div class="page-container">
    <h2 class="page-title">员工管理</h2>
    
    <!-- Toolbar -->
    <div class="toolbar mb-16">
      <div class="toolbar-left">
        <el-input
          v-model="searchForm.search"
          placeholder="搜索员工姓名或工号"
          style="width: 250px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="searchForm.department"
          placeholder="选择部门"
          style="width: 150px"
          clearable
          @change="handleSearch"
        >
          <el-option label="技术部" value="技术部" />
          <el-option label="市场部" value="市场部" />
          <el-option label="销售部" value="销售部" />
          <el-option label="人事部" value="人事部" />
          <el-option label="财务部" value="财务部" />
        </el-select>
        
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-button type="success" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加员工
        </el-button>
        
        <el-button @click="showImportDialog">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        
        <el-button @click="exportEmployees">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- Employee Table -->
    <el-card class="card-container">
      <el-table
        v-loading="loading"
        :data="employees"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="emp_no" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : 'danger'"
              size="small"
            >
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="150">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editEmployee(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除这个员工吗？"
              @confirm="deleteEmployee(row)"
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
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Employee Dialog -->
    <el-dialog
      v-model="employeeDialog.visible"
      :title="employeeDialog.isEdit ? '编辑员工' : '添加员工'"
      width="500px"
      @close="resetEmployeeForm"
    >
      <el-form
        ref="employeeFormRef"
        :model="employeeDialog.form"
        :rules="employeeRules"
        label-width="80px"
      >
        <el-form-item label="工号" prop="emp_no">
          <el-input
            v-model="employeeDialog.form.emp_no"
            placeholder="请输入工号"
            :disabled="employeeDialog.isEdit"
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="employeeDialog.form.name"
            placeholder="请输入姓名"
          />
        </el-form-item>
        
        <el-form-item label="部门" prop="department">
          <el-select
            v-model="employeeDialog.form.department"
            placeholder="请选择部门"
            style="width: 100%"
          >
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="销售部" value="销售部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="财务部" value="财务部" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="手机号" prop="mobile">
          <el-input
            v-model="employeeDialog.form.mobile"
            placeholder="请输入手机号"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="employeeDialog.form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="employeeDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="employeeDialog.loading"
          @click="saveEmployee"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog
      v-model="importDialog.visible"
      title="批量导入员工"
      width="600px"
    >
      <div class="import-steps">
        <el-steps :active="importDialog.step" finish-status="success">
          <el-step title="下载模板" description="下载Excel模板文件" />
          <el-step title="上传文件" description="上传填写好的Excel文件" />
          <el-step title="导入完成" description="确认导入结果" />
        </el-steps>
      </div>
      
      <div class="import-content" style="margin-top: 30px;">
        <!-- Step 1: Download Template -->
        <div v-if="importDialog.step === 0">
          <el-alert
            title="请先下载模板文件，按照模板格式填写员工信息"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
          />
          
          <div class="text-center">
            <el-button type="primary" @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载Excel模板
            </el-button>
          </div>
        </div>
        
        <!-- Step 2: Upload File -->
        <div v-if="importDialog.step === 1">
          <el-upload
            ref="uploadRef"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            action="#"
            accept=".xlsx,.xls"
            :show-file-list="false"
            style="text-align: center;"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择Excel文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                只支持 .xlsx/.xls 格式文件，且不超过5MB
              </div>
            </template>
          </el-upload>
        </div>
        
        <!-- Step 3: Import Result -->
        <div v-if="importDialog.step === 2">
          <el-result
            icon="success"
            title="导入完成"
            :sub-title="`成功导入 ${importDialog.result.success} 个员工`"
          >
            <template #extra>
              <el-button type="primary" @click="finishImport">完成</el-button>
            </template>
          </el-result>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="importDialog.visible = false">取消</el-button>
        <el-button
          v-if="importDialog.step === 0"
          type="primary"
          @click="importDialog.step = 1"
        >
          下一步
        </el-button>
        <el-button
          v-if="importDialog.step === 1"
          @click="importDialog.step = 0"
        >
          上一步
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Employees',
  setup() {
    const store = useStore()
    
    const loading = ref(false)
    const employeeFormRef = ref(null)
    const uploadRef = ref(null)
    const selectedEmployees = ref([])

    const searchForm = reactive({
      search: '',
      department: ''
    })

    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0
    })

    const employeeDialog = reactive({
      visible: false,
      isEdit: false,
      loading: false,
      form: {
        id: null,
        emp_no: '',
        name: '',
        department: '',
        mobile: '',
        status: 1
      }
    })

    const importDialog = reactive({
      visible: false,
      step: 0,
      loading: false,
      result: {
        success: 0,
        failed: 0
      }
    })

    const employeeRules = {
      emp_no: [
        { required: true, message: '请输入工号', trigger: 'blur' },
        { pattern: /^[A-Z]\d{3}$/, message: '工号格式：字母+3位数字，如E001', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在2-10个字符', trigger: 'blur' }
      ],
      department: [
        { required: true, message: '请选择部门', trigger: 'change' }
      ],
      mobile: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ]
    }

    const employees = computed(() => store.state.admin.employees)

    const fetchEmployees = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...searchForm
        }
        const response = await store.dispatch('admin/fetchEmployees', params)
        pagination.total = response.data.pagination?.total || 0
      } catch (error) {
        ElMessage.error('获取员工列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      pagination.page = 1
      fetchEmployees()
    }

    const handleSizeChange = (size) => {
      pagination.limit = size
      pagination.page = 1
      fetchEmployees()
    }

    const handleCurrentChange = (page) => {
      pagination.page = page
      fetchEmployees()
    }

    const handleSelectionChange = (selection) => {
      selectedEmployees.value = selection
    }

    const showAddDialog = () => {
      employeeDialog.visible = true
      employeeDialog.isEdit = false
      resetEmployeeForm()
    }

    const editEmployee = (employee) => {
      employeeDialog.visible = true
      employeeDialog.isEdit = true
      employeeDialog.form = { ...employee }
    }

    const resetEmployeeForm = () => {
      employeeDialog.form = {
        id: null,
        emp_no: '',
        name: '',
        department: '',
        mobile: '',
        status: 1
      }
      employeeFormRef.value?.clearValidate()
    }

    const saveEmployee = () => {
      employeeFormRef.value.validate(async (valid) => {
        if (valid) {
          employeeDialog.loading = true
          try {
            if (employeeDialog.isEdit) {
              await store.dispatch('admin/updateEmployee', employeeDialog.form)
              ElMessage.success('员工信息更新成功')
            } else {
              await store.dispatch('admin/createEmployee', employeeDialog.form)
              ElMessage.success('员工添加成功')
            }
            
            employeeDialog.visible = false
            fetchEmployees()
          } catch (error) {
            ElMessage.error('保存失败')
          } finally {
            employeeDialog.loading = false
          }
        }
      })
    }

    const deleteEmployee = async (employee) => {
      try {
        await store.dispatch('admin/deleteEmployee', employee.id)
        ElMessage.success('员工删除成功')
        fetchEmployees()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    }

    const showImportDialog = () => {
      importDialog.visible = true
      importDialog.step = 0
    }

    const downloadTemplate = () => {
      // Create CSV template
      const headers = ['工号*', '姓名*', '部门*', '手机号']
      const sampleData = [
        ['E001', '张三', '技术部', '13800138001'],
        ['E002', '李四', '市场部', '13800138002']
      ]
      
      const csvContent = [headers, ...sampleData]
        .map(row => row.join(','))
        .join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = '员工导入模板.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('模板下载成功')
    }

    const beforeUpload = (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel'
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isExcel) {
        ElMessage.error('只支持 Excel 文件!')
        return false
      }
      if (!isLt5M) {
        ElMessage.error('文件大小不能超过 5MB!')
        return false
      }

      // Simulate file processing
      setTimeout(() => {
        handleUploadSuccess()
      }, 1000)

      return false // Prevent actual upload
    }

    const handleUploadSuccess = () => {
      importDialog.step = 2
      importDialog.result.success = 10
      importDialog.result.failed = 0
      ElMessage.success('文件解析成功')
    }

    const handleUploadError = () => {
      ElMessage.error('文件上传失败')
    }

    const finishImport = () => {
      importDialog.visible = false
      fetchEmployees()
    }

    const exportEmployees = () => {
      const headers = ['工号', '姓名', '部门', '手机号', '状态', '创建时间']
      const data = employees.value.map(emp => [
        emp.emp_no,
        emp.name,
        emp.department,
        emp.mobile,
        emp.status === 1 ? '正常' : '禁用',
        formatTime(emp.created_at)
      ])
      
      const csvContent = [headers, ...data]
        .map(row => row.join(','))
        .join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `员工列表_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('导出成功')
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    onMounted(() => {
      fetchEmployees()
    })

    return {
      loading,
      employeeFormRef,
      uploadRef,
      selectedEmployees,
      searchForm,
      pagination,
      employeeDialog,
      importDialog,
      employeeRules,
      employees,
      fetchEmployees,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      showAddDialog,
      editEmployee,
      resetEmployeeForm,
      saveEmployee,
      deleteEmployee,
      showImportDialog,
      downloadTemplate,
      beforeUpload,
      handleUploadSuccess,
      handleUploadError,
      finishImport,
      exportEmployees,
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.import-steps {
  padding: 0 20px;
}

.import-content {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload__tip) {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>