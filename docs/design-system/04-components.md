# 组件规范

> 基于 shadcn-vue，统一设计语言，保持一致性

---

## 1. 卡片（Card）

### 1.1 标准卡片

```html
<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
  <!-- 内容 -->
</div>
```

| 属性 | 值 |
|------|-----|
| 圆角 | `rounded-xl` (12px) |
| 边框 | `border-border` |
| 背景 | `bg-card` |
| 内边距 | `p-6` (24px) |
| 阴影 | `shadow-sm` |

### 1.2 毛玻璃卡片（登录页）

```css
.glass-card {
  background: var(--auth-bg-card);
  backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid var(--auth-border);
  border-radius: 8px;
  box-shadow: var(--auth-shadow-card);
  padding: 44px 36px;
}
```

### 1.3 统计卡片（Dashboard）

```html
<div class="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
  <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
    <Icon class="h-6 w-6 text-blue-600" />
  </div>
  <div>
    <div class="text-2xl font-bold">1,234</div>
    <div class="text-sm text-muted-foreground">总用户数</div>
  </div>
</div>
```

---

## 2. 按钮（Button）

### 2.1 变体

| 变体 | 用途 | 样式 |
|------|------|------|
| `default` | 主要操作 | 实心背景，主色 |
| `secondary` | 次要操作 | 灰色背景 |
| `outline` | 次要操作 | 边框，透明背景 |
| `ghost` | 图标按钮、顶栏 | 无背景，悬停高亮 |
| `destructive` | 危险操作 | 红色背景 |
| `link` | 文字链接 | 无边框，主色文字 |

### 2.2 登录按钮（渐变）

```css
.btn-login {
  background: linear-gradient(
    135deg,
    var(--auth-accent) 0%,
    oklch(from var(--auth-accent) calc(l * 0.85) c h) 100%
  );
  color: var(--auth-accent-fg);
  height: 44px;
  border-radius: 6px;
  font-weight: 600;
}
```

### 2.3 尺寸

| 尺寸 | 高度 | 内边距 | 用途 |
|------|------|--------|------|
| `sm` | 32px | `px-3 py-1` | 紧凑场景 |
| `default` | 36px | `px-4 py-2` | 标准 |
| `lg` | 40px | `px-6 py-3` | 重要操作 |
| `icon` | 36px | — | 图标按钮 |

---

## 3. 输入框（Input）

### 3.1 标准输入框

```html
<Input placeholder="请输入..." class="h-9" />
```

### 3.2 带图标输入框（登录页）

```css
.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--auth-fg-muted);
  width: 16px;
  height: 16px;
}

.form-input {
  height: 42px;
  padding: 0 12px 0 38px;
  border: 1px solid var(--auth-border-input);
  border-radius: 6px;
  background: var(--auth-bg-input);
}

.form-input:focus {
  border-color: var(--auth-border-focus);
  box-shadow: var(--auth-shadow-input);
}
```

### 3.3 状态

| 状态 | 样式 |
|------|------|
| 默认 | `border: 1px solid var(--auth-border-input)` |
| 聚焦 | `border-color: var(--auth-border-focus)` + `box-shadow` |
| 错误 | `border-color: var(--auth-error)` |
| 禁用 | `opacity: 0.5; cursor: not-allowed` |

---

## 4. 导航（Navigation）

### 4.1 侧边栏菜单

```css
/* 菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  transition: background-color 0.15s;
}

/* 悬停 */
.menu-item:hover {
  background: var(--color-sidebar-accent);
  color: var(--color-sidebar-accent-foreground);
}

/* 激活 */
.menu-item.active {
  background: var(--color-sidebar-accent);
  font-weight: 500;
}
```

### 4.2 子菜单

```css
/* 子菜单缩进 */
.sub-menu {
  margin-left: 20px;
  border-left: 1px solid var(--color-sidebar-border);
  padding-left: 12px;
}
```

### 4.3 面包屑

```html
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink>
        <Home class="h-3.5 w-3.5" />
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>当前页</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

## 5. 用户菜单（DropdownMenu）

```html
<DropdownMenu>
  <DropdownMenuTrigger>
    <!-- 触发器：头像 + 用户名 -->
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-44">
    <DropdownMenuItem>
      <Settings class="mr-2 h-4 w-4" />
      系统设置
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem class="text-destructive">
      <LogOut class="mr-2 h-4 w-4" />
      退出登录
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 6. 印章（Seal / Logo）

```css
/* 品牌印章 */
.seal {
  width: 56px;
  height: 56px;
  background: var(--auth-accent);
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-family: 'Noto Serif SC', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--auth-accent-fg);
  box-shadow: 0 4px 20px oklch(from var(--auth-accent) l c h / 0.4);
  position: relative;
}

.seal::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1.5px solid oklch(0.98 0.005 80 / 0.3);
  border-radius: 3px;
}
```

---

## 7. 主题切换按钮

```css
/* 圆形切换按钮 */
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
  border: 1px solid var(--auth-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--auth-fg-secondary);
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  color: var(--auth-fg-primary);
  border-color: var(--auth-border-focus);
  transform: scale(1.05);
}
```

---

## 8. 使用规则

### 8.1 组件选择原则

1. **优先使用 shadcn-vue**：Button、Input、DropdownMenu 等
2. **禁止引入新 UI 库**：保持技术栈统一
3. **自定义组件需文档化**：新的业务组件需补充到本文档

### 8.2 状态完整性

每个交互组件必须包含以下状态：
- 默认（default）
- 悬停（hover）
- 聚焦（focus）
- 激活/选中（active/checked）
- 禁用（disabled）
- 加载（loading，如适用）

### 8.3 无障碍

1. **键盘可达**：所有交互元素可通过 Tab 键聚焦
2. **焦点可见**：`:focus-visible` 有明显样式
3. **语义化标签**：使用正确的 HTML 语义和 ARIA 属性
4. **颜色非唯一信息源**：不仅靠颜色传达状态
