<template>
  <div class="page-container">
    <h2 class="page-title">二维码管理</h2>
    
    <!-- QR Code Generation -->
    <el-card class="card-container mb-24">
      <template #header>
        <span>生成二维码</span>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" style="max-width: 500px;">
        <el-form-item label="活动代码" prop="eventCode">
          <el-input
            v-model="form.eventCode"
            placeholder="请输入活动代码 (如: ANNIV2025)"
            @keyup.enter="generateQRCode"
          />
        </el-form-item>
        
        <el-form-item label="二维码尺寸">
          <el-radio-group v-model="form.size">
            <el-radio label="small">小 (200x200)</el-radio>
            <el-radio label="medium">中 (300x300)</el-radio>
            <el-radio label="large">大 (400x400)</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="generateQRCode"
          >
            <el-icon><QrCode /></el-icon>
            生成二维码
          </el-button>
          
          <el-button @click="resetForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- QR Code Display -->
    <el-card v-if="qrCodeData" class="card-container">
      <template #header>
        <div class="card-header">
          <span>二维码预览</span>
          <div class="header-actions">
            <el-button size="small" @click="downloadQRCode">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button size="small" @click="copyQRUrl">
              <el-icon><CopyDocument /></el-icon>
              复制链接
            </el-button>
            <el-button size="small" @click="printQRCode">
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="qr-display">
        <div class="qr-container">
          <div class="qr-code" :class="form.size">
            <img :src="qrCodeData.qrCodeDataUrl" :alt="`QR Code for ${qrCodeData.eventCode}`" />
          </div>
          
          <div class="qr-info">
            <h3>{{ qrCodeData.eventCode }} 投票二维码</h3>
            <p class="qr-url">{{ qrCodeData.qrUrl }}</p>
            
            <el-divider />
            
            <div class="usage-instructions">
              <h4>使用说明</h4>
              <ol>
                <li>员工使用微信或其他扫码工具扫描此二维码</li>
                <li>扫码后会自动跳转到投票页面</li>
                <li>需要使用工号登录后才能进行投票</li>
                <li>每个员工每个节目只能投票一次</li>
              </ol>
            </div>
            
            <el-divider />
            
            <div class="qr-stats">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-number">{{ stats.totalScans || 0 }}</div>
                    <div class="stat-label">扫码次数</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-number">{{ stats.uniqueUsers || 0 }}</div>
                    <div class="stat-label">访问用户</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-number">{{ stats.conversionRate || 0 }}%</div>
                    <div class="stat-label">转化率</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Historical QR Codes -->
    <el-card v-if="historicalQRCodes.length > 0" class="card-container">
      <template #header>
        <span>历史二维码</span>
      </template>
      
      <el-table :data="historicalQRCodes" stripe>
        <el-table-column prop="eventCode" label="活动代码" width="120" />
        <el-table-column prop="qrUrl" label="链接地址" min-width="200">
          <template #default="{ row }">
            <el-link :href="row.qrUrl" target="_blank" type="primary">
              {{ row.qrUrl }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="scans" label="扫码次数" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="loadQRCode(row)">
              查看
            </el-button>
            <el-button size="small" @click="downloadHistoricalQR(row)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Print Dialog -->
    <el-dialog
      v-model="printDialog.visible"
      title="打印二维码"
      width="400px"
    >
      <div class="print-preview">
        <div class="print-qr-code">
          <img v-if="qrCodeData" :src="qrCodeData.qrCodeDataUrl" alt="QR Code" />
        </div>
        <div class="print-info">
          <h3>{{ qrCodeData?.eventCode }} 投票</h3>
          <p>扫码参与投票</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="printDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmPrint">确认打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'QRCode',
  setup() {
    const store = useStore()
    
    const loading = ref(false)
    const formRef = ref(null)

    const form = reactive({
      eventCode: 'ANNIV2025',
      size: 'medium'
    })

    const printDialog = reactive({
      visible: false
    })

    const rules = {
      eventCode: [
        { required: true, message: '请输入活动代码', trigger: 'blur' },
        { pattern: /^[A-Z0-9]{6,20}$/, message: '活动代码只能包含大写字母和数字，长度6-20位', trigger: 'blur' }
      ]
    }

    // Mock data - in real app this would come from store
    const historicalQRCodes = ref([
      {
        eventCode: 'ANNIV2024',
        qrUrl: 'http://localhost:8080?event=ANNIV2024',
        createdAt: '2024-01-15T10:30:00Z',
        scans: 156
      },
      {
        eventCode: 'SPRING2024',
        qrUrl: 'http://localhost:8080?event=SPRING2024',
        createdAt: '2024-03-20T14:20:00Z',
        scans: 89
      }
    ])

    const qrCodeData = computed(() => store.state.admin.qrCode)
    
    const stats = computed(() => ({
      totalScans: 234,
      uniqueUsers: 198,
      conversionRate: 85
    }))

    const generateQRCode = () => {
      formRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          try {
            await store.dispatch('admin/generateQRCode', form.eventCode)
            ElMessage.success('二维码生成成功')
          } catch (error) {
            ElMessage.error('生成二维码失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    const resetForm = () => {
      form.eventCode = 'ANNIV2025'
      form.size = 'medium'
      formRef.value?.clearValidate()
    }

    const downloadQRCode = () => {
      if (!qrCodeData.value) return
      
      const link = document.createElement('a')
      link.download = `qr-code-${qrCodeData.value.eventCode}.png`
      link.href = qrCodeData.value.qrCodeDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      ElMessage.success('二维码已下载')
    }

    const copyQRUrl = async () => {
      if (!qrCodeData.value) return
      
      try {
        await navigator.clipboard.writeText(qrCodeData.value.qrUrl)
        ElMessage.success('链接已复制到剪贴板')
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = qrCodeData.value.qrUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        ElMessage.success('链接已复制到剪贴板')
      }
    }

    const printQRCode = () => {
      printDialog.visible = true
    }

    const confirmPrint = () => {
      const printContent = document.querySelector('.print-preview').innerHTML
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
          <head>
            <title>二维码打印</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .print-qr-code img { width: 300px; height: 300px; }
              h3 { margin: 20px 0 10px 0; }
              p { margin: 0; color: #666; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
      
      printDialog.visible = false
      ElMessage.success('打印任务已发送')
    }

    const loadQRCode = async (qrCode) => {
      try {
        await store.dispatch('admin/generateQRCode', qrCode.eventCode)
        form.eventCode = qrCode.eventCode
        ElMessage.success('二维码已加载')
      } catch (error) {
        ElMessage.error('加载二维码失败')
      }
    }

    const downloadHistoricalQR = (qrCode) => {
      // In a real app, this would fetch the QR code data from server
      ElMessage.info('历史二维码下载功能开发中')
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString('zh-CN')
    }

    onMounted(() => {
      // Auto-generate QR code on mount
      generateQRCode()
    })

    return {
      loading,
      formRef,
      form,
      printDialog,
      rules,
      historicalQRCodes,
      qrCodeData,
      stats,
      generateQRCode,
      resetForm,
      downloadQRCode,
      copyQRUrl,
      printQRCode,
      confirmPrint,
      loadQRCode,
      downloadHistoricalQR,
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

.qr-display {
  display: flex;
  justify-content: center;
}

.qr-container {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  max-width: 800px;
  width: 100%;
}

.qr-code {
  flex-shrink: 0;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code.small img {
  width: 200px;
  height: 200px;
}

.qr-code.medium img {
  width: 300px;
  height: 300px;
}

.qr-code.large img {
  width: 400px;
  height: 400px;
}

.qr-info {
  flex: 1;
  min-width: 300px;
}

.qr-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 20px;
}

.qr-url {
  color: #1890ff;
  font-family: monospace;
  word-break: break-all;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 0;
}

.usage-instructions h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.usage-instructions ol {
  padding-left: 20px;
  line-height: 1.6;
}

.usage-instructions li {
  margin-bottom: 8px;
  color: #666;
}

.qr-stats {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
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

.print-preview {
  text-align: center;
  padding: 20px;
}

.print-qr-code img {
  width: 200px;
  height: 200px;
  margin-bottom: 16px;
}

.print-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.print-info p {
  margin: 0;
  color: #666;
}

@media (max-width: 768px) {
  .qr-container {
    flex-direction: column;
    align-items: center;
  }
  
  .qr-code {
    margin-bottom: 20px;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
}
</style>