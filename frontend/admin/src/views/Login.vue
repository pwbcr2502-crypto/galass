<template>
  <div class="login-container">
    <div class="login-form">
      <h2 class="title">Anniversary Voting Admin</h2>
      <p class="subtitle">管理员登录</p>
      
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="tips">
        <p>默认账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const store = useStore()
    const router = useRouter()
    const loginForm = ref(null)
    const loading = ref(false)

    const form = reactive({
      username: 'admin',
      password: 'admin123'
    })

    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' }
      ]
    }

    const handleLogin = () => {
      loginForm.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          
          try {
            // Simple front-end validation for admin panel
            if (form.username === 'admin' && form.password === 'admin123') {
              // Set admin info in store
              await store.commit('auth/SET_TOKEN', 'admin-anniversary-2025-secret')
              await store.commit('auth/SET_USER_INFO', { username: 'admin', role: 'admin' })
              
              ElMessage.success('登录成功')
              router.push('/')
            } else {
              ElMessage.error('用户名或密码错误')
            }
          } catch (error) {
            console.error('Login error:', error)
            ElMessage.error('登录失败')
          } finally {
            loading.value = false
          }
        }
      })
    }

    return {
      loginForm,
      form,
      rules,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 32px;
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
  border-radius: 6px;
}

:deep(.el-button) {
  height: 44px;
  border-radius: 6px;
  font-size: 16px;
}

.tips {
  margin-top: 20px;
  text-align: center;
}

.tips p {
  color: #909399;
  font-size: 12px;
  margin: 4px 0;
}
</style>