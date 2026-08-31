# 主题适配

> 亮色如宣纸作画，暗色如碑帖拓印，双模式统一品牌

---

## 1. 主题模式

| 模式 | 说明 |
|------|------|
| `light` | 亮色模式 — 暖白基底，水墨山水 |
| `dark` | 暗色模式 — 墨黑基底，深墨山水 |
| `system` | 跟随系统 — 监听 `prefers-color-scheme` |

默认：`system`（跟随系统）

---

## 2. 实现方式

### 2.1 CSS 变量架构

```css
/* 亮色模式（默认） */
@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0.005 286.8);
  /* ... */
}

/* 暗色模式覆盖 */
.dark {
  --color-background: oklch(0.145 0.005 286.8);
  --color-foreground: oklch(0.985 0 0);
  /* ... */
}
```

### 2.2 暗色模式切换

```css
/* 启用 .dark 类变体 */
@custom-variant dark (&:where(.dark, .dark *));
```

### 2.3 DOM 操作

```typescript
// 应用主题
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.setAttribute('data-theme', theme);
  root.classList.add(theme);
}
```

---

## 3. 双模式色彩对照

### 3.1 基础色

| 令牌 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| `--color-background` | `oklch(1 0 0)` 纯白 | `oklch(0.145 0.005 286.8)` 深灰 |
| `--color-foreground` | `oklch(0.145 0.005 286.8)` 深灰 | `oklch(0.985 0 0)` 纯白 |
| `--color-card` | `oklch(1 0 0)` 纯白 | `oklch(0.145 0.005 286.8)` 深灰 |
| `--color-border` | `oklch(0.922 0.004 286.3)` 浅灰 | `oklch(0.269 0.005 286.8)` 深灰 |

### 3.2 登录页专用色

| 令牌 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| `--auth-bg-base` | `oklch(0.96 0.01 80)` 暖白 | `oklch(0.12 0.01 60)` 墨黑 |
| `--auth-bg-card` | `oklch(0.98 0.005 80 / 0.92)` | `oklch(0.15 0.01 60 / 0.85)` |
| `--auth-fg-primary` | `oklch(0.2 0.01 60)` 深褐 | `oklch(0.92 0.01 80)` 暖白 |
| `--auth-accent` | `oklch(0.45 0.08 30)` 赭石 | `oklch(0.7 0.06 60)` 金 |

---

## 4. 顶栏双模式规则

> **顶栏是用户最常看到的区域，必须有明确的亮/暗区分。**

### 4.1 顶栏色彩令牌

| 令牌 | 亮色模式 | 暗色模式 | 用途 |
|------|----------|----------|------|
| `--header-bg` | `oklch(0.98 0.005 80 / 0.85)` 暖白半透明 | `oklch(0.15 0.008 60 / 0.85)` 墨黑半透明 | 顶栏背景 |
| `--header-bg-input` | `oklch(0.96 0.008 80)` | `oklch(0.2 0.01 60)` | 搜索框背景 |
| `--header-bg-hover` | `oklch(0.93 0.01 75)` | `oklch(0.22 0.012 60)` | 按钮悬停背景 |
| `--header-bg-keyboard` | `oklch(0.97 0.005 80)` | `oklch(0.18 0.008 60)` | 快捷键标签背景 |
| `--header-bg-track` | `oklch(0.9 0.01 70)` | `oklch(0.25 0.015 60)` | 主题开关轨道 |
| `--header-bg-thumb` | `oklch(1 0 0)` 纯白 | `oklch(0.92 0.01 80)` 暖白 | 主题开关滑块 |
| `--header-bg-avatar` | `oklch(0.45 0.08 30)` 赭石 | `oklch(0.7 0.06 60)` 金 | 用户头像背景 |
| `--header-fg-primary` | `oklch(0.2 0.01 60)` 深褐 | `oklch(0.92 0.01 80)` 暖白 | 主文字 |
| `--header-fg-secondary` | `oklch(0.45 0.01 60)` | `oklch(0.7 0.01 70)` | 次文字 |
| `--header-fg-muted` | `oklch(0.55 0.005 60)` | `oklch(0.55 0.005 60)` | 弱文字 |
| `--header-fg-thumb` | `oklch(0.45 0.01 60)` | `oklch(0.12 0.01 60)` | 滑块图标色 |
| `--header-fg-avatar` | `oklch(0.98 0.005 80)` | `oklch(0.12 0.01 60)` | 头像文字 |
| `--header-border` | `oklch(0.85 0.01 70 / 0.3)` | `oklch(0.3 0.02 60 / 0.2)` | 边框 |
| `--header-border-focus` | `oklch(0.6 0.05 60 / 0.5)` | `oklch(0.5 0.04 60 / 0.4)` | 搜索框聚焦边框 |
| `--header-shadow-focus` | `oklch(0.6 0.05 60 / 0.08)` | `oklch(0.5 0.04 60 / 0.1)` | 搜索框聚焦阴影 |

### 4.2 顶栏样式实现

```css
/* 顶栏容器 */
header {
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--header-border);
}

/* 搜索框 */
.search-input {
  background: var(--header-bg-input);
  border: 1px solid var(--header-border);
  color: var(--header-fg-primary);
}
.search-input:focus {
  border-color: var(--header-border-focus);
  box-shadow: 0 0 0 3px var(--header-shadow-focus);
}

/* 主题切换开关 */
.theme-switch-track {
  background: var(--header-bg-track);
  border: 1px solid var(--header-border);
}
.theme-switch-thumb {
  background: var(--header-bg-thumb);
  color: var(--header-fg-thumb);
}

/* 用户头像 */
.user-avatar {
  background: var(--header-bg-avatar);
  color: var(--header-fg-avatar);
}
```

### 4.3 顶栏双模式视觉差异

| 区域 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 整体背景 | 暖白宣纸色调，半透明 | 墨黑碑帖色调，半透明 |
| 搜索框 | 浅暖灰背景，深褐文字 | 深灰背景，暖白文字 |
| 主题开关 | 浅灰轨道，白色滑块 | 深灰轨道，暖白滑块 |
| 用户头像 | 赭石色底，暖白字 | 金色底，墨黑字 |
| 按钮悬停 | 浅暖灰 | 深灰 |

---

## 5. 侧边栏双模式规则

> **侧边栏是导航核心区域，双模式需清晰区分层级和激活态。**

### 5.1 侧边栏色彩令牌

| 令牌 | 亮色模式 | 暗色模式 | 用途 |
|------|----------|----------|------|
| `--sidebar-bg` | `oklch(0.97 0.008 80)` 暖白 | `oklch(0.13 0.008 60)` 墨黑 | 侧边栏背景 |
| `--sidebar-fg` | `oklch(0.25 0.01 60)` 深褐 | `oklch(0.92 0.01 80)` 暖白 | 菜单文字 |
| `--sidebar-bg-hover` | `oklch(0.92 0.012 75)` | `oklch(0.18 0.01 60)` | 菜单悬停背景 |
| `--sidebar-bg-active` | `oklch(0.88 0.015 70)` | `oklch(0.22 0.012 60)` | 菜单激活背景 |
| `--sidebar-fg-active` | `oklch(0.15 0.01 60)` 深褐 | `oklch(0.95 0.01 80)` 暖白 | 菜单激活文字 |
| `--sidebar-border` | `oklch(0.88 0.01 70 / 0.4)` | `oklch(0.25 0.015 60 / 0.3)` | 边框/分隔线 |
| `--sidebar-accent` | `oklch(0.45 0.08 30)` 赭石 | `oklch(0.7 0.06 60)` 金 | 印章/Logo 背景 |
| `--sidebar-accent-fg` | `oklch(0.98 0.005 80)` | `oklch(0.12 0.01 60)` | 印章文字 |

### 5.2 侧边栏样式实现

```css
/* 侧边栏容器 */
.sidebar {
  background: var(--sidebar-bg);
  color: var(--sidebar-fg);
}

/* Logo 区域 */
.logo-seal {
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-fg);
}

/* 菜单项 */
.menu-item {
  color: var(--sidebar-fg);
}
.menu-item:hover {
  background: var(--sidebar-bg-hover);
}
.menu-item.active {
  background: var(--sidebar-bg-active);
  color: var(--sidebar-fg-active);
}

/* 子菜单 */
.submenu {
  border-left: 1px solid var(--sidebar-border);
}
.submenu-item.active {
  background: var(--sidebar-bg-active);
  color: var(--sidebar-fg-active);
}
```

### 5.3 侧边栏双模式视觉差异

| 区域 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 整体背景 | 暖白宣纸色调 | 墨黑碑帖色调 |
| 菜单文字 | 深褐 | 暖白 |
| 菜单悬停 | 浅暖灰 | 深灰 |
| 菜单激活 | 赭石色强调 + 深褐字 | 金色强调 + 暖白字 |
| Logo 印章 | 赭石底，暖白字 | 金底，墨黑字 |
| 边框 | 暖灰半透明 | 冷灰半透明 |

---

## 6. 组件双模式适配

### 6.1 卡片

```css
/* 亮色：白底 + 浅阴影 */
.card {
  background: var(--color-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 暗色：深底 + 无阴影（边框区分） */
.dark .card {
  border: 1px solid var(--color-border);
}
```

### 6.2 输入框

```css
/* 亮色模式 */
input {
  background: var(--auth-bg-input);
  border: 1px solid var(--auth-border-input);
  color: var(--auth-fg-primary);
}

/* 暗色模式由 CSS 变量自动切换 */
```

---

## 7. 主题切换交互

### 7.1 切换按钮（滑动开关式）

```html
<button class="theme-switch" @click="toggleDarkMode">
  <div class="theme-switch-track">
    <div class="theme-switch-thumb" :class="{ dark: isDark }">
      <Sun v-if="!isDark" />
      <Moon v-else />
    </div>
  </div>
</button>
```

### 7.2 切换动画

```css
/* 滑块滑动动画 */
.theme-switch-thumb {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.theme-switch-thumb.dark {
  transform: translateX(14px);
}

/* 主题切换时全局过渡 */
* {
  transition: background-color 0.3s ease,
              border-color 0.3s ease,
              color 0.3s ease;
}

/* 排除不需要过渡的元素 */
.no-transition {
  transition: none;
}
```

### 7.3 持久化

```typescript
// 保存到 localStorage
function setThemeMode(mode: ThemeMode) {
  app.themeMode = mode;
  currentTheme.value = resolveTheme(mode);
  applyTheme(currentTheme.value);
  savePreferences(); // → localStorage
}
```

---

## 8. 系统主题监听

```typescript
// 监听系统主题变化
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', () => {
  if (app.themeMode === 'system') {
    currentTheme.value = resolveTheme('system');
    applyTheme(currentTheme.value);
  }
});
```

---

## 9. 双模式设计规则

### 9.1 颜色规则

1. **不能简单反转**：暗色不是亮色的反相，需独立设计
2. **饱和度降低**：暗色模式下彩色饱和度降低 20-30%
3. **对比度保证**：暗色模式文字与背景对比度 ≥ 4.5:1
4. **层级表达**：亮色用阴影，暗色用边框/亮度区分层级

### 9.2 背景规则

1. **页面背景**：亮色暖白，暗色墨黑
2. **卡片背景**：亮色纯白，暗色深灰（比页面略亮）
3. **输入框背景**：亮色微透明，暗色更透明

### 9.3 图片/图标规则

1. **图标颜色**：使用 `currentColor` 或 CSS 变量
2. **图片亮度**：暗色模式图片可降低亮度 `filter: brightness(0.8)`
3. **Logo 适配**：准备亮色/暗色两套 Logo（如有）

---

## 10. 验收标准

| 测试项 | 亮色模式 | 暗色模式 |
|--------|----------|----------|
| 页面背景 | 暖白 `#f7f3eb` | 墨黑 `#1a1714` |
| 顶栏背景 | 暖白半透明 `oklch(0.98 0.005 80 / 0.85)` | 墨黑半透明 `oklch(0.15 0.008 60 / 0.85)` |
| 侧边栏背景 | 暖白 `oklch(0.97 0.008 80)` | 墨黑 `oklch(0.13 0.008 60)` |
| 卡片背景 | 白色微透明 | 深灰微透明 |
| 主文字 | 深褐，对比度 ≥ 4.5:1 | 暖白，对比度 ≥ 4.5:1 |
| 边框 | 浅灰可见 | 深灰可见 |
| 阴影 | 可见 | 不可见（用边框替代） |
| 切换过渡 | 300ms 平滑 | 300ms 平滑 |
| 系统跟随 | 自动切换 | 自动切换 |
| 顶栏搜索框 | 浅暖灰背景 | 深灰背景 |
| 侧边栏激活态 | 赭石强调 | 金色强调 |
