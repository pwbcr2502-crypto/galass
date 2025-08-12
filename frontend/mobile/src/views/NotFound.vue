<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <van-empty
        image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
        description="页面不存在"
        class="empty-state"
      >
        <div class="error-info">
          <h3>404 - 页面未找到</h3>
          <p>抱歉，您访问的页面不存在或已被移除。</p>
          <p class="error-path">请求路径：{{ $route.fullPath }}</p>
        </div>
        
        <div class="action-buttons">
          <van-button type="primary" @click="goHome">回到首页</van-button>
          <van-button type="default" @click="goBack">返回上页</van-button>
        </div>
      </van-empty>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.replace('/home')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/home')
  }
}
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  background-color: #f7f9fc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.empty-state {
  padding: 60px 20px;
}

.error-info {
  margin-bottom: 32px;
}

.error-info h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: var(--text-primary);
  text-align: center;
}

.error-info p {
  margin: 8px 0;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.5;
}

.error-path {
  font-size: 12px;
  color: var(--text-light);
  word-break: break-all;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 16px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.action-buttons .van-button {
  height: 44px;
  border-radius: 22px;
}
</style>