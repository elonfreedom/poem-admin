<script lang="ts" setup >
import { computed } from 'vue';

import { usePreferencesStore } from '#/stores/preferences';

import { MoonIcon, SunIcon } from '@lucide/vue';

const preferencesStore = usePreferencesStore();

/** 应用名称 */
const appName = computed(() => preferencesStore.app.name);

/** 当前是否为暗色模式 */
const isDark = computed(() => preferencesStore.currentTheme === 'dark');

/** 切换主题 */
function toggleTheme() {
  preferencesStore.toggleDarkMode();
}
</script>

<template>
  <div class="auth-layout">
    <!-- ===== 水墨背景（全铺） ===== -->
    <div class="auth-bg">
      <svg
        class="bg-svg"
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <filter id="ink-blur">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="4"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="30"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="mist-blur">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <!-- 亮色模式山水渐变 -->
          <linearGradient id="mountain-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="grad-far-1" />
            <stop offset="100%" class="grad-far-2" />
          </linearGradient>
          <linearGradient id="mountain-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="grad-mid-1" />
            <stop offset="100%" class="grad-mid-2" />
          </linearGradient>
          <linearGradient id="mountain-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="grad-near-1" />
            <stop offset="100%" class="grad-near-2" />
          </linearGradient>
        </defs>

        <!-- 远山 -->
        <g class="mountain-far" filter="url(#ink-blur)">
          <path
            d="M0 600 Q100 480 200 520 Q350 420 450 500 Q550 400 650 480 Q750 420 800 460 L800 1000 L0 1000 Z"
            fill="url(#mountain-far)"
          />
        </g>

        <!-- 中山 -->
        <g class="mountain-mid" filter="url(#ink-blur)">
          <path
            d="M0 680 Q150 560 300 620 Q400 540 500 600 Q600 520 700 580 Q780 540 800 560 L800 1000 L0 1000 Z"
            fill="url(#mountain-mid)"
          />
        </g>

        <!-- 近山 -->
        <g class="mountain-near" filter="url(#ink-blur)">
          <path
            d="M0 760 Q120 680 250 740 Q380 660 500 720 Q620 640 750 700 Q800 680 800 700 L800 1000 L0 1000 Z"
            fill="url(#mountain-near)"
          />
        </g>

        <!-- 雾带 -->
        <ellipse
          cx="400"
          cy="650"
          rx="500"
          ry="80"
          class="mist"
          filter="url(#mist-blur)"
        />
        <ellipse
          cx="300"
          cy="720"
          rx="400"
          ry="60"
          class="mist"
          filter="url(#mist-blur)"
        />

        <!-- 明月 -->
        <circle cx="620" cy="180" r="45" class="moon" />
        <circle cx="620" cy="180" r="35" class="moon-inner" />

        <!-- 孤鸟 -->
        <path
          d="M200 280 Q210 270 220 280 Q230 270 240 280"
          class="bird"
          stroke-width="1.5"
          fill="none"
        />
      </svg>

      <!-- 渐变遮罩 -->
      <div class="bg-overlay" />
    </div>

    <!-- ===== 主题切换按钮 ===== -->
    <button
      class="theme-toggle"
      :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
      @click="toggleTheme"
    >
      <SunIcon v-if="isDark" class="toggle-icon" />
      <MoonIcon v-else class="toggle-icon" />
    </button>

    <!-- ===== 内容层 ===== -->
    <div class="auth-content">
      <!-- 左侧：品牌信息 -->
      <div class="auth-brand">
        <!-- 印章 Logo -->
        <div class="seal auth-anim-up">诗</div>

        <!-- 底部品牌文字 -->
        <div class="brand-bottom auth-anim-up-d2">
          <h2 class="brand-title">{{ appName }}</h2>
          <p class="brand-subtitle">传承千年诗韵 · 匠心内容管理</p>
        </div>
      </div>

      <!-- 中央：竖排诗句 -->
      <div class="brand-poem-wrap auth-anim-fade">
        <div class="brand-poem">
          千山鸟飞绝万径人踪灭孤舟蓑笠翁独钓寒江雪
        </div>
      </div>

      <!-- 右侧：表单卡片 -->
      <div class="auth-card-wrapper">
        <div class="auth-card auth-anim-up-d1">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* ===== 水墨背景 ===== */
.auth-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #f7f3eb 0%, #ede8dc 100%);
  transition: background 0.3s ease;
}

.dark .auth-bg {
  background: linear-gradient(160deg, #1a1714 0%, #0f0d0b 100%);
}

.bg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 亮色模式山水颜色 */
.mountain-far { opacity: 0.5; }
.mountain-mid { opacity: 0.7; }
.mountain-near { opacity: 0.9; }

.grad-far-1 { stop-color: oklch(0.7 0.02 60 / 0.3); }
.grad-far-2 { stop-color: oklch(0.6 0.02 60 / 0.5); }
.grad-mid-1 { stop-color: oklch(0.55 0.02 60 / 0.5); }
.grad-mid-2 { stop-color: oklch(0.45 0.02 60 / 0.7); }
.grad-near-1 { stop-color: oklch(0.4 0.02 60 / 0.7); }
.grad-near-2 { stop-color: oklch(0.3 0.02 60 / 0.9); }

/* 暗色模式山水颜色 */
.dark .mountain-far { opacity: 0.6; }
.dark .mountain-mid { opacity: 0.8; }
.dark .mountain-near { opacity: 1; }

.dark .grad-far-1 { stop-color: oklch(0.35 0.02 60 / 0.4); }
.dark .grad-far-2 { stop-color: oklch(0.28 0.02 60 / 0.6); }
.dark .grad-mid-1 { stop-color: oklch(0.25 0.02 60 / 0.6); }
.dark .grad-mid-2 { stop-color: oklch(0.18 0.02 60 / 0.8); }
.dark .grad-near-1 { stop-color: oklch(0.15 0.02 60 / 0.8); }
.dark .grad-near-2 { stop-color: oklch(0.1 0.02 60 / 1); }

/* 云雾 */
.mist {
  fill: oklch(0.98 0.01 80 / 0.06);
}

.dark .mist {
  fill: oklch(0.95 0.01 80 / 0.04);
}

/* 明月 */
.moon {
  fill: oklch(0.85 0.05 80 / 0.12);
}

.moon-inner {
  fill: oklch(0.85 0.05 80 / 0.18);
}

.dark .moon {
  fill: oklch(0.95 0.01 80 / 0.08);
}

.dark .moon-inner {
  fill: oklch(0.95 0.01 80 / 0.12);
}

/* 飞鸟 */
.bird {
  stroke: oklch(0.85 0.01 80 / 0.25);
}

.dark .bird {
  stroke: oklch(0.95 0.01 80 / 0.2);
}

/* 渐变遮罩 */
.bg-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 25% 60%, transparent 0%, rgba(247, 243, 235, 0.6) 65%);
}

.dark .bg-overlay {
  background: radial-gradient(ellipse at 25% 60%, transparent 0%, oklch(0.12 0.01 60 / 0.7) 65%);
}

/* ===== 主题切换按钮 ===== */
.theme-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--auth-bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--auth-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--auth-fg-secondary);
  transition: all 0.2s ease;
  box-shadow: var(--auth-shadow-card);
}

.theme-toggle:hover {
  color: var(--auth-fg-primary);
  border-color: var(--auth-border-focus);
  transform: scale(1.05);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.toggle-icon {
  width: 16px;
  height: 16px;
}

/* ===== 内容层 ===== */
.auth-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 48px 64px;
  gap: 40px;
}

/* ===== 左侧品牌区 ===== */
.auth-brand {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 96px);
  padding: 48px 0;
  color: var(--auth-fg-primary);
  min-width: 0;
}

/* 印章 */
.seal {
  width: 56px;
  height: 56px;
  background: var(--auth-accent);
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--auth-accent-fg);
  box-shadow: 0 4px 20px oklch(from var(--auth-accent) l c h / 0.4);
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.seal::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1.5px solid oklch(0.98 0.005 80 / 0.3);
  border-radius: 3px;
}

.brand-bottom {
  max-width: 320px;
}

.brand-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.15em;
  margin-bottom: 12px;
}

.brand-subtitle {
  font-size: 13px;
  color: var(--auth-fg-muted);
  letter-spacing: 0.08em;
  line-height: 1.8;
}

/* ===== 竖排诗句 ===== */
.brand-poem-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-poem {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  letter-spacing: 0.6em;
  line-height: 2.2;
  color: var(--auth-fg-secondary);
  opacity: 0.7;
  max-height: 60vh;
}

/* ===== 右侧表单卡片 ===== */
.auth-card-wrapper {
  flex-shrink: 0;
  width: 380px;
}

.auth-card {
  background: var(--auth-bg-card);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border-radius: 8px;
  padding: 44px 36px;
  border: 1px solid var(--auth-border);
  box-shadow: var(--auth-shadow-card);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* ===== 动画 ===== */
@keyframes authFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes authFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.auth-anim-up {
  animation: authFadeUp 0.6s ease-out both;
}

.auth-anim-up-d1 {
  animation: authFadeUp 0.6s ease-out 0.1s both;
}

.auth-anim-up-d2 {
  animation: authFadeUp 0.6s ease-out 0.2s both;
}

.auth-anim-fade {
  animation: authFadeIn 1s ease-out 0.3s both;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .brand-poem-wrap {
    display: none;
  }
}

@media (max-width: 900px) {
  .auth-content {
    flex-direction: column;
    justify-content: center;
    padding: 32px 24px;
    gap: 24px;
  }

  .auth-brand {
    flex-direction: column;
    align-items: center;
    gap: 24px;
    height: auto;
    padding: 24px 0 0;
    text-align: center;
  }

  .brand-bottom {
    max-width: none;
  }

  .brand-title {
    font-size: 24px;
  }

  .auth-card-wrapper {
    width: 100%;
    max-width: 380px;
  }

  .auth-card {
    padding: 36px 28px;
  }

  .theme-toggle {
    top: 16px;
    right: 16px;
  }
}
</style>
