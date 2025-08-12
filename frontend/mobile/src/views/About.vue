<template>
  <div class="about-page">
    <!-- 导航栏 -->
    <van-nav-bar 
      title="关于"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
      class="nav-bar"
    />
    
    <div class="page-content">
      <!-- Logo和标题 -->
      <div class="header-section card">
        <div class="logo-container">
          <div class="logo">🎉</div>
          <h2 class="app-title">年会投票系统</h2>
          <p class="app-subtitle">Company Anniversary Voting System</p>
          <van-tag type="primary" size="medium">v1.0.0</van-tag>
        </div>
      </div>
      
      <!-- 系统介绍 -->
      <div class="intro-section card">
        <div class="card-header">
          <h4>📖 系统介绍</h4>
        </div>
        <div class="intro-content">
          <p>
            年会投票系统是为公司周年庆晚会专门开发的实时投票平台。
            通过移动端友好的界面，让每位员工都能参与到节目评选中，
            确保投票过程的公平、公正和透明。
          </p>
          <div class="features-list">
            <div class="feature-item">
              <van-icon name="shield-o" color="#52c41a" />
              <span>安全可靠的身份验证</span>
            </div>
            <div class="feature-item">
              <van-icon name="star-o" color="#ff6b6b" />
              <span>五维度专业评分体系</span>
            </div>
            <div class="feature-item">
              <van-icon name="chart-trending-o" color="#4ecdc4" />
              <span>实时排名动态更新</span>
            </div>
            <div class="feature-item">
              <van-icon name="eye-o" color="#faad14" />
              <span>大屏展示炫酷效果</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 使用指南 -->
      <div class="guide-section card">
        <div class="card-header">
          <h4>📝 使用指南</h4>
        </div>
        <van-steps direction="vertical" active="99">
          <van-step>
            <div class="step-content">
              <h5>扫码登录</h5>
              <p>使用手机扫描现场二维码，输入您的工号完成登录</p>
            </div>
          </van-step>
          <van-step>
            <div class="step-content">
              <h5>等待投票</h5>
              <p>观看节目表演，等待投票窗口开启</p>
            </div>
          </van-step>
          <van-step>
            <div class="step-content">
              <h5>五维度评分</h5>
              <p>从台风、表演、人气、默契、创意五个维度给出1-5星评分</p>
            </div>
          </van-step>
          <van-step>
            <div class="step-content">
              <h5>提交投票</h5>
              <p>确认评分后提交，投票结果将实时更新到排行榜</p>
            </div>
          </van-step>
          <van-step>
            <div class="step-content">
              <h5>查看结果</h5>
              <p>在结果页面查看实时排名和最终获奖名单</p>
            </div>
          </van-step>
        </van-steps>
      </div>
      
      <!-- 评分说明 -->
      <div class="scoring-section card">
        <div class="card-header">
          <h4>⭐ 评分说明</h4>
        </div>
        <div class="scoring-content">
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-icon">🎭</span>
              <span class="dimension-name">台风表现 (20%)</span>
            </div>
            <p class="dimension-desc">舞台表现力、自信度、气场展现</p>
          </div>
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-icon">🎪</span>
              <span class="dimension-name">表演水平 (25%)</span>
            </div>
            <p class="dimension-desc">技巧水平、完成度、专业性展现</p>
          </div>
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-icon">❤️</span>
              <span class="dimension-name">人气指数 (20%)</span>
            </div>
            <p class="dimension-desc">观众喜爱度、互动响应程度</p>
          </div>
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-icon">🤝</span>
              <span class="dimension-name">团队默契 (15%)</span>
            </div>
            <p class="dimension-desc">团队配合度、协调性表现</p>
          </div>
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-icon">💡</span>
              <span class="dimension-name">创意创新 (20%)</span>
            </div>
            <p class="dimension-desc">创新性、独特性、惊喜程度</p>
          </div>
        </div>
      </div>
      
      <!-- 技术信息 -->
      <div class="tech-section card">
        <div class="card-header">
          <h4>🛠️ 技术信息</h4>
        </div>
        <div class="tech-content">
          <div class="tech-item">
            <span class="tech-label">前端技术</span>
            <span class="tech-value">Vue 3 + Vant UI</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">后端技术</span>
            <span class="tech-value">Node.js + Express</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">数据库</span>
            <span class="tech-value">PostgreSQL + Redis</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">实时通信</span>
            <span class="tech-value">WebSocket</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">设备支持</span>
            <span class="tech-value">iOS / Android / Web</span>
          </div>
        </div>
      </div>
      
      <!-- 联系信息 -->
      <div class="contact-section card">
        <div class="card-header">
          <h4>📞 技术支持</h4>
        </div>
        <div class="contact-content">
          <p>如遇到使用问题，请联系技术支持团队：</p>
          <div class="contact-item">
            <van-icon name="manager-o" color="#1890ff" />
            <span>技术支持：IT部门</span>
          </div>
          <div class="contact-item">
            <van-icon name="service-o" color="#52c41a" />
            <span>活动咨询：HR部门</span>
          </div>
        </div>
      </div>
      
      <!-- 版权信息 -->
      <div class="footer-section">
        <div class="copyright">
          <p>&copy; 2025 Company Anniversary Voting System</p>
          <p>版本 1.0.0 | 构建时间：2025-01-20</p>
          <p class="made-with">Made with ❤️ by Development Team</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background-color: #f7f9fc;
}

.nav-bar {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
}

:deep(.van-nav-bar__title),
:deep(.van-nav-bar__left),
:deep(.van-nav-bar .van-icon) {
  color: white;
}

.page-content {
  padding: 16px;
  padding-bottom: 40px;
}

.header-section {
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.logo-container {
  padding: 40px 20px;
}

.logo {
  font-size: 60px;
  margin-bottom: 16px;
}

.app-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.app-subtitle {
  margin: 0 0 16px 0;
  font-size: 14px;
  opacity: 0.8;
}

.intro-section,
.guide-section,
.scoring-section,
.tech-section,
.contact-section {
  margin-bottom: 16px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.intro-content {
  padding: 20px;
}

.intro-content p {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 14px;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-primary);
}

.step-content h5 {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: var(--text-primary);
}

.step-content p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.scoring-content {
  padding: 20px;
}

.dimension-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.dimension-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.dimension-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dimension-icon {
  font-size: 20px;
}

.dimension-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.dimension-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  padding-left: 28px;
}

.tech-content {
  padding: 20px;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.tech-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.tech-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.tech-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.contact-content {
  padding: 20px;
}

.contact-content p {
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-primary);
}

.contact-item:last-child {
  margin-bottom: 0;
}

.footer-section {
  margin-top: 24px;
  text-align: center;
}

.copyright p {
  margin: 4px 0;
  color: var(--text-light);
  font-size: 12px;
}

.made-with {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Vant组件样式覆盖 */
:deep(.van-steps--vertical .van-step__content) {
  padding-bottom: 20px;
}

:deep(.van-step__title) {
  font-size: 14px;
  color: var(--text-primary);
}

:deep(.van-step__circle) {
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  border-color: transparent;
}

:deep(.van-step--finish .van-step__circle) {
  background: #52c41a;
}

/* 响应式 */
@media (max-width: 375px) {
  .page-content {
    padding: 12px;
  }
  
  .logo-container {
    padding: 32px 16px;
  }
  
  .logo {
    font-size: 50px;
  }
  
  .app-title {
    font-size: 20px;
  }
  
  .intro-content,
  .scoring-content,
  .tech-content,
  .contact-content {
    padding: 16px;
  }
}
</style>