# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this project.

## Project Overview

**poem-admin** (晓诗诗词管理后台) — a poetry content management system built with **Vue 3 + Vite 8 + TypeScript 6 + Ant Design Vue 4**.

Originally forked from [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin), the project has been **fully migrated away from the Vben framework**. All `@vben/*` packages have been replaced with custom implementations or native Ant Design Vue components. See `.project/` for project-specific documentation.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Active development branch — all custom work happens here |
| `release` | Release preparation |

## Common Commands

```bash
# Install dependencies (requires pnpm)
pnpm install

# Start dev server (default port 5666)
pnpm dev

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
apps/
  web-antd/          ← The only app (Ant Design Vue)

src/                 ← All application code lives here
  api/               ← API functions (auth, poetry, author, user, etc.)
  components/        ← Shared components (Sidebar, HeaderBar, Breadcrumb, TableAction, etc.)
  composables/       ← Composables (useTable)
  constants/         ← Route constants, permission codes
  layouts/           ← Layout.vue, AuthLayout.vue
  lib/               ← Core libraries (request, utils, pinyin, stores, access)
  locales/           ← i18n setup and language files
  plugins/           ← vue-i18n plugin
  router/            ← Router config, guards, access, routes
  store/             ← Auth store
  stores/            ← Pinia stores (preferences, access, user)
  types/             ← Global type definitions
  views/             ← Feature views (poetry, author, user, checkin, category, tools, system)
```

### Key Patterns

**Request Client** (`apps/web-antd/src/lib/request.ts`):
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

- **Backend proxy**: `/api` → `http://localhost:8081` with rewrite to `/api/admin` (see `vite.config.ts`)
- **Login page**: Removed default account selection — users must enter credentials manually
- **Routes pruned**: `/vben-admin/*`, `/demos/*`, `/profile` removed from navigation
- **Backend**: Real API at `http://localhost:8081/api/admin` (separate session manages this)

## Vben Migration — COMPLETE ✅

> **核心决策：脱离 Vben，渐进式迁移到纯 Vue 3 + Ant Design Vue** — 已完成

### 迁移进度

- [x] 阶段 1：基础设施替换 ✅
- [x] 阶段 2：布局系统重建 ✅
- [x] 阶段 3：表单 & 表格替换 ✅
- [x] 阶段 4：视图层清理 ✅
- [x] 阶段 5：构建系统清理 ✅

### 替代方案速查

| Vben 模块 | 替换为 |
|-----------|--------|
| @vben/request | 自建 axios 封装 (`src/lib/request.ts`) |
| @vben/preferences | pinia + localStorage (`src/stores/preferences.ts`) |
| @vben/locales | vue-i18n (`src/plugins/i18n.ts`) |
| @vben/icons | lucide-vue-next + @ant-design/icons-vue |
| @vben/utils | lodash-es (`src/lib/utils.ts`) |
| @vben/layouts | a-layout + 自定义组件 (`src/layouts/`) |
| @vben/common-ui | a-table/a-form/a-modal 原生 |
| @vben/plugins/vxe-table | a-table |
| @vben/stores | 自建 pinia stores (`src/stores/`) |
| @vben/constants | 自建 constants (`src/constants/`) |
| @vben/types | 自建 types (`src/types/`) |
| @vben/access | 自建 access (`src/lib/access.ts`) |
| @vben/vite-config | 原生 vite defineConfig (`vite.config.ts`) |

### 自建核心文件

| 文件 | 说明 | 替代 |
|------|------|------|
| `src/lib/request.ts` | axios 封装 + 拦截器 + token 刷新 | @vben/request |
| `src/lib/utils.ts` | 工具函数（traverseTreeValues, startProgress 等） | @vben/utils |
| `src/lib/pinyin.ts` | 拼音声调工具 | @vben/utils (pinyin) |
| `src/lib/stores.ts` | pinia 初始化 | @vben/stores |
| `src/lib/access.ts` | 路由权限注册 | @vben/access |
| `src/stores/preferences.ts` | 主题/暗色/语言偏好 | @vben/preferences |
| `src/stores/access.ts` | accessToken、accessCodes | @vben/stores |
| `src/stores/user.ts` | userInfo | @vben/stores |
| `src/plugins/i18n.ts` | vue-i18n 配置 | @vben/locales |
| `src/constants/index.ts` | 路由常量、权限码 | @vben/constants |
| `src/types/index.ts` | 全局类型定义 | @vben/types |
| `src/composables/useTable.ts` | 表格数据加载 | useVbenVxeGrid |
| `src/composables/useWatermark.ts` | 水印功能 | @vben/hooks |

### 已删除的 Vben 内容

- `packages/` — Vben 框架包（@core, effects, constants, locales, stores, styles, types, utils, icons, preferences）
- `internal/` — Vben 构建/lint 配置（vite-config, lint-configs, tsconfig, tailwind-config）
- `apps/web-ele/`, `apps/web-naive/`, `apps/web-tdesign/`, `apps/web-antdv-next/`, `apps/backend-mock/`, `apps/playground/` — 未使用的上游应用
- `src/adapter/` — Vben 组件适配器
- `src/preferences.ts`, `src/layouts/basic.vue`, `src/layouts/auth.vue` — Vben 布局文件
- 所有 Vben 演示文件（dashboard/analytics, dashboard/workspace, _core/profile, demos 等）

**验证结果**：`src/` 目录下零 `@vben/` 引用 ✅ | 零 `@vben/*` 依赖 ✅ | typecheck 通过 ✅ | build 通过 ✅

## Project-Specific Documentation

All custom project docs live in `.project/` (independent from upstream `docs/`):

```
.project/
  docs/PRD-v2.0-admin.md    ← 后台管理 PRD（最新版 v2.0）：功能需求、路由结构、API 对接、验收标准
  docs/PRD-v1.0-admin.md    ← 旧版 PRD（参考）
  docs/requirements.md      ← Product requirements (旧版)
  docs/feature-painpoint-analysis.md ← 痛点分析：功能痛点、优化方向
  planning/frontend-plan.md ← Implementation roadmap
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
- Vue 3 + Vite 8 + TypeScript 6 + Ant Design Vue 4
