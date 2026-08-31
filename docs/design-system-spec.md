# 晓诗管理后台 — 设计系统规范

> **版本**：1.0 · **日期**：2026-08-31 · **状态**：生效中
> **设计系统**：shadcn-vue + Radix Vue + Tailwind CSS 4

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **简洁** | 去除冗余装饰，内容优先 |
| **一致** | 统一的交互模式和视觉语言 |
| **无障碍** | 键盘导航、焦点管理、ARIA 语义 |
| **可定制** | 组件源码在项目中，完全可控 |
| **响应式** | 适配桌面端 1366px - 1920px+ |

---

## 2. 设计令牌（Design Tokens）

### 2.1 颜色系统

#### 基础色板（CSS 变量）

```css
/* src/styles/globals.css */
@theme {
  /* 背景色 */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0.005 286.8);

  /* 主色 */
  --color-primary: oklch(0.21 0.006 286.8);
  --color-primary-foreground: oklch(0.985 0 0);

  /* 次色 */
  --color-secondary: oklch(0.967 0.001 286.8);
  --color-secondary-foreground: oklch(0.21 0.006 286.8);

  /* 静音色（禁用、占位符） */
  --color-muted: oklch(0.967 0.001 286.8);
  --color-muted-foreground: oklch(0.552 0.016 286.8);

  /* 强调色（hover、focus） */
  --color-accent: oklch(0.967 0.001 286.8);
  --color-accent-foreground: oklch(0.21 0.006 286.8);

  /* 危险色（删除、错误） */
  --color-destructive: oklch(0.577 0.245 27.3);
  --color-destructive-foreground: oklch(0.985 0 0);

  /* 边框 & 输入框 */
  --color-border: oklch(0.922 0.004 286.3);
  --color-input: oklch(0.922 0.004 286.3);
  --color-ring: oklch(0.708 0.01 286.8);

  /* 卡片 & 弹窗 */
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0.005 286.8);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0.005 286.8);

  /* 圆角 */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

#### 暗色模式

```css
/* 定义基于 .dark class 的暗色模式变体 */
@custom-variant dark (&:where(.dark, .dark *));

/* 暗色模式颜色覆盖 */
.dark {
  --color-background: oklch(0.145 0.005 286.8);
  --color-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.985 0 0);
  --color-primary-foreground: oklch(0.21 0.006 286.8);
  --color-secondary: oklch(0.269 0.005 286.8);
  --color-secondary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.269 0.005 286.8);
  --color-muted-foreground: oklch(0.708 0.01 286.8);
  --color-accent: oklch(0.269 0.005 286.8);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-destructive: oklch(0.477 0.245 27.3);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-border: oklch(0.269 0.005 286.8);
  --color-input: oklch(0.269 0.005 286.8);
  --color-ring: oklch(0.871 0.006 286.8);
  --color-card: oklch(0.145 0.005 286.8);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.145 0.005 286.8);
  --color-popover-foreground: oklch(0.985 0 0);
}
```

#### 语义化颜色使用

| 用途 | 类名 | CSS 变量 |
|------|------|----------|
| 页面背景 | `bg-background` | `--color-background` |
| 文字默认 | `text-foreground` | `--color-foreground` |
| 主按钮 | `bg-primary text-primary-foreground` | `--color-primary` |
| 次按钮 | `bg-secondary text-secondary-foreground` | `--color-secondary` |
| 危险按钮 | `bg-destructive text-destructive-foreground` | `--color-destructive` |
| 禁用状态 | `text-muted-foreground` | `--color-muted-foreground` |
| 边框 | `border-border` | `--color-border` |
| 卡片背景 | `bg-card` | `--color-card` |
| Hover 背景 | `bg-accent` | `--color-accent` |
| 聚焦环 | `ring-ring` | `--color-ring` |

### 2.2 间距系统

Tailwind CSS 默认间距（基于 0.25rem = 4px）：

| Token | 值 | 用途 |
|-------|-----|------|
| `1` | 0.25rem (4px) | 图标与文字间距 |
| `2` | 0.5rem (8px) | 紧凑内联间距 |
| `3` | 0.75rem (12px) | 表单元素内部 |
| `4` | 1rem (16px) | 组件内间距（默认） |
| `6` | 1.5rem (24px) | 卡片内间距 |
| `8` | 2rem (32px) | 区块间距 |
| `12` | 3rem (48px) | 页面级间距 |
| `16` | 4rem (64px) | 大区块间距 |

### 2.3 字体系统

```css
@theme {
  --font-sans: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --font-size-xs: 0.75rem;    /* 12px - 辅助文字 */
  --font-size-sm: 0.875rem;   /* 14px - 正文 */
  --font-size-base: 1rem;     /* 16px - 大正文 */
  --font-size-lg: 1.125rem;   /* 18px - 小标题 */
  --font-size-xl: 1.25rem;    /* 20px - 标题 */
  --font-size-2xl: 1.5rem;    /* 24px - 大标题 */

  --line-height-tight: 1.25;   /* 标题 */
  --line-height-normal: 1.5;   /* 正文 */
  --line-height-relaxed: 1.75; /* 长文 */
}
```

### 2.4 阴影系统

| Token | 值 | 用途 |
|-------|-----|------|
| `shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.05)` | 输入框、小卡片 |
| `shadow-md` | `0 4px 6px oklch(0 0 0 / 0.1)` | 弹窗、下拉菜单 |
| `shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.1)` | 浮层、抽屉 |
| `shadow-xl` | `0 20px 25px oklch(0 0 0 / 0.1)` | 模态框 |

### 2.5 动效系统

| Token | 值 | 用途 |
|-------|-----|------|
| `duration-fast` | 150ms | 按钮、输入框反馈 |
| `duration-normal` | 250ms | 弹窗、抽屉 |
| `duration-slow` | 350ms | 页面切换 |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | 默认缓动 |

---

## 3. 组件规范

### 3.1 组件清单

| 组件 | 来源 | 替代 antd | 优先级 |
|------|------|-----------|:------:|
| Button | shadcn-vue | a-button | P0 |
| Input | shadcn-vue | a-input | P0 |
| Label | shadcn-vue | a-form-item label | P0 |
| Table | shadcn-vue | a-table | P0 |
| Dialog | shadcn-vue | a-modal | P0 |
| DropdownMenu | shadcn-vue | a-dropdown | P1 |
| Select | shadcn-vue | a-select | P1 |
| Badge | shadcn-vue | a-tag | P1 |
| Card | shadcn-vue | a-card | P1 |
| Tooltip | shadcn-vue | a-tooltip | P1 |
| AlertDialog | shadcn-vue | a-modal.confirm | P1 |
| Checkbox | shadcn-vue | a-checkbox | P1 |
| Switch | shadcn-vue | a-switch | P1 |
| Tabs | shadcn-vue | a-tabs | P1 |
| Textarea | shadcn-vue | a-textarea | P1 |
| Drawer | vaul-vue | a-drawer | P2 |
| Calendar | shadcn-vue | a-date-picker | P2 |
| Popover | shadcn-vue | a-popover | P2 |
| Separator | shadcn-vue | a-divider | P2 |
| Skeleton | shadcn-vue | a-skeleton | P2 |
| Sonner (Toast) | vue-sonner | a-message | P2 |

### 3.2 组件 API 约定

#### Button

```vue
<Button variant="default" size="default">主要按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="destructive">危险按钮</Button>
<Button variant="outline">边框按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="link">链接按钮</Button>

<size="sm">小</size>
<size="default">默认</size>
<size="lg">大</size>
<size="icon">图标按钮</size>
```

#### Input

```vue
<Input v-model="value" placeholder="请输入..." />
<Input v-model="value" type="password" />
<Input v-model="value" disabled />
```

#### Table

```vue
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>列标题</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow v-for="item in data" :key="item.id">
      <TableCell>{{ item.name }}</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Dialog

```vue
<Dialog>
  <DialogTrigger as-child>
    <Button>打开</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    <!-- 内容 -->
    <DialogFooter>
      <Button variant="outline">取消</Button>
      <Button>确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 4. 页面布局规范

### 4.1 整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│  Header：Logo │ 全局搜索 │ 暗色切换 │ 用户菜单                    │
├───────────┬─────────────────────────────────────────────────────┤
│           │  PageHeader（面包屑 + 页面标题 + 操作按钮）         │
│   Sidebar ├─────────────────────────────────────────────────────┤
│           │                                                     │
│ · 总览    │                   Page Content                      │
│ · 诗歌    │                                                     │
│ · 作者    │                                                     │
│ · 分类    │                                                     │
│ · 用户    │                                                     │
│ · 工具    │                                                     │
│           │                                                     │
└───────────┴─────────────────────────────────────────────────────┘
```

### 4.2 侧边栏

- 宽度：240px（展开）/ 64px（收起）
- 菜单项高度：40px
- 图标：lucide-vue-next，20px
- 选中态：`bg-accent text-accent-foreground`

### 4.3 顶栏

- 高度：56px
- 背景：`bg-background border-b border-border`
- 右侧操作区：搜索、暗色切换、用户头像

### 4.4 内容区

- 页面间距：`p-6`
- 卡片间距：`gap-4` / `gap-6`
- 最大宽度：无限制的页面撑满，表单页面 `max-w-2xl`

---

## 5. 表单规范

### 5.1 表单布局

```vue
<form class="space-y-6">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="name">名称 <span class="text-destructive">*</span></Label>
      <Input id="name" v-model="form.name" placeholder="请输入名称" />
      <p class="text-sm text-muted-foreground">辅助说明文字</p>
    </div>
  </div>
</form>
```

### 5.2 表单校验

| 状态 | 样式 |
|------|------|
| 默认 | `border-input` |
| 聚焦 | `ring-2 ring-ring` |
| 错误 | `border-destructive` + 下方红色提示 |
| 禁用 | `opacity-50 cursor-not-allowed` |

### 5.3 表单操作

- 主按钮在右，次按钮在左
- 按钮间距：`gap-2`
- 固定底部操作栏（长表单）：`sticky bottom-0 bg-background border-t py-4`

---

## 6. 表格规范

### 6.1 表格结构

```vue
<div class="rounded-md border border-border">
  <Table>
    <TableHeader>
      <TableRow class="bg-muted/50">
        <TableHead class="w-[80px]">ID</TableHead>
        <TableHead>名称</TableHead>
        <TableHead class="w-[120px]">状态</TableHead>
        <TableHead class="w-[180px] text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="item in data" :key="item.id">
        <TableCell>{{ item.id }}</TableCell>
        <TableCell>{{ item.name }}</TableCell>
        <TableCell>
          <Badge :variant="item.status === 'active' ? 'default' : 'secondary'">
            {{ item.status }}
          </Badge>
        </TableCell>
        <TableCell class="text-right">
          <Button variant="ghost" size="sm">编辑</Button>
          <Button variant="ghost" size="sm" class="text-destructive">删除</Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### 6.2 表格操作

- 操作列固定在右侧
- 最多 3 个按钮，超出用 DropdownMenu
- 危险操作需二次确认（AlertDialog）

### 6.3 分页

- 表格下方右侧
- 显示总数 + 每页条数选择 + 页码

---

## 7. 空状态 & 加载

### 7.1 空状态

```vue
<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
  <Inbox class="h-12 w-12 mb-4 opacity-50" />
  <p class="text-sm">暂无数据</p>
</div>
```

### 7.2 加载状态

- 整页加载：Skeleton 骨架屏
- 局部加载：Spinner（lucide-loader-circle animate-spin）
- 按钮加载：按钮内 Spinner + disabled

---

## 8. 暗色模式

### 8.1 切换实现

```typescript
// 在 app.vue 中
const { store } = usePreferences();

watch(() => store.currentTheme, (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, { immediate: true });
```

### 8.2 切换按钮

```vue
<Button variant="ghost" size="icon" @click="toggleTheme">
  <Sun v-if="isDark" class="h-5 w-5" />
  <Moon v-else class="h-5 w-5" />
</Button>
```

---

## 9. 图标规范

- **来源**：lucide-vue-next
- **尺寸**：默认 20px（`h-5 w-5`），小图标 16px（`h-4 w-4`）
- **颜色**：继承父级 `text-foreground` 或 `text-muted-foreground`
- **按钮内图标**：`mr-2 h-4 w-4`

---

## 10. 文件组织

```
src/
  components/
    ui/              ← shadcn-vue 组件（不修改，定制通过 cn() 覆盖）
    layout/          ← 布局组件（Sidebar、Header、Breadcrumb）
    business/        ← 业务组件（PageHeader、TableAction）
  styles/
    globals.css      ← Tailwind 入口 + 设计令牌
  lib/
    utils.ts         ← cn() 工具函数
```

---

## 11. 代码风格

### 1.1 类名排序

1. 布局类（`flex`, `grid`, `block`）
2. 间距类（`p-4`, `m-2`, `gap-4`）
3. 尺寸类（`w-full`, `h-8`）
4. 颜色类（`bg-primary`, `text-muted-foreground`）
5. 状态类（`hover:bg-accent`, `disabled:opacity-50`）
6. 交互类（`cursor-pointer`）

### 1.2 cn() 工具

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 12. 迁移检查清单

- [ ] 移除 antd 依赖（ant-design-vue、@ant-design/icons-vue）
- [ ] 移除 antd 相关组件（ConfigProvider、App）
- [ ] 移除 antd locale 加载逻辑
- [ ] 移除 antd 主题配置
- [ ] 所有页面使用 shadcn-vue 组件
- [ ] 暗色模式基于 CSS 变量切换
- [ ] Toast 使用 vue-sonner
- [ ] 表单校验使用自定义逻辑
- [ ] 路由守卫移除 antd message 依赖

---

## 参考资料

- [shadcn-vue 官方文档](https://www.shadcn-vue.com/)
- [Radix Vue 原语](https://www.radix-vue.com/)
- [Tailwind CSS 4 文档](https://tailwindcss.com/docs)
- [lucide icons](https://lucide.dev/)
- [vue-sonner](https://sonner.emilkowal.ski/)
- [vaul-vue](https://vaul.unovue.com/)
