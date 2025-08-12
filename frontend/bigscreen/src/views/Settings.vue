<template>
  <div class="settings">
    <div class="settings-header">
      <h1>⚙️ 系统设置</h1>
    </div>

    <div class="settings-content">
      <!-- 基本设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3>📋 基本设置</h3>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <label>活动名称</label>
            <input v-model="settings.eventName" type="text" />
          </div>
          <div class="setting-item">
            <label>投票开始时间</label>
            <input v-model="settings.startTime" type="datetime-local" />
          </div>
          <div class="setting-item">
            <label>投票结束时间</label>
            <input v-model="settings.endTime" type="datetime-local" />
          </div>
          <div class="setting-item">
            <label>投票状态</label>
            <select v-model="settings.voteStatus">
              <option value="waiting">未开始</option>
              <option value="active">进行中</option>
              <option value="paused">已暂停</option>
              <option value="ended">已结束</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 显示设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3>🖥️ 显示设置</h3>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <label>自动刷新间隔 (秒)</label>
            <input v-model.number="settings.refreshInterval" type="number" min="1" max="60" />
          </div>
          <div class="setting-item">
            <label>显示QR码</label>
            <input v-model="settings.showQrCode" type="checkbox" />
          </div>
          <div class="setting-item">
            <label>显示实时排名</label>
            <input v-model="settings.showRealTimeRanking" type="checkbox" />
          </div>
          <div class="setting-item">
            <label>显示投票进度</label>
            <input v-model="settings.showProgress" type="checkbox" />
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3>🔒 安全设置</h3>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <label>管理员密码</label>
            <input v-model="settings.adminPassword" type="password" placeholder="留空表示不修改" />
          </div>
          <div class="setting-item">
            <label>API访问限制</label>
            <input v-model="settings.enableRateLimit" type="checkbox" />
            <span class="help-text">启用API调用频率限制</span>
          </div>
          <div class="setting-item">
            <label>IP白名单</label>
            <textarea v-model="settings.ipWhitelist" placeholder="每行一个IP地址，留空表示不限制"></textarea>
          </div>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="settings-section">
        <div class="section-header">
          <h3>📊 数据管理</h3>
        </div>
        <div class="setting-group">
          <div class="setting-item action-item">
            <label>数据导出</label>
            <div class="action-buttons">
              <button @click="exportData('excel')" class="btn btn-primary">
                📊 导出Excel
              </button>
              <button @click="exportData('csv')" class="btn btn-secondary">
                📄 导出CSV
              </button>
              <button @click="exportData('json')" class="btn btn-secondary">
                🔗 导出JSON
              </button>
            </div>
          </div>
          <div class="setting-item action-item">
            <label>数据备份</label>
            <div class="action-buttons">
              <button @click="backupData" class="btn btn-primary">
                💾 创建备份
              </button>
              <button @click="restoreData" class="btn btn-warning">
                🔄 恢复备份
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="settings-section">
        <div class="section-header">
          <h3>ℹ️ 系统信息</h3>
        </div>
        <div class="system-info">
          <div class="info-item">
            <span class="info-label">系统版本</span>
            <span class="info-value">{{ systemInfo.version }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">数据库状态</span>
            <span class="info-value" :class="systemInfo.dbStatus === 'connected' ? 'status-good' : 'status-error'">
              {{ systemInfo.dbStatus === 'connected' ? '已连接' : '连接失败' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">缓存状态</span>
            <span class="info-value" :class="systemInfo.cacheStatus === 'connected' ? 'status-good' : 'status-error'">
              {{ systemInfo.cacheStatus === 'connected' ? '已连接' : '连接失败' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">在线用户</span>
            <span class="info-value">{{ systemInfo.onlineUsers }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">服务器时间</span>
            <span class="info-value">{{ systemInfo.serverTime }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="settings-footer">
      <button @click="saveSettings" class="btn btn-primary btn-large" :disabled="isSaving">
        {{ isSaving ? '保存中...' : '💾 保存设置' }}
      </button>
      <button @click="resetSettings" class="btn btn-secondary btn-large">
        🔄 重置设置
      </button>
      <button @click="testConnection" class="btn btn-info btn-large">
        🔗 测试连接
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/index.js'

export default {
  name: 'Settings',
  setup() {
    const isSaving = ref(false)
    
    const settings = reactive({
      eventName: '2025年度周年庆典',
      startTime: '',
      endTime: '',
      voteStatus: 'waiting',
      refreshInterval: 5,
      showQrCode: true,
      showRealTimeRanking: true,
      showProgress: true,
      adminPassword: '',
      enableRateLimit: true,
      ipWhitelist: ''
    })

    const systemInfo = reactive({
      version: '1.0.0',
      dbStatus: 'connected',
      cacheStatus: 'connected',
      onlineUsers: 0,
      serverTime: ''
    })

    // 加载设置
    const loadSettings = async () => {
      try {
        const response = await api.getSystemSettings()
        if (response.success) {
          Object.assign(settings, response.data)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    // 加载系统信息
    const loadSystemInfo = async () => {
      try {
        const response = await api.getSystemInfo()
        if (response.success) {
          Object.assign(systemInfo, response.data)
        }
      } catch (error) {
        console.error('Failed to load system info:', error)
      }
    }

    // 更新服务器时间
    const updateServerTime = () => {
      systemInfo.serverTime = new Date().toLocaleString('zh-CN')
    }

    // 保存设置
    const saveSettings = async () => {
      try {
        isSaving.value = true
        const response = await api.updateSystemSettings(settings)
        if (response.success) {
          alert('设置保存成功！')
        } else {
          alert('保存失败：' + response.message)
        }
      } catch (error) {
        console.error('Failed to save settings:', error)
        alert('保存失败，请检查网络连接')
      } finally {
        isSaving.value = false
      }
    }

    // 重置设置
    const resetSettings = () => {
      if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
        Object.assign(settings, {
          eventName: '2025年度周年庆典',
          startTime: '',
          endTime: '',
          voteStatus: 'waiting',
          refreshInterval: 5,
          showQrCode: true,
          showRealTimeRanking: true,
          showProgress: true,
          adminPassword: '',
          enableRateLimit: true,
          ipWhitelist: ''
        })
        alert('设置已重置，请保存更改')
      }
    }

    // 测试连接
    const testConnection = async () => {
      try {
        const response = await api.testConnection()
        if (response.success) {
          alert('连接测试成功！所有服务正常运行。')
        } else {
          alert('连接测试失败：' + response.message)
        }
      } catch (error) {
        console.error('Connection test failed:', error)
        alert('连接测试失败，请检查服务器状态')
      }
    }

    // 导出数据
    const exportData = async (format) => {
      try {
        const response = await api.exportData(format)
        const blob = new Blob([response.data], { 
          type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                format === 'csv' ? 'text/csv' : 'application/json'
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `投票系统数据_${new Date().toLocaleDateString()}.${format === 'excel' ? 'xlsx' : format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Export failed:', error)
        alert('导出失败，请稍后重试')
      }
    }

    // 备份数据
    const backupData = async () => {
      if (confirm('确定要创建数据备份吗？')) {
        try {
          const response = await api.createBackup()
          if (response.success) {
            alert('备份创建成功！备份文件：' + response.filename)
          } else {
            alert('备份失败：' + response.message)
          }
        } catch (error) {
          console.error('Backup failed:', error)
          alert('备份失败，请检查服务器状态')
        }
      }
    }

    // 恢复数据
    const restoreData = () => {
      if (confirm('确定要恢复数据备份吗？这将覆盖当前所有数据！')) {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.sql,.json'
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (file) {
            try {
              const formData = new FormData()
              formData.append('backup', file)
              const response = await api.restoreBackup(formData)
              if (response.success) {
                alert('数据恢复成功！页面将刷新。')
                location.reload()
              } else {
                alert('恢复失败：' + response.message)
              }
            } catch (error) {
              console.error('Restore failed:', error)
              alert('恢复失败，请检查文件格式')
            }
          }
        }
        input.click()
      }
    }

    onMounted(() => {
      loadSettings()
      loadSystemInfo()
      updateServerTime()
      
      // 每秒更新服务器时间
      setInterval(updateServerTime, 1000)
    })

    return {
      isSaving,
      settings,
      systemInfo,
      saveSettings,
      resetSettings,
      testConnection,
      exportData,
      backupData,
      restoreData
    }
  }
}
</script>

<style scoped>
.settings {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
}

.settings-header {
  text-align: center;
  margin-bottom: 30px;
}

.settings-header h1 {
  color: #333;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  background: white;
  margin-bottom: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.setting-group {
  padding: 20px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.setting-item input,
.setting-item select,
.setting-item textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.setting-item input:focus,
.setting-item select:focus,
.setting-item textarea:focus {
  outline: none;
  border-color: #667eea;
}

.setting-item input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.setting-item textarea {
  resize: vertical;
  min-height: 80px;
}

.help-text {
  color: #666;
  font-size: 0.9rem;
  margin-left: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.system-info {
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: bold;
  color: #333;
}

.info-value {
  color: #666;
}

.status-good {
  color: #4CAF50;
  font-weight: bold;
}

.status-error {
  color: #F44336;
  font-weight: bold;
}

.settings-footer {
  max-width: 800px;
  margin: 30px auto 0;
  text-align: center;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-large {
  padding: 15px 30px;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .settings {
    padding: 10px;
  }
  
  .settings-header h1 {
    font-size: 2rem;
  }
  
  .action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .settings-footer {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-large {
    width: 100%;
  }
}
</style>