# 登录页设计规则 — 亮色/暗色模式规范

> **版本**：v1.0 · **日期**：2026-08-31 · **状态**：生效
> **关联文档**：[PRD v4.0 登录页优化](./PRD-v4.0-login-page.md) · [设计系统规范](./design-system-spec.md)

---

## 1. 设计原则

### 1.1 双模式哲学

| 模式 | 视觉意象 | 色彩基调 | 适用场景 |
|------|----------|----------|----------|
| **亮色模式** | 宣纸画卷 · 晨光 | 暖白、米黄、墨黑 | 日间/光线充足环境 |
| **暗色模式** | 深夜砚台 · 月影 | 墨黑、深灰、月白 | 夜间/光线柔和环境 |

### 1.2 核心原则

1. **文化一致性**：两种模式均体现「古诗文」韵味，亮色如宣纸作画，暗色如碑帖拓印
2. **可读性优先**：文字与背景对比度 ≥ 4.5:1（WCAG AA），关键信息 ≥ 7:1
3. **层次分明**：通过透明度与阴影建立视觉层次，避免纯平设计
4. **过渡自然**：模式切换时使用 300ms 渐变过渡，避免闪烁

---

## 2. 色彩系统

### 2.1 设计令牌（CSS 变量）

```css
/* ===== 登录页专用令牌 ===== */
@theme {
  /* 背景层级 */
  --auth-bg-base: oklch(0.96 0.01 80);           /* 基础背景 */
  --auth-bg-scene: oklch(0.94 0.015 75);         /* 场景背景 */
  --auth-bg-card: oklch(0.98 0.005 80 / 0.92);   /* 卡片背景 */
  --auth-bg-input: oklch(1 0 0 / 0.06);          /* 输入框背景 */

  /* 前景层级 */
  --auth-fg-primary: oklch(0.2 0.01 60);         /* 主文字 */
  --auth-fg-secondary: oklch(0.45 0.01 60);      /* 次文字 */
  --auth-fg-muted: oklch(0.55 0.005 60);         /* 弱化文字 */
  --auth-fg-placeholder: oklch(0.5 0.005 60);    /* 占位符 */

  /* 强调色 */
  --auth-accent: oklch(0.45 0.08 30);            /* 朱砂/铜绿 */
  --auth-accent-hover: oklch(0.5 0.09 30);       /* 悬停态 */
  --auth-accent-fg: oklch(0.98 0.005 80);        /* 强调色上的文字 */

  /* 边框与分割线 */
  --auth-border: oklch(0.85 0.01 70 / 0.25);     /* 卡片边框 */
  --auth-border-input: oklch(0.8 0.01 70 / 0.3); /* 输入框边框 */
  --auth-border-focus: oklch(0.6 0.05 60 / 0.5); /* 聚焦边框 */

  /* 阴影 */
  --auth-shadow-card: 0 24px 80px oklch(0 0 0 / 0.12);
  --auth-shadow-input: 0 0 0 3px oklch(0.6 0.05 60 / 0.08);

  /* 错误色 */
  --auth-error: oklch(0.5 0.15 25);
  --auth-error-bg: oklch(0.5 0.15 25 / 0.1);
  --auth-error-border: oklch(0.5 0.15 25 / 0.25);
}

/* ===== 暗色模式覆盖 ===== */
.dark {
  --auth-bg-base: oklch(0.12 0.01 60);
  --auth-bg-scene: oklch(0.1 0.01 60);
  --auth-bg-card: oklch(0.15 0.01 60 / 0.85);
  --auth-bg-input: oklch(1 0 0 / 0.04);

  --auth-fg-primary: oklch(0.92 0.01 80);
  --auth-fg-secondary: oklch(0.7 0.01 70);
  --auth-fg-muted: oklch(0.55 0.005 60);
  --auth-fg-placeholder: oklch(0.45 0.005 60);

  --auth-accent: oklch(0.7 0.06 60);
  --auth-accent-hover: oklch(0.75 0.07 60);
  --auth-accent-fg: oklch(0.12 0.01 60);

  --auth-border: oklch(0.3 0.02 60 / 0.2);
  --auth-border-input: oklch(0.35 0.02 60 / 0.25);
  --auth-border-focus: oklch(0.5 0.04 60 / 0.4);

  --auth-shadow-card: 0 24px 80px oklch(0 0 0 / 0.5);
  --auth-shadow-input: 0 0 0 3px oklch(0.5 0.04 60 / 0.1);

  --auth-error: oklch(0.65 0.12 25);
  --auth-error-bg: oklch(0.65 0.12 25 / 0.15);
  --auth-error-border: oklch(0.65 0.12 25 / 0.3);
}
```

### 2.2 色彩应用映射

| 用途 | 亮色模式 | 暗色模式 | CSS 变量 |
|------|----------|----------|----------|
| 页面背景 | `#f5f0e8` 暖白 | `#1a1714` 墨黑 | `--auth-bg-base` |
| 卡片背景 | `rgba(255,255,255,0.92)` | `rgba(28,26,22,0.85)` | `--auth-bg-card` |
| 输入框背景 | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.04)` | `--auth-bg-input` |
| 主文字 | `#2d2824` 墨黑 | `#e8e0d0` 月白 | `--auth-fg-primary` |
| 次文字 | `#6b655a` 淡墨 | `#a8a296` 银灰 | `--auth-fg-secondary` |
| 强调色 | `#a82a1a` 朱砂 | `#c4a87a` 铜金 | `--auth-accent` |
| 边框 | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.08)` | `--auth-border` |

---

## 3. 背景场景规范

### 3.1 亮色模式 — 宣纸画卷

```
┌─────────────────────────────────────────────────┐
│  ╭──╮                                            │
│  │诗│  ╭────────────────╮      ┌──────────────┐ │
│  ╰──╯  │  远山（淡墨）    │      │  登录卡片     │ │
│        │  中山（中墨）    │      │  ──────────  │ │
│        │  近山（浓墨）    │      │  用户名      │ │
│        │  云雾（留白）    │      │  密码        │ │
│        ╰────────────────╯      │  [登录]      │ │
│                                 └──────────────┘ │
│  晓诗管理后台                                    │
│  传承千年诗韵 · 匠心内容管理                      │
└─────────────────────────────────────────────────┘
```

**视觉要素**：
- 背景：暖白渐变 `#f7f3eb → #ede8dc`
- 山水：淡墨色 `oklch(0.6 0.02 60 / 0.3)`，营造「远山如黛」效果
- 云雾：留白 + 微透明，模拟宣纸晕染
- 明月：暖黄 `oklch(0.85 0.05 80 / 0.15)`

### 3.2 暗色模式 — 深夜砚台

```
┌─────────────────────────────────────────────────┐
│  ╭──╮                                            │
│  │诗│  ╭────────────────╮      ┌──────────────┐ │
│  ╰──╯  │  远山（深墨）    │      │  登录卡片     │ │
│        │  中山（浓墨）    │      │  ──────────  │ │
│        │  近山（重墨）    │      │  用户名      │ │
│        │  云雾（淡白）    │      │  密码        │ │
│        ╰────────────────╯      │  [登录]      │ │
│                                 └──────────────┘ │
│  晓诗管理后台                                    │
│  传承千年诗韵 · 匠心内容管理                      │
└─────────────────────────────────────────────────┘
```

**视觉要素**：
- 背景：墨黑渐变 `#1a1714 → #0f0d0b`
- 山水：深墨色 `oklch(0.3 0.02 60 / 0.6)`，营造「山峦叠嶂」效果
- 云雾：淡白 `oklch(0.95 0.01 80 / 0.04)`
- 明月：冷白 `oklch(0.95 0.01 80 / 0.12)`

---

## 4. 组件规范

### 4.1 登录卡片

```css
.auth-card {
  background: var(--auth-bg-card);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border-radius: 8px;
  padding: 44px 36px;
  border: 1px solid var(--auth-border);
  box-shadow: var(--auth-shadow-card);
}
```

### 4.2 输入框

```css
.form-input {
  width: 100%;
  height: 42px;
  padding: 0 12px 0 38px;
  border: 1px solid var(--auth-border-input);
  border-radius: 6px;
  background: var(--auth-bg-input);
  color: var(--auth-fg-primary);
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.form-input::placeholder {
  color: var(--auth-fg-placeholder);
}

.form-input:focus {
  outline: none;
  border-color: var(--auth-border-focus);
  background: color-mix(in oklch, var(--auth-bg-input) 50%, transparent);
  box-shadow: var(--auth-shadow-input);
}
```

### 4.3 登录按钮

```css
.btn-login {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, var(--auth-accent) 0%, oklch(from var(--auth-accent) l c h / 0.85) 100%);
  color: var(--auth-accent-fg);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login:hover {
  background: var(--auth-accent-hover);
  box-shadow: 0 4px 16px oklch(from var(--auth-accent) l c h / 0.3);
}
```

### 4.4 错误提示

```css
.form-alert {
  background: var(--auth-error-bg);
  border: 1px solid var(--auth-error-border);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--auth-error);
  margin-bottom: 20px;
}
```

---

## 5. 印章与装饰

### 5.1 印章 Logo

| 属性 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 底色 | `#a82a1a` 朱砂 | `#c45a4a` 暗朱砂 |
| 文字 | `#f4f0e8` 暖白 | `#f4f0e8` 暖白 |
| 内边框 | `rgba(244,240,232,0.3)` | `rgba(244,240,232,0.25)` |
| 阴影 | `rgba(168,42,26,0.4)` | `rgba(196,90,74,0.3)` |

### 5.2 竖排诗句

| 属性 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 颜色 | `#6b655a` | `#4a4540` |
| 透明度 | 0.7 | 0.6 |

---

## 6. 动效规范

### 6.1 模式切换过渡

```css
.auth-layout,
.auth-card,
.form-input,
.btn-login {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease;
}
```

### 6.2 入场动画

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

@keyframes authFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.auth-anim-up {
  animation: authFadeUp 0.6s ease-out both;
}

.auth-anim-up-d1 {
  animation: authFadeUp 0.6s ease-out 0.1s both;
}

.auth-anim-fade {
  animation: authFadeIn 1s ease-out 0.3s both;
}
```

---

## 7. 响应式断点

| 断点 | 宽度 | 布局调整 |
|------|------|----------|
| 桌面 | > 900px | 左右分栏，品牌区 + 卡片 |
| 平板 | 768-900px | 品牌区隐藏，卡片居中 |
| 手机 | < 768px | 卡片全宽，紧凑间距 |

---

## 8. 无障碍要求

| 要求 | 标准 | 实现 |
|------|------|------|
| 文字对比度 | ≥ 4.5:1 | 使用 oklch 色彩空间确保感知均匀 |
| 焦点可见 | 清晰焦点环 | `box-shadow: var(--auth-shadow-input)` |
| 键盘导航 | 完整 Tab 序 | 所有交互元素可聚焦 |
| 屏幕阅读器 | ARIA 标签 | `aria-label`, `role="alert"` |
| 减少动画 | `prefers-reduced-motion` | 禁用动画，直接显示 |

---

## 9. 实现检查清单

### 9.1 亮色模式

- [ ] 背景为暖白渐变
- [ ] 山水为淡墨色
- [ ] 卡片为半透明白
- [ ] 文字为墨黑色
- [ ] 强调色为朱砂红

### 9.2 暗色模式

- [ ] 背景为墨黑渐变
- [ ] 山水为深墨色
- [ ] 卡片为半透明深灰
- [ ] 文字为月白色
- [ ] 强调色为铜金色

### 9.3 通用

- [ ] 所有颜色使用 CSS 变量
- [ ] 模式切换有 300ms 过渡
- [ ] 响应式布局正常
- [ ] 动画可禁用
- [ ] 焦点状态可见
