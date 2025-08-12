<template>
  <div class="login-page premium-red-bg compact-aware">
    <!-- Ultra Premium Animated Background -->
    <div class="animated-bg">
      <div class="particle" v-for="i in 20" :key="i"></div>
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>
    
    <div class="login-container">
      <!-- Premium Header with Animation -->
      <div class="header float-animation">
        <div class="logo-wrapper">
          <div class="logo-glow"></div>
          <div class="logo-icon pulse-red">🎊</div>
        </div>
        <h1 class="title gradient-text-red">年会投票系统</h1>
        <p class="subtitle shimmer">Company Anniversary Voting System</p>
      </div>
      
      <!-- Premium Glassmorphism Form -->
      <div class="form-container glass form-red-theme">
        <div class="form-glow"></div>
        <form @submit.prevent="handleLogin" ref="formRef">
          <!-- Ultra Premium Input with Magnetic Effect -->
          <div class="premium-input-group magnetic" :class="{ 'has-content': form.eventCode, 'success': form.eventCode?.length >= 3 && eventInfo, 'error': eventCodeError }">
            <div class="input-backdrop"></div>
            <input
              v-model="form.eventCode"
              name="eventCode"
              class="premium-input"
              placeholder=" "
              @blur="handleEventCodeBlur"
              @input="handleEventCodeInput"
              @focus="handleInputFocus('eventCode')"
              maxlength="32"
              autocomplete="off"
            />
            <label class="premium-label">活动码 Event Code</label>
            <div class="premium-icon float-animation">🎯</div>
            <div class="input-highlight"></div>
            <transition name="fade-slide">
              <div v-if="eventInfo" class="success-badge">
                <span class="badge-icon">✨</span>
                {{ eventInfo.name }}
              </div>
            </transition>
            <transition name="shake">
              <div v-if="eventCodeError" class="error-message glass-dark">{{ eventCodeError }}</div>
            </transition>
          </div>

          <div class="premium-input-group magnetic" :class="{ 'has-content': form.empNo, 'success': form.empNo?.length >= 3, 'disabled': !form.eventCode, 'error': empNoError }">
            <div class="input-backdrop"></div>
            <input
              v-model="form.empNo"
              name="empNo"
              class="premium-input"
              placeholder=" "
              :disabled="!form.eventCode"
              @focus="handleInputFocus('empNo')"
              maxlength="32"
              autocomplete="off"
            />
            <label class="premium-label">工号 Employee ID</label>
            <div class="premium-icon float-animation" style="animation-delay: 0.5s">👤</div>
            <div class="input-highlight"></div>
            <transition name="shake">
              <div v-if="empNoError" class="error-message glass-dark">{{ empNoError }}</div>
            </transition>
          </div>
          
          <!-- Ultra Premium Login Button -->
          <div class="button-container">
            <button
              type="submit"
              class="premium-button btn-premium btn-red-gradient touch-enhanced"
              :disabled="!canSubmit || loading"
              @mouseenter="handleButtonHover"
              @mouseleave="handleButtonLeave"
            >
              <span class="button-bg"></span>
              <span class="button-content">
                <transition name="fade" mode="out-in">
                  <van-loading v-if="loading" size="20px" color="white" key="loading" />
                  <span v-else key="text" class="button-text">
                    <span class="text-main">立即登录</span>
                    <span class="text-hover">Let's Go! 🚀</span>
                  </span>
                </transition>
              </span>
              <span class="button-glow"></span>
            </button>
          </div>
        </form>
        
        <!-- Premium Features Showcase -->
        <div class="features-row">
          <div class="feature-badge glass">
            <span class="badge-icon">🔐</span>
            <span class="badge-text">安全登录</span>
          </div>
          <div class="feature-badge glass">
            <span class="badge-icon">⚡</span>
            <span class="badge-text">快速投票</span>
          </div>
          <div class="feature-badge glass">
            <span class="badge-icon">🏆</span>
            <span class="badge-text">实时结果</span>
          </div>
        </div>
      </div>
      
      <!-- Premium Help Section -->
      <div class="help-section glass">
        <h4 class="help-title gradient-text-red">需要帮助？</h4>
        <van-collapse v-model="helpActiveNames" class="premium-collapse">
          <van-collapse-item name="1">
            <template #title>
              <div class="collapse-title">
                <span class="collapse-icon">🎫</span>
                <span>如何获取活动码？</span>
              </div>
            </template>
            <div class="collapse-content">
              <p>请联系活动组织者获取活动码，通常会在年会现场公布或通过公司内部通知。</p>
              <div class="tip-box glass">
                <span class="tip-icon">💡</span>
                <span>提示：活动码通常为大写字母和数字组合</span>
              </div>
            </div>
          </van-collapse-item>
          <van-collapse-item name="2">
            <template #title>
              <div class="collapse-title">
                <span class="collapse-icon">🆔</span>
                <span>忘记工号？</span>
              </div>
            </template>
            <div class="collapse-content">
              <p>请使用您在公司系统中的员工工号，如有疑问请联系HR部门。</p>
            </div>
          </van-collapse-item>
          <van-collapse-item name="3">
            <template #title>
              <div class="collapse-title">
                <span class="collapse-icon">🛠️</span>
                <span>遇到技术问题？</span>
              </div>
            </template>
            <div class="collapse-content">
              <p>如遇到登录问题，请检查网络连接或联系技术支持。</p>
              <p class="support-info">技术支持：IT部门</p>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>
    </div>
    
    <!-- Premium Footer -->
    <div class="footer glass">
      <p class="copyright">&copy; 2025 Company Anniversary Voting System</p>
      <p class="version">Version 2.0 Premium</p>
      <div class="footer-decoration"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const helpActiveNames = ref([])
const eventInfo = ref(null)
const formRef = ref(null)

// 表单数据
const form = reactive({
  eventCode: '',
  empNo: ''
})

// 错误信息
const eventCodeError = ref('')
const empNoError = ref('')

// 计算属性
const canSubmit = computed(() => {
  return form.eventCode.length >= 3 && 
         form.empNo.length >= 3 && 
         !loading.value &&
         !eventCodeError.value &&
         !empNoError.value
})

// 处理活动码输入
const handleEventCodeInput = () => {
  eventCodeError.value = ''
  eventInfo.value = null
  
  // 自动转换为大写
  form.eventCode = form.eventCode.toUpperCase()
  
  // 实时验证格式
  if (form.eventCode && !/^[A-Z0-9]*$/.test(form.eventCode)) {
    eventCodeError.value = '活动码只能包含大写字母和数字'
  }
}

// 处理活动码失焦事件
const handleEventCodeBlur = async () => {
  if (!form.eventCode) {
    eventCodeError.value = '请输入活动码'
    return
  }
  
  if (form.eventCode.length < 3) {
    eventCodeError.value = '活动码长度不能少于3位'
    return
  }
  
  if (!/^[A-Z0-9]+$/.test(form.eventCode)) {
    eventCodeError.value = '活动码只能包含大写字母和数字'
    return
  }
  
  // 验证活动码
  try {
    // 这里应该调用API验证活动码，现在模拟
    if (form.eventCode === 'ANNIV2025') {
      eventInfo.value = {
        name: '公司年会投票活动',
        status: 1
      }
      eventCodeError.value = ''
    } else {
      eventCodeError.value = '活动码不存在或已过期'
      eventInfo.value = null
    }
  } catch (error) {
    eventCodeError.value = '验证活动码失败，请重试'
    eventInfo.value = null
  }
}

// 处理登录
const handleLogin = async () => {
  // 清除之前的错误
  eventCodeError.value = ''
  empNoError.value = ''
  
  // 表单验证
  if (!validateForm()) {
    return
  }
  
  try {
    loading.value = true
    console.log('开始登录...', { eventCode: form.eventCode, empNo: form.empNo })
    
    const result = await authStore.login(form.eventCode, form.empNo)
    console.log('登录结果:', result)
    
    if (result.success) {
      // 保存表单数据到localStorage
      saveFormData()
      
      console.log('登录成功，准备跳转...')
      
      // 触发庆祝动画
      createConfetti()
      
      showSuccessToast({
        message: '登录成功！',
        duration: 1000
      })
      
      // 立即跳转，不需要延迟
      const redirectPath = route.query.redirect || '/home'
      console.log('跳转到:', redirectPath)
      await router.push(redirectPath)
      
    } else {
      console.error('登录失败:', result.message)
      // 根据错误类型显示不同的错误信息
      if (result.message && result.message.includes('活动码')) {
        eventCodeError.value = result.message
      } else if (result.message && result.message.includes('工号')) {
        empNoError.value = result.message
      } else {
        showToast({
          type: 'fail',
          message: result.message || '登录失败',
          duration: 3000
        })
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    showToast({
      type: 'fail',
      message: '登录失败，请检查网络连接',
      duration: 3000
    })
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateForm = () => {
  let isValid = true
  
  if (!form.eventCode) {
    eventCodeError.value = '请输入活动码'
    isValid = false
  } else if (form.eventCode.length < 3) {
    eventCodeError.value = '活动码长度不能少于3位'
    isValid = false
  } else if (!/^[A-Z0-9]+$/.test(form.eventCode)) {
    eventCodeError.value = '活动码只能包含大写字母和数字'
    isValid = false
  }
  
  if (!form.empNo) {
    empNoError.value = '请输入工号'
    isValid = false
  } else if (form.empNo.length < 3) {
    empNoError.value = '工号长度不能少于3位'
    isValid = false
  }
  
  return isValid
}

// 组件挂载时的处理
onMounted(() => {
  // 如果URL中有活动码参数，自动填充
  const eventCode = route.query.event
  if (eventCode) {
    form.eventCode = eventCode.toUpperCase()
    handleEventCodeBlur()
  }
  
  // 从localStorage中恢复表单数据（如果有）
  const savedEventCode = localStorage.getItem('lastEventCode')
  const savedEmpNo = localStorage.getItem('lastEmpNo')
  
  if (savedEventCode && !form.eventCode) {
    form.eventCode = savedEventCode
    handleEventCodeBlur()
  }
  
  if (savedEmpNo && !form.empNo) {
    form.empNo = savedEmpNo
  }
})

// 在登录成功后保存表单数据
const saveFormData = () => {
  localStorage.setItem('lastEventCode', form.eventCode)
  localStorage.setItem('lastEmpNo', form.empNo)
}

// 处理输入框聚焦
const handleInputFocus = (field) => {
  // 添加聚焦动画效果
  const input = document.querySelector(`[name="${field}"]`)
  if (input) {
    input.parentElement.classList.add('focused')
  }
}

// 处理按钮悬停
const handleButtonHover = (event) => {
  const button = event.currentTarget
  button.classList.add('hover')
}

// 处理按钮离开
const handleButtonLeave = (event) => {
  const button = event.currentTarget
  button.classList.remove('hover')
}

// 创建庆祝动画
const createConfetti = () => {
  const colors = ['#D32F2F', '#FF5252', '#FFD700', '#FF6B6B', '#FFC107']
  const confettiCount = 50
  
  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div')
      confetti.className = 'confetti'
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.animationDelay = Math.random() * 3 + 's'
      confetti.style.animationDuration = Math.random() * 3 + 3 + 's'
      document.body.appendChild(confetti)
      
      setTimeout(() => confetti.remove(), 6000)
    }, i * 30)
  }
}
</script>

<style scoped>
/* 🎨 Ultra Premium Login Design System */

  .login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%);
  position: relative;
  overflow: hidden;
}

  /* 矮屏和横屏下的精简布局 */
  @media screen and (max-height: 640px), screen and (orientation: landscape) {
    .login-container { padding: var(--spacing-xl) var(--spacing-lg); }
    .header { margin-bottom: var(--spacing-2xl); }
    .logo-icon { font-size: 3rem; }
    .title { font-size: 1.75rem; }
    .subtitle { font-size: 0.9rem; }
    .form-container { padding: var(--spacing-xl); margin-bottom: var(--spacing-2xl); }
    .premium-input { height: 56px; font-size: 16px; padding: 20px 48px 8px 16px; }
    .premium-button { height: 52px; font-size: 16px; }
    .features-row { display: none; }
  }

/* Animated Background */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--accent-red);
  border-radius: 50%;
  opacity: 0.6;
  animation: float-particle 20s infinite linear;
}

.particle:nth-child(even) {
  background: var(--accent-color);
  animation-duration: 25s;
}

.particle:nth-child(3n) {
  background: var(--text-white);
  animation-duration: 30s;
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) translateX(100px) scale(1.5);
    opacity: 0;
  }
}

.particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { left: 20%; animation-delay: 2s; }
.particle:nth-child(3) { left: 30%; animation-delay: 4s; }
.particle:nth-child(4) { left: 40%; animation-delay: 6s; }
.particle:nth-child(5) { left: 50%; animation-delay: 8s; }
.particle:nth-child(6) { left: 60%; animation-delay: 10s; }
.particle:nth-child(7) { left: 70%; animation-delay: 12s; }
.particle:nth-child(8) { left: 80%; animation-delay: 14s; }
.particle:nth-child(9) { left: 90%; animation-delay: 16s; }
.particle:nth-child(10) { left: 15%; animation-delay: 18s; }
.particle:nth-child(11) { left: 25%; animation-delay: 1s; }
.particle:nth-child(12) { left: 35%; animation-delay: 3s; }
.particle:nth-child(13) { left: 45%; animation-delay: 5s; }
.particle:nth-child(14) { left: 55%; animation-delay: 7s; }
.particle:nth-child(15) { left: 65%; animation-delay: 9s; }
.particle:nth-child(16) { left: 75%; animation-delay: 11s; }
.particle:nth-child(17) { left: 85%; animation-delay: 13s; }
.particle:nth-child(18) { left: 95%; animation-delay: 15s; }
.particle:nth-child(19) { left: 5%; animation-delay: 17s; }
.particle:nth-child(20) { left: 50%; animation-delay: 19s; }

/* Gradient Orbs */
.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.4;
  animation: orb-float 20s infinite ease-in-out;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--hero-red) 0%, transparent 70%);
  top: -200px;
  left: -200px;
  animation-duration: 25s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--accent-red) 0%, transparent 70%);
  bottom: -150px;
  right: -150px;
  animation-duration: 30s;
  animation-delay: -10s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, var(--accent-color) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 35s;
  animation-delay: -20s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(100px, -100px) scale(1.1);
  }
  66% {
    transform: translate(-100px, 100px) scale(0.9);
  }
}

.login-container {
  min-height: 100vh;
  padding: var(--spacing-2xl) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 440px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 10;
}

/* Premium Header */
.header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
  position: relative;
  animation: fadeInDown 1s ease-out;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: var(--spacing-2xl);
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, var(--accent-red) 0%, transparent 70%);
  filter: blur(30px);
  opacity: 0.6;
  animation: pulse-glow 3s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.3;
  }
}

.logo-icon {
  font-size: clamp(40px, 12vw, 64px);
  position: relative;
  z-index: 1;
  display: inline-block;
}

.title {
  font-size: clamp(22px, 6.2vw, 32px);
  font-weight: 800;
  margin: 0 0 var(--spacing-md) 0;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.subtitle {
  font-size: clamp(12px, 3.4vw, 16px);
  font-weight: 400;
  opacity: 0.8;
  margin: 0;
  position: relative;
  display: inline-block;
  padding: 0 var(--spacing-xl);
}

/* Glassmorphism Form Container */
.form-container {
  margin-bottom: var(--spacing-3xl);
  position: relative;
  padding: var(--spacing-3xl);
  border-radius: var(--radius-2xl);
  animation: fadeInUp 1s ease-out 0.3s both;
}

.form-glow {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100px;
  background: radial-gradient(ellipse at center, var(--hero-red) 0%, transparent 70%);
  filter: blur(60px);
  opacity: 0.3;
  pointer-events: none;
}

/* Premium Input Groups */
.premium-input-group {
  position: relative;
  margin-bottom: var(--spacing-2xl);
  transition: all var(--transition-base);
}

.premium-input-group.magnetic {
  transform-style: preserve-3d;
  perspective: 1000px;
}

.input-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base);
}

.premium-input-group:hover .input-backdrop {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.premium-input-group.focused .input-backdrop {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent-red);
  box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.1);
}

.premium-input {
  position: relative;
  width: 100%;
  height: 70px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-white);
  padding: 28px 60px 12px 20px;
  z-index: 2;
  transition: all var(--transition-base);
}

.premium-label {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  transition: all var(--transition-base);
  z-index: 1;
}

.premium-input:focus + .premium-label,
.premium-input-group.has-content .premium-label {
  top: 18px;
  font-size: 12px;
  color: var(--accent-red);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.premium-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  z-index: 3;
  transition: all var(--transition-base);
}

.input-highlight {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transition: transform var(--transition-base);
  border-radius: 2px;
}

.premium-input:focus ~ .input-highlight {
  transform: scaleX(1);
}

/* Success & Error States */
.success-badge {
  position: absolute;
  top: -10px;
  right: 10px;
  background: var(--gradient-primary);
  color: var(--text-white);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: var(--shadow-md);
  z-index: 4;
}

.badge-icon {
  font-size: 14px;
}

.error-message {
  position: absolute;
  bottom: -24px;
  left: 0;
  right: 0;
  font-size: 12px;
  color: var(--text-white);
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-weight: 500;
}

.premium-input-group.error .input-backdrop {
  border-color: var(--error-color);
  background: rgba(244, 67, 54, 0.05);
}

.premium-input-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Premium Button */
.button-container {
  margin-top: var(--spacing-3xl);
  position: relative;
}

.premium-button {
  position: relative;
  width: 100%;
  height: 64px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-full);
  overflow: hidden;
  transition: all var(--transition-base);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.button-bg {
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
  transition: all var(--transition-slow);
  z-index: 1;
}

.premium-button:hover .button-bg {
  transform: scale(1.05);
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-white);
}

.button-text {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-main {
  display: block;
  transition: all var(--transition-base);
}

.text-hover {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  transition: all var(--transition-base);
}

.premium-button:hover .text-main {
  transform: translateY(-100%);
  opacity: 0;
}

.premium-button:hover .text-hover {
  transform: translateX(-50%) translateY(-100%);
}

.button-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-slow);
  pointer-events: none;
  z-index: 3;
}

.premium-button:hover .button-glow {
  opacity: 1;
}

.premium-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.premium-button:disabled:hover .button-bg {
  transform: none;
}

/* Features Row */
.features-row {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-2xl);
  animation: fadeIn 1s ease-out 0.6s both;
}

.feature-badge {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}

.feature-badge:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1) !important;
}

.badge-icon {
  font-size: 20px;
}

.badge-text {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

/* Help Section */
.help-section {
  margin-top: var(--spacing-3xl);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-xl);
  position: relative;
  animation: fadeInUp 1s ease-out 0.9s both;
}

.help-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-xl) 0;
  text-align: center;
}

.premium-collapse {
  background: transparent !important;
}

:deep(.van-collapse-item) {
  margin-bottom: var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
}

:deep(.van-collapse-item__title) {
  padding: var(--spacing-lg) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
}

:deep(.van-collapse-item__content) {
  background: rgba(0, 0, 0, 0.2);
  padding: var(--spacing-lg) !important;
  color: rgba(255, 255, 255, 0.7);
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.collapse-icon {
  font-size: 20px;
}

.collapse-content p {
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.6;
}

.tip-box {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 14px;
}

.tip-icon {
  font-size: 16px;
}

.support-info {
  font-weight: 600;
  color: var(--accent-color);
}

/* Premium Footer */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-xl);
  text-align: center;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.3);
}

.copyright, .version {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.version {
  margin-top: var(--spacing-xs);
  color: var(--accent-color);
}

.footer-decoration {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  opacity: 0.3;
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all var(--transition-base);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.shake-enter-active {
  animation: shake 0.3s;
}

/* Responsive Design */
@media (max-width: 375px) {
  .login-container {
    padding: var(--spacing-lg);
  }
  
  .header {
    margin-bottom: var(--spacing-3xl);
  }
  
  .logo-icon {
    font-size: 3.5rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .form-container {
    padding: var(--spacing-2xl);
  }
  
  .premium-input {
    height: 60px;
    font-size: var(--fs-base);
    padding: 24px 50px 8px 16px;
  }
  
  .premium-button {
    height: 56px;
    font-size: var(--fs-lg);
  }
  
  .features-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .feature-badge {
    flex-direction: row;
    justify-content: center;
  }
  
  .help-section {
    padding: var(--spacing-xl);
  }
}

@media (min-width: 768px) {
  .login-container {
    max-width: 480px;
  }
  
  .header {
    margin-bottom: var(--spacing-5xl);
  }
  
  .logo-icon {
    font-size: 6rem;
  }
  
  .title {
    font-size: 3rem;
  }
  
  .subtitle {
    font-size: 1.25rem;
  }
  
  .gradient-orb {
    filter: blur(60px);
  }
  
  .orb-1 {
    width: 500px;
    height: 500px;
  }
  
  .orb-2 {
    width: 400px;
    height: 400px;
  }
  
  .premium-button {
    height: 72px;
    font-size: 20px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: light) {
  .login-page {
    background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  }
  
  .premium-input {
    color: var(--text-primary);
  }
  
  .premium-label {
    color: rgba(0, 0, 0, 0.6);
  }
  
  .input-backdrop {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(211, 47, 47, 0.2);
  }
}
</style>