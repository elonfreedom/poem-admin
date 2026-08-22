# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **fork** of [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin), customized as a **poetry admin management system** (poem-admin). The original project is a generic Vue 3 admin template; this fork is being adapted for poetry content management.

**Key distinction**: This fork maintains its own feature set separate from upstream. See `.project/` for project-specific documentation.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Sync only from upstream — never commit custom code here |
| `develop` | Active development branch — all custom work happens here |
| `release` | Release preparation |

**Sync workflow**: `upstream/main` → `main` → merge into `develop`. Never develop directly on `main`.

## Common Commands

```bash
# Install dependencies (requires pnpm)
pnpm install

# Start dev server for web-antd app (default for this project)
pnpm dev:antd

# Build specific app
pnpm build:antd

# Type checking
pnpm check:type

# Lint (oxlint + eslint + stylelint via lefthook on commit)
pnpm lint
pnpm format

# Unit tests
pnpm test:unit

# Clean build artifacts
pnpm clean
```

## Architecture

### Monorepo Structure (pnpm workspace + turbo)

```
apps/
  web-antd/          ← Primary app for this project (Ant Design Vue)
  web-ele/           ← Element Plus variant (not used)
  web-naive/         ← Naive UI variant (not used)
  web-tdesign/       ← TDesign variant (not used)
  backend-mock/      ← Nitro-based mock server (replaced by real backend)

packages/
  @core/             ← Core packages (ui-kit, composables, layouts)
  effects/           ← Feature packages (access, common-ui, hooks, layouts, plugins, request)
  constants/         ← Shared constants
  locales/           ← i18n translations
  stores/            ← Pinia stores
  styles/            ← Shared styles

internal/
  vite-config/       ← Shared Vite configuration (defineConfig wrapper)
  lint-configs/      ← ESLint, oxlint, stylelint configs
```

### Key Patterns

**Request Client** (`apps/web-antd/src/api/request.ts`):
- Uses `@vben/request` (axios-based)
- Response format: `{ code: 0, data: any, error: null, message: "ok" }`
- `code: 0` = success; non-zero = error
- API URL configured via `VITE_GLOB_API_URL` env variable
- Auth: JWT Bearer token in Authorization header

**Routing**:
- Core routes in `apps/web-antd/src/router/routes/core.ts` (login, auth pages)
- Feature routes in `apps/web-antd/src/router/routes/modules/` (per-module route files)
- Routes are lazy-loaded via `import.meta.glob`

**Configuration Sharing**:
- `defineConfig` from `@vben/vite-config` wraps Vite config with project defaults
- Dependencies managed via pnpm `catalog:` protocol for version consistency

### Current Customization

- **Backend proxy**: `/api` → `http://localhost:8081` with rewrite to `/api/admin` (see `apps/web-antd/vite.config.ts`)
- **Login page**: Removed default account selection — users must enter credentials manually
- **Routes pruned**: `/vben-admin/*`, `/demos/*`, `/profile` removed from navigation (files retained for upstream merge compatibility)
- **Backend**: Real API at `http://localhost:8081/api/admin` (separate session manages this)

## Project-Specific Documentation

All custom project docs live in `.project/` (independent from upstream `docs/`):

```
.project/
  docs/requirements.md      ← Product requirements
  planning/frontend-plan.md ← Implementation roadmap
```

## API Contract

Backend responses must follow:
```json
{ "code": 0, "data": {}, "error": null, "message": "ok" }
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
