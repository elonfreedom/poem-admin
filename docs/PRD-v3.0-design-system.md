# 晓诗后台管理 PRD v3.0 — 设计系统重构 & Vben 清理

> **版本**：v3.0 · **日期**：2026-08-31 · **状态**：执行中
> **项目**：poem-admin（Vue 3 + shadcn-vue）
> **前置版本**：PRD v2.0（已完成 Vben 脱离，迁移到纯 Vue 3 + Ant Design Vue）

---

## 1. 变更概述

### 1.1 背景

PRD v2.0 已完成核心框架从 Vben 的脱离，但代码中仍存在四类遗留问题：

1. **Vben 兼容层**：`preferences.ts` 中保留了完整的 `@vben/preferences` 兼容 API（`initPreferences`、`usePreferences`、`preferences` 全局对象），代码注释中大量 `@vben/*` 引用
2. **构建配置残留**：`turbo.json`、`oxfmt.config.ts`、`oxlint.config.ts`、`stylelint.config.mjs` 仍依赖 `@vben/*` 内部包
3. **多应用目录结构**：`apps/web-antd/` 是 Vben 多应用时代的遗留，当前只剩一个应用，`apps/` 层级冗余
4. **UI 组件库**：当前使用 Ant Design Vue，组件风格偏传统，且与设计系统现代化目标不符

### 1.2 目标

| 目标 | 说明 |
|------|------|
| **弃用 Ant Design Vue** | 完全移除 antd 依赖，全面转向 shadcn-vue |
| **引入 shadcn-vue** | 作为唯一设计系统，提供现代化、可定制的无障碍组件 |
| **移除 Vben 兼容层** | 清理 `preferences.ts` 中的兼容 API，统一使用 Pinia store |
| **清理构建配置** | 移除所有 `@vben/*` 构建相关依赖，替换为标准配置 |
| **简化应用结构** | 移除 `apps/web-antd/` 层级，源码直接放在 `src/` 下 |
| **统一设计语言** | 建立基于 Tailwind CSS + Radix Vue 的设计令牌系统 |

### 1.3 技术选型

| 类别 | 当前 | 目标 | 说明 |
|------|------|------|------|
| 设计系统 | Ant Design Vue 4 | **shadcn-vue** + Radix Vue | 现代、轻量、无障碍 |
| 样式方案 | antd 内置主题 | **Tailwind CSS 4** + CSS 变量 | 原子化 + 设计令牌 |
| 组件基础 | antd 组件 | **Radix Vue** 原语 | 无头组件，完全可控 |
| 图标 | lucide-vue-next | 保留 lucide-vue-next | 已满足需求 |
| 状态管理 | Pinia | 保留 Pinia | 无需变更 |
| 构建工具 | Vite 8 | 保留 Vite 8 | 无需变更 |
| 通知/Toast | a-message / a-notification | **vue-sonner** | 轻量 Toast 方案 |
| 日期选择 | a-date-picker | **@internationalized/date** + Calendar | 国际化日期库 |

---

## 2. 引入 shadcn-vue

### 2.1 shadcn-vue 简介

shadcn-vue 是 shadcn/ui 的 Vue 移植版，基于 Radix Vue 原语 + Tailwind CSS。**不是 npm 包，而是复制到项目中的组件集合**，完全可定制。

### 2.2 核心依赖

```json
{
  "tailwindcss": "^4.0",
  "@tailwindcss/vite": "^4.0",
  "radix-vue": "^1.9",
  "class-variance-authority": "^0.7",
  "clsx": "^2.1",
  "tailwind-merge": "^2.5",
  "lucide-vue-next": "^0.x",
  "@vueuse/core": "^11.x"
}
```

### 2.3 设计令牌系统

> **详细规范见**：[设计系统规范 v1.0](./design-system-spec.md)（独立文档，包含完整的设计令牌、组件 API、布局规范、表单规范、表格规范）

采用 **oklch 色彩空间** + **CSS 原生变量** 方案，通过 Tailwind CSS 4 的 `@theme` 指令将变量暴露为 Tailwind 工具类（如 `bg-primary`、`text-muted-foreground`）。

#### 核心设计令牌

| 类别 | 说明 |
|------|------|
| 颜色 | background、foreground、primary、secondary、muted、accent、destructive、border、input、ring |
| 圆角 | sm (0.25rem)、md (0.375rem)、lg (0.5rem)、xl (0.75rem) |
| 间距 | 基于 0.25rem 基准（Tailwind 默认） |
| 字体 | Inter + PingFang SC，xs/sm/base/lg/xl/2xl 六档 |
| 阴影 | sm/md/lg/xl 四档 |
| 动效 | fast (150ms)、normal (250ms)、slow (350ms) |

#### 暗色模式

采用 CSS 原生 `@variant dark` 方案，替代 antd 的 `theme.darkAlgorithm`：
- 通过 `document.documentElement.classList.toggle('dark')` 切换
- 在 `app.vue` 中 `watch(preferencesStore.currentTheme, ...)` 同步切换
- 初始值从 `preferencesStore.currentTheme` 恢复（localStorage 持久化）

**国际化兼容**：shadcn 组件的 ARIA 标签通过 slot 或 prop 传入 `$t()` 翻译文本。

### 2.4 组件迁移策略

#### 2.4.1 组件对照表

| 功能区域 | 当前（antd） | 目标（shadcn-vue） | 优先级 |
|----------|-------------|-------------------|:------:|
| 按钮 | `a-button` | `Button` | P0 |
| 输入框 | `a-input` | `Input` | P0 |
| 表格 | `a-table` | `Table` | P0 |
| 表单 | `a-form` | `Label` + `Input` + `Slot` | P0 |
| 弹窗 | `a-modal` | `Dialog` | P0 |
| 下拉菜单 | `a-dropdown` | `DropdownMenu` | P1 |
| 选择器 | `a-select` | `Select` | P1 |
| 标签 | `a-tag` | `Badge` | P1 |
| 卡片 | `a-card` | `Card` | P1 |
| 提示 | `a-tooltip` | `Tooltip` | P1 |
| 确认框 | `a-popconfirm` | `AlertDialog` | P1 |
| 抽屉 | `a-drawer` | `Drawer` (vaul-vue) | P2 |
| 日期选择 | `a-date-picker` | `Calendar` + `Popover` | P2 |
| 上传 | `a-upload` | 自定义 | P2 |
| 通知 | `a-message` + `a-notification` | `Toast` (vue-sonner) | P2 |
| 面包屑 | 自定义 | `Breadcrumb` | P2 |
| 分页 | `a-pagination` | 自定义 | P2 |

#### 2.4.2 迁移原则

1. **渐进式**：按页面优先级迁移，非一次性重写
2. **共存期**：shadcn-vue 与 antd 可共存，新页面用 shadcn，旧页面逐步迁移
3. **API 兼容**：封装 composable 保持调用方式一致（如 `useTable`）
4. **组件注册**：shadcn-vue 组件按需导入（非全局注册），保持 tree-shakable

**useTable 兼容策略**：
```typescript
// 新 API 保持与现有 useTable 一致的调用签名
const { data, loading, pagination, fetchData } = useTable({
  api: getPoemsApi,
  columns: poetryColumns,
  // 组件类型：'shadcn' | 'antd'（共存期可选）
})
```

### 2.5 目录结构

```
src/
  components/
    ui/                    ← shadcn-vue 组件（复制进来）
      button.vue
      input.vue
      table.vue
      dialog.vue
      dropdown-menu.vue
      ...
    layout/                ← 布局组件
      Sidebar.vue
      HeaderBar.vue
      Breadcrumb.vue
    business/              ← 业务组件
      PageHeader.vue
      TableAction.vue
  styles/
    globals.css            ← Tailwind 入口 + 设计令牌（唯一样式入口）
  lib/
    utils.ts               ← 扩展：cn() 工具（clsx + tailwind-merge）
  index.html               ← 应用入口 HTML（从 apps/web-antd/ 移入）
public/                    ← 静态资源（从 apps/web-antd/ 移入，如存在）
```

**ECharts 共存方案**：ECharts 通过容器 div 渲染，不受 CSS 影响，仅需外层容器使用 shadcn 样式即可。

---

## 3. 移除 Vben 兼容层

### 3.1 当前问题

`src/stores/preferences.ts` 第 247-334 行保留了完整的 `@vben/preferences` 兼容 API：

```typescript
// 这些是 Vben 兼容层，需要移除
export function initPreferences(pinia?: any) { ... }
export function usePreferences(pinia?: any) { ... }
export const preferences = { ... }  // 全局单例对象
```

### 3.2 迁移计划

#### 3.2.1 `preferences` 全局对象 → 直接使用 Pinia store

**当前用法**：
```typescript
import { preferences } from '#/stores/preferences';
// preferences.app.compact
// preferences.app.locale
```

**目标用法**：
```typescript
import { usePreferencesStore } from '#/stores/preferences';
const preferencesStore = usePreferencesStore();
// preferencesStore.app.compact
// preferencesStore.app.locale
```

#### 3.2.2 `usePreferences()` composable → 保留但简化

保留 `usePreferences()` 作为便捷 composable，但移除 Vben 兼容逻辑：

```typescript
export function usePreferences() {
  const store = usePreferencesStore();
  const isDark = computed(() => store.currentTheme === 'dark');
  const isCompact = computed(() => store.app.compact);
  return { isDark, isCompact, store };
}
```

#### 3.2.3 `initPreferences()` → 移除

`bootstrap.ts` 中的 `preferences.setStore()` 调用改为直接使用 store：

```typescript
// 之前
const preferencesStore = usePreferencesStore(pinia);
preferences.setStore(preferencesStore);

// 之后
const preferencesStore = usePreferencesStore(pinia);
// 直接使用 preferencesStore，无需 setStore
```

### 3.3 影响范围分析

| 文件 | 当前用法 | 迁移方式 |
|------|----------|----------|
| `app.vue` | `preferences.app.compact` | → `usePreferencesStore().app.compact` |
| `bootstrap.ts` | `preferences.setStore()` | → 移除，直接使用 store |
| `locales/index.ts` | `preferences.app.locale` | → `usePreferencesStore().app.locale` |
| `lib/request.ts` | `preferencesStore` 直用 | 不变 |
| `store/auth.ts` | `preferencesStore` 直用 | 不变 |

### 3.4 注释清理

所有源文件中的 `@vben` 注释（共 22 处）需要清理或更新：

```typescript
// 之前
/**
 * 替代 @vben/preferences
 */

// 之后
/**
 * 主题/暗色/语言偏好设置
 */
```

---

## 4. 构建配置清理

### 4.1 当前残留

| 文件 | 当前依赖 | 替换方案 |
|------|----------|----------|
| `oxfmt.config.ts` | `@vben/oxfmt-config` | 标准 oxfmt 配置或移除 |
| `oxlint.config.ts` | `@vben/oxlint-config` | 标准 oxlint 配置或移除 |
| `stylelint.config.mjs` | `@vben/stylelint-config` | 标准 stylelint 配置或移除 |
| `turbo.json` | `@vben/backend-mock#build` | 移除（单应用无需 turbo） |
| `cspell.json` | `"vben"`, `"vbenjs"` 词汇 | 移除 |

### 4.2 清理清单

- [ ] 移除 `turbo.json`（或清空为 `{}`）
- [ ] 移除 `oxfmt.config.ts` 中的 `@vben/oxfmt-config` 依赖
- [ ] 移除 `oxlint.config.ts` 中的 `@vben/oxlint-config` 依赖
- [ ] 移除 `stylelint.config.mjs` 中的 `@vben/stylelint-config` 依赖
- [ ] 清理 `cspell.json` 中的 vben 词汇
- [ ] 清理 `package.json` 中残留的 `@vben/*` devDependencies
- [ ] 清理 `README.md` 中的 Vben 相关说明

---

## 5. 实施计划

### 5.1 阶段划分

| 阶段 | 内容 | 预估工时 |
|------|------|:--------:|
| **阶段 0** | 简化应用结构（移除 apps/web-antd 层级） | 0.5 天 |
| **阶段 1** | 引入 Tailwind CSS 4 + 设计令牌 | 2-3 天 |
| **阶段 2** | 安装 shadcn-vue 核心组件（P0） | 3-5 天 |
| **阶段 3** | 移除 Vben 兼容层 | 1 天 |
| **阶段 4** | 构建配置清理 | 0.5 天 |
| **阶段 5** | 页面迁移（新 shadcn 页面） | 7-10 天 |
| **阶段 6** | 测试 + 文档更新 | 1-2 天 |

### 5.2 阶段 0：简化应用结构

**目标**：移除 `apps/web-antd/` 冗余层级，简化项目结构。

**当前结构**：
```
apps/
  web-antd/          ← 唯一应用
    src/
    package.json
    vite.config.ts
    tsconfig.json
```

**目标结构**：
```
src/                 ← 应用源码直接放根目录
package.json         ← 合并根配置
vite.config.ts
tsconfig.json
```

**操作步骤**：
1. 将 `apps/web-antd/src/` 移到根目录 `src/`
2. 将 `apps/web-antd/index.html` 移到根目录
3. 将 `apps/web-antd/public/` 移到根目录（如存在）
4. 合并 `apps/web-antd/package.json` 到根 `package.json`（保留 `imports` 字段 `"#/*": "./src/*"`）
5. 将 `apps/web-antd/vite.config.ts` 移到根目录
6. 将 `apps/web-antd/tsconfig.json` 相关配置合并到根 `tsconfig.json`（保留 `paths` 中 `#/*` 映射）
7. 更新 `pnpm-workspace.yaml`（移除 `apps/*`，改为单包；`catalog` 机制保留用于版本管理）
8. 确认路径别名 `#/*` 仍正确映射到 `./src/*`（无需变更）
9. 更新 `.vscode/launch.json` 的 `webRoot` 为 `${workspaceFolder}`
10. 删除 `apps/` 目录

**影响范围**：
| 文件 | 变更 |
|------|------|
| `pnpm-workspace.yaml` | 移除 `apps/*` 包声明，保留 catalog |
| `package.json` | 合并依赖、脚本，保留 `imports` 字段 |
| `vite.config.ts` | 移到根目录 |
| `tsconfig.json` | 合并配置，保留 `paths.#/*` |
| `index.html` | 移到根目录 |
| `public/` | 移到根目录（如存在） |
| `.vscode/launch.json` | 更新 `webRoot` |
| `CLAUDE.md` | 更新路径引用 |

### 5.3 阶段 1：Tailwind CSS 4 集成

1. 安装 `tailwindcss@4` + `@tailwindcss/vite`
2. 配置 `vite.config.ts` 添加 Tailwind 插件
3. 创建 `src/styles/globals.css` 入口文件
4. 定义设计令牌（CSS 变量）
5. 实现暗色模式切换逻辑（`app.vue` 中 watch `currentTheme`，toggle `document.documentElement.className`）
6. **处理样式优先级**：使用 `@layer base` 或 Tailwind 的 `important` 策略，避免 antd 样式覆盖 Tailwind 工具类

### 5.4 阶段 2：shadcn-vue 核心组件

1. 初始化 shadcn-vue（`npx shadcn-vue@latest init`）
2. 安装 P0 组件：Button、Input、Table、Dialog、Label
3. 安装 P1 组件：DropdownMenu、Select、Badge、Tooltip、AlertDialog、Card
4. 验证组件在现有布局中正常工作

### 5.5 阶段 3：Vben 兼容层移除

1. 移除 `preferences.ts` 中的兼容 API（第 247-334 行）
2. 更新 `app.vue`、`bootstrap.ts`、`locales/index.ts`
3. 清理所有 `@vben` 注释
4. 运行 typecheck + build 验证

### 5.6 阶段 4：构建配置清理

1. 移除/简化 turbo.json
2. 替换 oxfmt、oxlint、stylelint 配置
3. 清理 package.json devDependencies
4. 清理 README

### 5.7 阶段 5：页面迁移

按以下顺序迁移页面：
1. 登录页（Auth）
2. 布局框架（Sidebar、Header）
3. Dashboard
4. 诗歌管理（列表 + 表单）
5. 作者管理
6. 其余页面

### 5.8 阶段 6：测试 + 文档更新

1. 全量功能回归测试
2. 更新 CLAUDE.md 中的路径引用
3. 更新 `.project/planning/` 中的实施文档（如保留）

---

## 6. 验收标准

### 6.1 设计系统

- [ ] shadcn-vue 组件可正常运行
- [ ] 暗色/亮色模式切换正常
- [ ] 设计令牌（CSS 变量）正确应用
- [ ] 无障碍（a11y）基础合规（键盘导航、焦点管理）

### 6.2 Vben 清理

- [ ] `src/` 目录下零 `@vben` 引用（代码 + 注释）
- [ ] `preferences.ts` 无兼容层代码
- [ ] `package.json` 零 `@vben/*` 依赖
- [ ] 构建配置无 `@vben/*` 依赖
- [ ] typecheck 通过
- [ ] build 通过

### 6.3 结构简化

- [ ] `apps/` 目录已移除
- [ ] 源码直接在 `src/` 下
- [ ] `index.html` 已移到根目录
- [ ] `pnpm-workspace.yaml` 已更新为单包模式
- [ ] 所有路径引用已更新
- [ ] `.vscode/launch.json` 已更新

### 6.4 功能回归

- [ ] 登录/退出流程正常
- [ ] 所有 CRUD 页面功能正常
- [ ] 暗色模式在所有页面生效
- [ ] 路由守卫正常工作

---

## 7. 风险评估

| 风险 | 等级 | 缓解措施 |
|------|:----:|----------|
| antd 与 Tailwind 样式优先级冲突 | 🔴 高 | 使用 `@layer` 或 `important` 策略；共存期隔离作用域 |
| shadcn-vue 与 antd 样式冲突 | 🟡 中 | 共存期隔离，逐步迁移；Tailwind 作用域控制 |
| Tailwind 4 兼容性 | 🟡 中 | 确认 Vite 8 支持；必要时降级到 Tailwind 3 |
| 暗色模式切换逻辑重构 | 🟡 中 | 保留 `preferencesStore.currentTheme` 状态，仅改 CSS 应用层 |
| 批量迁移页面工作量大 | 🟡 中 | 按优先级分批迁移，非核心页面可延后 |
| Radix Vue 组件功能缺失 | 🟢 低 | 复杂场景可回退到 antd 组件 |
| shadcn-vue 组件版本锁定 | 🟡 中 | 复制进来的组件不自动更新，需手动同步上游变更 |
| 团队学习曲线 | 🟡 中 | Radix Vue API 与 antd 差异大，预留熟悉时间 |

---

## 8. 与 v2.0 差异

| 变更项 | v2.0 | v3.0 |
|--------|------|------|
| UI 库 | Ant Design Vue 4 | **shadcn-vue** + Radix Vue |
| 样式方案 | antd theme | **Tailwind CSS 4** + CSS 变量 |
| 暗色模式 | antd darkAlgorithm | **CSS `@variant dark`** |
| Vben 兼容层 | 保留兼容 API | **完全移除** |
| 构建配置 | 含 @vben/* 依赖 | **零 @vben 依赖** |
| 组件来源 | antd 内置 | **复制到项目，完全可定制** |
| 应用结构 | `apps/web-antd/` 多应用 | **单应用 `src/`** |

---

## 9. 文档结构

```
docs/
  PRD-v3.0-design-system.md    ← 本文件（产品需求 & 实施计划）
  design-system-spec.md        ← 设计系统规范（设计令牌、组件 API、布局规范）
```

> 设计令牌、组件 API 指南、页面布局规范等详细内容已拆分到 [design-system-spec.md](./design-system-spec.md)，本 PRD 仅保留需求概述和实施计划。

---

## 10. 参考资料

- [shadcn-vue 官方文档](https://www.shadcn-vue.com/)
- [Radix Vue 原语](https://www.radix-vue.com/)
- [Tailwind CSS 4 文档](https://tailwindcss.com/docs)
- [Vaul Vue (Drawer)](https://vaul.unovue.com/)
- [vue-sonner (Toast)](https://sonner.emilkowal.ski/)
