# 字体排版

> 中西结合，中文用宋体/楷体体现文化感，英文用无衬线体保证可读性

---

## 1. 字体族

### 1.1 字体角色

| 角色 | 中文字体 | 西文字体 | 用途 |
|------|----------|----------|------|
| **标题** | Noto Serif SC, Songti SC | — | 品牌标题、诗句、装饰性文字 |
| **正文** | PingFang SC, Microsoft YaHei | Inter, Geist | 界面正文、标签、按钮 |
| **数据** | — | JetBrains Mono, Fira Code | 数字、代码、统计值 |

### 1.2 CSS 定义

```css
/* 标题字体 — 衬线体，文化感 */
--font-heading: 'Noto Serif SC', 'Songti SC', serif;

/* 正文字体 — 无衬线，现代感 */
--font-sans: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;

/* 数据字体 — 等宽，对齐 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 1.3 Google Fonts 加载

```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## 2. 字号比例

### 2.1 类型比例（Type Scale）

基于 `1.25` 倍数比例（Major Third）：

| 级别 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| `text-xs` | 12px | 16px | 400 | 辅助文字、标签、时间戳 |
| `text-sm` | 14px | 20px | 400 | 正文小字、按钮文字 |
| `text-base` | 16px | 24px | 400 | 正文、输入框 |
| `text-lg` | 18px | 28px | 500 | 副标题、卡片标题 |
| `text-xl` | 20px | 28px | 600 | 页面标题 |
| `text-2xl` | 24px | 32px | 600 | 区块标题 |
| `text-3xl` | 30px | 36px | 700 | 品牌标题 |

### 2.2 登录页专用字号

| 元素 | 字号 | 字体 | 字重 |
|------|------|------|------|
| 品牌标题 | 32px | Noto Serif SC | 600 |
| 品牌副标题 | 13px | Inter | 400 |
| 竖排诗句 | 15px | Noto Serif SC | 400 |
| 表单标题 | 22px | Noto Serif SC | 600 |
| 输入框 | 14px | Inter | 400 |
| 按钮 | 14px | Inter | 600 |
| 错误提示 | 12px | Inter | 400 |

---

## 3. 字重

| 字重 | 值 | 用途 |
|------|-----|------|
| Normal | 400 | 正文、描述 |
| Medium | 500 | 标签、导航、按钮 |
| Semibold | 600 | 标题、强调 |
| Bold | 700 | 品牌标题、数字 |

---

## 4. 行高

| 场景 | 行高 | 说明 |
|------|------|------|
| 标题 | 1.2-1.3 | 紧凑，视觉整体 |
| 正文 | 1.5-1.6 | 舒适阅读 |
| 标签/按钮 | 1.0 | 与元素高度一致 |
| 竖排诗句 | 2.2 | 字间距大，透气 |

---

## 5. 字间距（Letter Spacing）

| 场景 | 字间距 | 用途 |
|------|--------|------|
| 品牌标题 | `0.15em` | 舒展、大气 |
| 竖排诗句 | `0.6em` | 古典韵律 |
| 副标题 | `0.08em` | 轻微呼吸 |
| 大写标签 | `0.05em` | 清晰可辨 |

---

## 6. 特殊排版

### 6.1 竖排文字（Vertical Text）

```css
.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 0.6em;
  line-height: 2.2;
}
```

适用场景：登录页诗句、侧边栏装饰、文化类卡片。

### 6.2 数字排版

```css
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
}
```

适用场景：统计数据、表格数字、金额。

---

## 7. 使用规则

### 7.1 字体选择原则

1. **文化场景用衬线**：品牌标题、诗句、装饰文字使用 Noto Serif SC
2. **功能场景用无衬线**：按钮、标签、正文使用 Inter
3. **数字场景用等宽**：统计数据、代码使用 JetBrains Mono
4. **最多两种字体**：同一视图不超过两种字体族

### 7.2 可读性原则

1. **正文最小 14px**：保证基本可读性
2. **行高 ≥ 1.5**：正文行高不低于 1.5 倍
3. **行长 45-75 字符**：过宽或过窄都影响阅读
4. **对比度达标**：文字与背景对比度 ≥ 4.5:1
