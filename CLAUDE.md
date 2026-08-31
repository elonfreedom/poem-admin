# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this project.

## Project Overview

**poem-admin** (晓诗诗词管理后台) — a poetry content management system built with **Vue 3 + Vite 8 + TypeScript 6**.

Originally forked from [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin), the project has been **fully migrated away from the Vben framework** and **fully migrated from Ant Design Vue to shadcn-vue + Tailwind CSS 4**. See `docs/` for project-specific documentation.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Active development branch — all custom work happens here |
| `release` | Release preparation |

## Backend Environment Rule

> **⚠️ 必须使用生产环境后端**

开发时**始终使用生产环境后端**，不要连接本地后端。默认 `pnpm dev` 会代理到生产 API。

| 命令 | 模式 | 后端地址 | 用途 |
|------|------|----------|------|
| `pnpm dev` | `devprod` | `https://admin-api.poem.simpledefine.fun` | **默认开发命令** |
| `pnpm dev:local` | `development` | `http://localhost:8081` | 仅当本地有后端时使用 |
| `pnpm build` | `production` | 生产环境打包 | 部署用 |

- 生产后端地址：`https://admin-api.poem.simpledefine.fun/api/admin`
- Vite 代理：`/api` → 重写为 `/api/admin` → 转发到生产后端
- 如需修改后端地址，编辑 `vite.config.ts` 中的 `apiTarget`

## Common Commands

```bash
# Install dependencies (requires pnpm)
pnpm install

# Start dev server with production backend (DEFAULT)
pnpm dev

# Start dev server with local backend (rarely used)
pnpm dev:local

# Production build
pnpm build

# Type checking
pnpm typecheck

# Preview production build
pnpm preview
```

## Architecture

### Project Structure (pnpm workspace, single app)

```
src/                 ← All application code lives here
  api/               ← API functions (auth, poetry, author, user, etc.)
  components/        ← Shared components (ui/, layout/, business/)
  composables/       ← Composables (useTable)
  constants/         ← Route constants, permission codes
  layouts/           ← Layout.vue, AuthLayout.vue
  lib/               ← Core libraries (request, utils, pinyin, stores, access)
  locales/           ← i18n setup and language files
  plugins/           ← vue-i18n plugin
  router/            ← Router config, guards, access, routes
  store/             ← Auth store
  stores/            ← Pinia stores (preferences, access, user)
  styles/            ← Tailwind CSS entry + design tokens (globals.css)
  types/             ← Global type definitions
  views/             ← Feature views (poetry, author, user, checkin, category, tools, system)
```

### Key Patterns

**Request Client** (`src/lib/request.ts`):
- Custom `RequestClient` class (axios-based), replaces `@vben/request`
- Response format: `{ code: 0, data: any, error: null, message: "ok" }`
- `code: 0` = success; non-zero = error
- API URL configured via `VITE_GLOB_API_URL` env variable
- Auth: JWT Bearer token in Authorization header
- `requestClient` — full interceptors (auth, business data unwrap, 401 token refresh)
- `baseRequestClient` — minimal (only unwraps AxiosResponse), used for token refresh/logout

**Routing**:
- Core routes in `src/router/routes/core.ts` (login, auth pages)
- Feature routes in `src/router/routes/modules/` (per-module route files)
- Routes are lazy-loaded via `import.meta.glob`

**State Management**:
- Pinia stores in `src/stores/` (preferences, access, user)
- Auth store in `src/store/auth.ts`
- Plain localStorage for persistence (no SecureLS)

**i18n**:
- vue-i18n setup in `src/plugins/i18n.ts`
- Language files in `src/locales/langs/` (JSON format)

**Path Alias**:
- `#/*` maps to `./src/*` (configured in tsconfig.json paths + Vite resolve.tsconfigPaths)

### Current Customization

- **Backend proxy**: `/api` → rewrite to `/api/admin` → proxy to `https://admin-api.poem.simpledefine.fun` (see `vite.config.ts`)
- **Default dev backend**: Production API (`pnpm dev` uses `devprod` mode, proxies to production)
- **Local backend**: Only via `pnpm dev:local` → `http://localhost:8081` (rarely used)
- **Login page**: Removed default account selection — users must enter credentials manually
- **Post-login redirect**: Always redirect to `/dashboard/overview` (data overview), ignoring backend `homePath`
- **Routes pruned**: `/vben-admin/*`, `/demos/*`, `/profile` removed from navigation
- **HeaderBar**: 顶栏包含折叠按钮、搜索框、暗色模式切换、全屏、用户菜单（无通知中心）
- **Sidebar**: 使用设计系统令牌（`--color-sidebar-*`），支持图标、折叠后显示图标
- **Dashboard**: 已完全移除 antd 组件，使用 shadcn-vue + Tailwind
- **Layout**: 顶栏毛玻璃效果（`backdrop-blur-md`），侧边栏宽度 220px（折叠 64px）

### Vue SFC 注意事项

> ⚠️ `<script lang="ts" setup>` 必须写成 `<script lang="ts" setup >`（setup 后有空格）

Vue 编译器会将 `setup>` 解析为属性名而非 `setup` 属性 + 闭合标签，导致模板中无法访问 script 内定义的变量。症状：`Property 'xxx' does not exist on type 'CreateComponentPublicInstance...'`

## Design System — 水墨诗意 · 东方雅韵

> **设计理念**：以「水墨诗意」为核心，融合中国传统文化元素与现代 UI 设计。亮色如宣纸作画，暗色如碑帖拓印。

### 设计系统文档

详见 `docs/design-system/` 目录：

| 文件 | 内容 | 关键规则 |
|------|------|----------|
| @docs/design-system/README.md | 设计理念、文档索引、快速参考 | 核心色彩、字体角色、间距基数 |
| @docs/design-system/01-color.md | 色彩系统 | oklch 色彩空间、主色/中性色/语义色、双模式对照 |
| @docs/design-system/02-typography.md | 字体排版 | 衬线标题/无衬线正文/等宽数据、类型比例 |
| @docs/design-system/03-layout.md | 布局规范 | 4px 间距基数、圆角/阴影层级、毛玻璃效果 |
| @docs/design-system/04-components.md | 组件规范 | 卡片/按钮/输入框/导航/印章/主题切换 |
| @docs/design-system/05-motion.md | 动效规范 | 时间尺度、缓动函数、入场动画、无障碍 |
| @docs/design-system/06-theming.md | 主题适配 | 亮色/暗色双模式、切换交互、验收标准 |

### 技术栈

| 类别 | 方案 |
|------|------|
| UI 组件 | shadcn-vue（复制到项目，非 npm 包） |
| 样式 | Tailwind CSS 4 + CSS 变量 |
| 组件原语 | Radix Vue |
| 图标 | lucide-vue-next |
| 设计令牌 | oklch 色彩空间 + CSS 变量 |
| 暗色模式 | `@custom-variant dark` + `.dark` class 切换 |
| Toast | vue-sonner |

### 设计令牌

- CSS 变量定义在 `src/styles/globals.css` 的 `@theme` 块
- 通过 `@theme` 暴露为 Tailwind 工具类（如 `bg-primary`、`text-muted-foreground`）
- 暗色模式通过 `@custom-variant dark (&:where(.dark, .dark *))` 启用
- 暗色颜色覆盖在 `.dark { ... }` 块中

### 工具函数

- `cn(...inputs)` — `clsx` + `twMerge`，合并 Tailwind 类名（`src/lib/utils.ts`）

### 迁移状态

- ✅ 阶段 0：简化应用结构（移除 apps/web-antd 层级）
- ✅ 阶段 1：引入 Tailwind CSS 4 + 设计令牌
- ✅ 阶段 2：安装 shadcn-vue 核心组件（P0）
- ✅ 阶段 3：移除 Vben 兼容层
- ✅ 阶段 4：构建配置清理
- ✅ 阶段 5：页面迁移（全部页面已迁移到 shadcn-vue）
- ⏳ 阶段 6：测试 + 文档更新

### Ant Design 移除 — COMPLETE ✅

- ✅ 所有页面已移除 antd 组件引用
- ✅ `ant-design-vue` 和 `@ant-design/icons-vue` 已从 package.json 移除
- ✅ 所有 antd 图标替换为 lucide-vue-next
- ✅ 所有 antd message/notification 替换为 vue-sonner toast

## Vben Migration — COMPLETE ✅

> **核心决策：脱离 Vben** — 已完成

### 替代方案速查

| Vben 模块 | 替换为 |
|-----------|--------|
| @vben/request | 自建 axios 封装 (`src/lib/request.ts`) |
| @vben/preferences | pinia + localStorage (`src/stores/preferences.ts`) |
| @vben/locales | vue-i18n (`src/plugins/i18n.ts`) |
| @vben/icons | lucide-vue-next |
| @vben/utils | lodash-es (`src/lib/utils.ts`) |
| @vben/layouts | a-layout + 自定义组件 (`src/layouts/`) |
| @vben/common-ui | shadcn-vue 组件 |
| @vben/stores | 自建 pinia stores (`src/stores/`) |
| @vben/constants | 自建 constants (`src/constants/`) |
| @vben/types | 自建 types (`src/types/`) |
| @vben/access | 自建 access (`src/lib/access.ts`) |
| @vben/vite-config | 原生 vite defineConfig (`vite.config.ts`) |

### 自建核心文件

| 文件 | 说明 |
|------|------|
| `src/lib/request.ts` | axios 封装 + 拦截器 + token 刷新 |
| `src/lib/utils.ts` | 工具函数（cn, traverseTreeValues, startProgress 等） |
| `src/lib/pinyin.ts` | 拼音声调工具 |
| `src/lib/stores.ts` | pinia 初始化 |
| `src/lib/access.ts` | 路由权限注册 |
| `src/stores/preferences.ts` | 主题/暗色/语言偏好 |
| `src/stores/access.ts` | accessToken、accessCodes |
| `src/stores/user.ts` | userInfo |
| `src/plugins/i18n.ts` | vue-i18n 配置 |
| `src/constants/index.ts` | 路由常量、权限码 |
| `src/types/index.ts` | 全局类型定义 |
| `src/composables/useTable.ts` | 表格数据加载 |
| `src/styles/globals.css` | Tailwind 入口 + 设计令牌 |

## Project-Specific Documentation

All custom project docs live in `docs/`:

```
docs/
  PRD-v3.0-design-system.md    ← 设计系统重构 PRD（最新版 v3.0）
  design-system-spec.md        ← 设计系统规范（设计令牌、组件 API）
  PRD-v2.0-admin.md            ← 后台管理 PRD（旧版 v2.0）
  PRD-v1.0-admin.md            ← 旧版 PRD（参考）
  requirements.md              ← Product requirements (旧版)
  feature-painpoint-analysis.md ← 痛点分析
```

## API Contract

Backend responses must follow:
```json
{ "code": 0, "data: {}, "error: null, "message: "ok" }
```

Error format:
```json
{ "code": -1, "data": null, "error": "description", "message": "description" }
```

Auth test account: `admin@xiaoshi.app` / `admin123456`

## Environment

- Node.js: 24.x (see `.node-version`)
- pnpm: 11.x (required — enforced by `preinstall` script)
- Vue 3 + Vite 8 + TypeScript 6
