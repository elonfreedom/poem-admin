# 动效规范

> 动静相宜，动效服务于功能，不炫技，不干扰

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **功能性** | 动效传达状态变化、空间关系、操作反馈 |
| **克制** | 少即是多，避免过度动画 |
| **快速** | 交互反馈 ≤ 200ms，转场 ≤ 400ms |
| **自然** | 缓动函数模拟物理世界，避免线性动画 |
| **可禁用** | 尊重 `prefers-reduced-motion` |

---

## 2. 时间尺度

| 时长 | 用途 |
|------|------|
| 100ms | 微交互：按钮按下、颜色变化 |
| 150ms | 短过渡：悬停、聚焦 |
| 200ms | 标准过渡：菜单展开、Toast 出现 |
| 300ms | 页面过渡：路由切换、模态框 |
| 400-600ms | 入场动画：卡片出现、列表加载 |
| 1000ms+ | 装饰动画：浮动、呼吸（非交互） |

---

## 3. 缓动函数

### 3.1 标准缓动

| 名称 | 值 | 用途 |
|------|-----|------|
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 元素进入（快速开始，缓慢结束） |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 元素离开（缓慢开始，快速结束） |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | 双向过渡（对称） |
| `linear` | `cubic-bezier(0, 0, 1, 1)` | 进度条、加载指示 |

### 3.2 Tailwind 默认

```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* ease-in-out */
```

---

## 4. 过渡（Transition）

### 4.1 颜色过渡

```css
/* 悬停、聚焦时的颜色变化 */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4.2 变换过渡

```css
/* 位移、缩放、旋转 */
.transition-transform {
  transition-property: transform;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4.3 透明度过渡

```css
/* 显示/隐藏 */
.transition-opacity {
  transition-property: opacity;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 5. 动画（Animation）

### 5.1 入场动画 — Fade In Up

```css
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

.auth-anim-up {
  animation: authFadeUp 0.6s ease-out both;
}

/* 延迟版本（错开入场） */
.auth-anim-up-d1 { animation: authFadeUp 0.6s ease-out 0.1s both; }
.auth-anim-up-d2 { animation: authFadeUp 0.6s ease-out 0.2s both; }
.auth-anim-up-d3 { animation: authFadeUp 0.6s ease-out 0.3s both; }
.auth-anim-up-d4 { animation: authFadeUp 0.6s ease-out 0.4s both; }
```

### 5.2 淡入动画 — Fade In

```css
@keyframes authFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.auth-anim-fade {
  animation: authFadeIn 1s ease-out 0.3s both;
}
```

### 5.3 浮动动画 — Float（装饰性）

```css
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0) translateX(0); }
  33% { transform: translateY(-12px) translateX(8px); }
  66% { transform: translateY(8px) translateX(-6px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}
```

### 5.4 旋转动画 — Spin（加载）

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## 6. 交互动画

### 6.1 按钮

```css
/* 按下反馈 */
.btn:active {
  transform: scale(0.98);
}

/* 主题切换按钮 */
.theme-toggle:hover {
  transform: scale(1.05);
}
.theme-toggle:active {
  transform: scale(0.95);
}
```

### 6.2 菜单展开

```css
/* 子菜单图标旋转 */
.chevron {
  transition: transform 0.2s ease;
}
.chevron.expanded {
  transform: rotate(180deg);
}
```

### 6.3 卡片悬停

```css
/* 统计卡片 */
.stat-card {
  transition: box-shadow 0.2s ease;
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
}
```

---

## 7. 页面过渡

### 7.1 路由切换

```css
/* 淡入淡出 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
```

### 7.2 模态框

```css
/* 进入 */
.modal-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

/* 离开 */
.modal-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
```

---

## 8. 无障碍 — 减少动画

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

当用户系统设置「减少动画」时，所有动画应立即禁用或缩短至无感知。

---

## 9. 使用规则

### 9.1 动画选择原则

1. **交互反馈用 transition**：悬停、聚焦、激活用 CSS transition
2. **入场效果用 animation**：页面加载、模态框出现用 CSS animation
3. **装饰动画用 infinite**：浮动、呼吸等循环动画
4. **避免 layout 动画**：不动画 width/height/top/left，用 transform/opacity

### 9.2 性能原则

1. **只动画 transform 和 opacity**：GPU 加速，不掉帧
2. **避免触发重排**：不动画 `width`、`height`、`margin`、`padding`
3. **will-change 谨慎使用**：仅在即将动画的元素上临时使用
4. **移动端简化**：小屏幕或低性能设备减少动画复杂度
