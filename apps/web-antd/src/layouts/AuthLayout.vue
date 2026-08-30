<script lang="ts" setup>
import { computed } from 'vue';

import { Card } from 'ant-design-vue';

import { usePreferencesStore } from '#/stores/preferences';

const preferencesStore = usePreferencesStore();

/** 应用名称 */
const appName = computed(() => preferencesStore.app.name);
</script>

<template>
  <div class="auth-layout">
    <!-- 背景装饰 -->
    <div class="auth-background">
      <div class="bg-shape bg-shape-1" />
      <div class="bg-shape bg-shape-2" />
      <div class="bg-shape bg-shape-3" />
    </div>

    <!-- 内容区 -->
    <div class="auth-content">
      <!-- Logo & 标题 -->
      <div class="auth-header">
        <div class="auth-logo">诗</div>
        <h1 class="auth-title">{{ appName }}</h1>
        <p class="auth-subtitle">晓诗 · 后台管理系统</p>
      </div>

      <!-- 卡片 -->
      <Card class="auth-card" :bordered="false">
        <RouterView />
      </Card>

      <!-- 底部 -->
      <div class="auth-footer">
        <p>© 2026 {{ appName }} · 版权所有</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.bg-shape-1 {
  top: -10%;
  right: -5%;
  width: 400px;
  height: 400px;
}

.bg-shape-2 {
  bottom: -15%;
  left: -10%;
  width: 500px;
  height: 500px;
}

.bg-shape-3 {
  top: 40%;
  left: 30%;
  width: 200px;
  height: 200px;
}

.auth-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}

.auth-header {
  margin-bottom: 32px;
  text-align: center;
  color: #fff;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  font-size: 28px;
  font-weight: 700;
  color: #764ba2;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.auth-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #fff;
}

.auth-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
}

.auth-card {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.auth-card :deep(.ant-card-body) {
  padding: 32px;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}
</style>
