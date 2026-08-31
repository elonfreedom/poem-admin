# 晓诗后台管理 PRD v2.0

> **版本**：v2.0 · **日期**：2026-08-30 · **状态**：已评审
> **项目**：poem-admin（Vue 3 + Ant Design Vue，脱离 Vben）
> **用户**：运营人员 / 管理员

---

## 1. 产品定位

poem-admin 是晓诗的 **B 端运营管理后台**，面向内容运营人员与管理员，提供诗歌内容管理、用户管理、数据统计、系统配置等能力。

### 1.1 设计原则

1. **效率优先**：批量操作、快捷筛选、内联编辑
2. **数据驱动**：实时统计图表，辅助内容决策
3. **安全可控**：角色权限分离，操作可审计
4. **简洁实用**：避免过度工程，聚焦核心功能

### 1.2 技术栈

| 类别 | 选择 | 说明 |
|------|------|------|
| 框架 | Vue 3 + TypeScript | 组合式 API |
| 构建 | Vite 8 | 快速开发 |
| UI 库 | Ant Design Vue 4 | 组件丰富 |
| 基础模板 | **脱离 Vben** | 自建 layouts/request/preferences |
| 状态 | Pinia | 轻量状态管理 |
| 国际化 | vue-i18n | 替代 @vben/locales |
| 图表 | ECharts | 数据可视化 |
| 图标 | lucide-vue-next | 替代 @vben/icons |
| 工具 | lodash-es | 替代 @vben/utils |
| 部署 | Docker + 阿里云 ECS | 容器化 |

### 1.3 Vben 框架策略

> **核心决策：脱离 Vben，渐进式迁移到纯 Vue 3 + Ant Design Vue**

#### Vben 依赖全景图（5 层渗透）

```
┌─────────────────────────────────────────────────────────────────────┐
│  第 1 层：应用入口（main.ts / bootstrap.ts / app.vue）              │
│  initPreferences() · initStores() · registerAccessDirective()       │
│  registerLoadingDirective() · @vben/styles · MotionPlugin           │
├─────────────────────────────────────────────────────────────────────┤
│  第 2 层：布局系统（layouts/）                                       │
│  BasicLayout · AuthPageLayout · UserDropdown · Notification         │
│  LockScreen · LoginExpiredModal                                     │
├─────────────────────────────────────────────────────────────────────┤
│  第 3 层：网络请求（api/request.ts）                                │
│  RequestClient · authenticateResponseInterceptor                    │
│  defaultResponseInterceptor · errorMessageResponseInterceptor       │
├─────────────────────────────────────────────────────────────────────┤
│  第 4 层：表单 & 表格（adapter/）                                   │
│  useVbenForm · useVbenVxeGrid · setupVbenForm · ComponentAdapter    │
├─────────────────────────────────────────────────────────────────────┤
│  第 5 层：视图层（views/）                                          │
│  Page · useVbenModal · useVbenDrawer · VbenButton · Fallback        │
│  EchartsUI · useEcharts · $t (i18n) · preferences                  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 迁移计划（4 阶段，12-18 天）

> 基于完整依赖扫描，共涉及 14 个 @vben/* 运行时包、42 个视图文件、5 层架构渗透。

**阶段 1：基础设施替换（2-3 天）**

| Vben 模块 | 替换为 | 说明 |
|-----------|--------|------|
| `@vben/request` (RequestClient) | 自建 `axios` 封装 | 保留拦截器逻辑（token 注入、401 处理、token 刷新） |
| `@vben/preferences` | `pinia` + `localStorage` | 暗色模式、紧凑模式、水印配置 |
| `@vben/stores` | 自建 Pinia stores | useAccessStore、useUserStore |
| `@vben/locales` (`$t`) | `vue-i18n` | 迁移现有语言包 JSON |
| `@vben/constants` | 自建常量文件 | LOGIN_PATH、路由白名单 |
| `@vben/hooks` | 自建 composables | useWatermark、useSortable |
| `@vben/utils` | lodash-es / 自建 | cloneDeep、merge、isEmpty 等 |
| `@vben/types` | 自建 types | UserInfo、RouteRecordStringComponent 等 |

产出：
- `src/lib/request.ts` — axios 封装（拦截器、token 注入、错误处理、token 刷新）
- `src/stores/preferences.ts` — 主题/暗色/语言偏好
- `src/stores/access.ts` — accessToken、accessCodes
- `src/stores/user.ts` — userInfo
- `src/plugins/i18n.ts` — vue-i18n 配置
- `src/constants/index.ts` — 路由常量、权限码
- `src/types/index.ts` — 全局类型定义
- `src/composables/useWatermark.ts` — 水印功能

**阶段 2：布局系统重建（2-3 天）**

| Vben 组件 | 替换为 | 说明 |
|-----------|--------|------|
| `BasicLayout` | 自定义 `Layout.vue` | a-layout + a-layout-sider + a-layout-header |
| `AuthPageLayout` | 自定义 `AuthLayout.vue` | 居中卡片布局 |
| `UserDropdown` | 自定义 `UserMenu.vue` | a-dropdown |
| `Notification` | 简化版或移除 | 非核心功能 |
| `LockScreen` | 移除 | 非核心功能 |
| `LoginExpiredModal` | 自定义 Modal | a-modal |

产出：
- `src/layouts/Layout.vue` — 主布局（侧边栏 + 顶栏 + 内容区 + 面包屑）
- `src/layouts/AuthLayout.vue` — 登录页布局
- `src/components/Sidebar.vue` — 菜单导航（a-menu）
- `src/components/HeaderBar.vue` — 顶栏（搜索、用户菜单、暗色切换）
- `src/components/Breadcrumb.vue` — 面包屑导航

**阶段 3：表单 & 表格替换（3-5 天）**

| Vben 组件 | 替换为 | 说明 |
|-----------|--------|------|
| `useVbenForm` / `setupVbenForm` | 直接使用 `a-form` | 表单校验逻辑保留 |
| `useVbenVxeGrid` | `a-table` + 自建 useTable | 分页、筛选、排序 |
| `useVbenModal` | `a-modal` + `v-model` | 弹窗控制 |
| `useVbenDrawer` | `a-drawer` + `v-model` | 抽屉控制 |
| `VbenButton` | `a-button` | 原生按钮 |
| `VbenTableAction` | 自定义 ActionColumn | 操作列组件 |
| `Page` | 自定义 `PageHeader.vue` | 页面标题 + 操作区 |
| `Fallback` | 自定义 404/403 页面 | a-result |

产出：
- `src/composables/useTable.ts` — 表格数据加载、分页、筛选
- `src/components/PageHeader.vue` — 页面标题 + 操作区
- `src/components/TableAction.vue` — 表格操作列
- 所有列表页改为 `a-table` 写法（6 个列表页）
- 所有表单页改为 `a-form` 写法（8 个表单页）

**阶段 4：视图层清理（3-5 天）**

| Vben 组件 | 处理方式 | 涉及文件数 |
|-----------|----------|:----------:|
| `EchartsUI` / `useEcharts` | 直接使用 `echarts` | 5 |
| `AnalysisChartCard` / `AnalysisOverview` | 自定义或使用 `a-card` | 1 |
| `SvgBellIcon` 等图标 | `lucide-vue-next` / antd 图标 | 10+ |
| `WorkbenchHeader` 等 Dashboard | 自定义组件 | 4 |
| `Profile*` 组件 | 自定义设置页面 | 4 |
| `Authentication*` 组件 | 自定义登录/注册页 | 5 |
| `Fallback` 页面 | a-result | 5 |

产出：
- 所有 views 文件零 Vben 引用
- 自建 Dashboard 组件
- 自建认证页面
- 自建设置页面

**阶段 5：构建系统清理（2 天）**

| 清理项 | 说明 |
|--------|------|
| `packages/@core` | 移除 |
| `packages/effects` | 移除（access/common-ui/hooks/layouts/plugins/request） |
| `packages/constants` | 移除 |
| `packages/locales` | 移除 |
| `packages/stores` | 移除 |
| `packages/styles` | 移除 |
| `packages/types` | 移除 |
| `packages/utils` | 移除 |
| `@vben/vite-config` | 替换为标准 vite.config.ts |
| `@vben/tsconfig` | 替换为标准 tsconfig.json |
| `@vben/eslint-config` | 替换为标准 eslint 配置 |
| `@vben/tailwind-config` | 移除（如不使用 tailwind） |
| `turbo` | 移除（单应用无需 monorepo 编排） |

#### 依赖清理清单

**移除的 Vben 运行时包（package.json dependencies）**：
- @vben/access, @vben/common-ui, @vben/constants, @vben/hooks
- @vben/icons, @vben/layouts, @vben/locales, @vben/plugins
- @vben/preferences, @vben/request, @vben/stores, @vben/styles
- @vben/types, @vben/utils

**新增的替代包**：
- `vue-i18n` ^9.x
- `lodash-es` ^4.x
- `lucide-vue-next` ^0.x

**移除的 Vben 内部包（packages/ + devDependencies）**：
- @vben/commitlint-config, @vben/eslint-config, @vben/oxfmt-config
- @vben/oxlint-config, @vben/stylelint-config, @vben/tailwind-config
- @vben/tsconfig, @vben/turbo-run, @vben/vite-config, @vben/vsh
- packages/@core, packages/effects, packages/constants
- packages/locales, packages/stores, packages/styles, packages/types, packages/utils

#### 风险评估

| 风险 | 等级 | 缓解措施 |
|------|:----:|----------|
| 表单校验逻辑丢失 | 🟡 中 | 阶段 3 提前封装 useForm composable |
| vxe-table 功能差异 | 🟡 中 | a-table 功能足够，复杂场景用插槽 |
| 暗色主题适配 | 🟢 低 | antd 原生支持 theme 切换 |
| 路由守卫逻辑 | 🟢 低 | 逻辑简单，直接重写 |
| 上游同步冲突 | 🟢 低 | 脱离后不再需要上游同步 |

#### 执行时间线

```
Week 1:
  Day 1-3:  阶段 1（基础设施替换）
  Day 4-5:  阶段 2（布局系统重建）

Week 2:
  Day 1-3:  阶段 3（表单表格替换 - 列表页）
  Day 4-5:  阶段 3（表单表格替换 - 表单页）

Week 3:
  Day 1-3:  阶段 4（视图清理 - Dashboard/认证/设置）
  Day 4-5:  阶段 4（视图清理 - 剩余页面）

Week 4:
  Day 1-2:  阶段 5（构建系统清理）
  Day 3-5:  测试 + 修复 + 文档更新
```

---

## 2. 页面架构

### 2.1 路由结构（精简后）

```
/dashboard                  → 数据总览
/poetry                     → 诗歌管理
  /list                     → 诗歌列表
  /create                   → 创建诗歌
  /edit/:id                 → 编辑诗歌
  /batch                    → 批量导入
/author                     → 作者管理
  /list                     → 作者列表
  /create                   → 创建作者
  /edit/:id                 → 编辑作者
/category                   → 分类管理
/tag                        → 标签管理
/user                       → 用户管理
  /list                     → 用户列表
  /detail/:id               → 用户详情
/checkin                    → 打卡管理
  /list                     → 打卡记录
  /stats                    → 打卡统计
/tools                      → 批量工具
/system                     → 系统管理
  /banner                   → Banner 管理
  /announcement             → 公告管理
  /config                   → 系统配置
```

### 2.2 全局布局

```
┌─────────────────────────────────────────────────────────────────┐
│  Header：Logo │ 全局搜索 │ 通知 │ 管理员信息                      │
├───────────┬─────────────────────────────────────────────────────┤
│           │                                                     │
│   Sidebar │                  Main Content                       │
│           │                                                     │
│ · 总览    │   ┌─────────────────────────────────────────────┐   │
│ · 诗歌    │   │  Page Header（面包屑 + 操作按钮）            │   │
│ · 作者    │   ├─────────────────────────────────────────────┤   │
│ · 分类    │   │                                             │   │
│ · 标签    │   │              Page Content                    │   │
│ · 用户    │   │                                             │   │
│ · 打卡    │   └─────────────────────────────────────────────┘   │
│ · 工具    │                                                     │
│ · 系统    │                                                     │
└───────────┴─────────────────────────────────────────────────────┘
```

---

## 3. 功能需求

### 3.1 认证模块

#### 3.1.1 管理员登录

| 项目 | 说明 |
|------|------|
| **入口** | `/login` |
| **表单** | 邮箱（username）+ 密码 |
| **接口** | POST /api/admin/auth/login |
| **响应** | JWT token（存储到 localStorage） |
| **验证** | 邮箱格式、密码非空 |
| **错误** | 账号或密码错误 → 提示「邮箱或密码错误」 |
| **测试账号** | admin@xiaoshi.app / admin123456 |

#### 3.1.2 会话管理

| 项目 | 说明 |
|------|------|
| **Token 存储** | localStorage (admin_token) |
| **Token 注入** | 请求拦截器自动添加 Authorization: Bearer |
| **401 处理** | 跳转 /login，清除本地 token |
| **退出** | 确认 Modal → 清除 token → 跳转 /login |

### 3.2 数据总览（Dashboard）

| 项目 | 说明 |
|------|------|
| **入口** | 默认页 /dashboard |
| **展示** | 统计卡片 + 图表 |
| **统计卡片** | 总用户数、总诗歌数、今日活跃、今日打卡、总浏览量 |
| **图表 1** | 近 30 日用户增长折线图 |
| **图表 2** | 热门诗歌 Top 10 横向柱状图 |
| **图表 3** | 近 30 日打卡次数趋势 |
| **刷新** | 页面加载时请求，支持手动刷新按钮 |

### 3.3 诗歌管理

#### 3.3.1 诗歌列表

| 项目 | 说明 |
|------|------|
| **展示** | 表格（ID、标题、作者、朝代、分类、状态、创建时间） |
| **筛选** | 关键词（标题/作者）、分类、状态、创建时间范围 |
| **分页** | 每页 20 条，支持跳转 |
| **操作** | 编辑、删除（二次确认） |
| **状态标签** | draft（灰）/ published（绿）/ archived（红） |

#### 3.3.2 创建/编辑诗歌

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | input | ✅ | 标题（max 100） |
| author | select | ✅ | 作者下拉（支持搜索） |
| content | textarea | ✅ | 诗歌正文（保留换行） |
| translation | textarea | ❌ | 译文 |
| appreciation | textarea | ❌ | 赏析 |
| category | select | ❌ | 分类下拉 |
| tags | select | ❌ | 标签多选 |
| cover_url | upload | ❌ | 封面图上传 |
| status | radio | ✅ | draft / published / archived |

**交互细节**：
- 选择作者后自动填充朝代（从 authors 表关联）
- 保存时校验必填字段，错误字段高亮
- 编辑模式加载诗歌详情

#### 3.3.3 批量导入

| 项目 | 说明 |
|------|------|
| **入口** | 诗歌列表页「批量导入」按钮 |
| **步骤** | 上传 JSON 文件 → 预览解析结果 → 确认导入 |
| **预览** | 表格展示每首诗字段完整性，标注校验失败行 |
| **结果** | 导入完成后显示「成功 N 条，失败 M 条」 |

### 3.4 作者管理

| 项目 | 说明 |
|------|------|
| **列表** | 表格（ID、姓名、朝代、诗歌数、创建时间） |
| **筛选** | 关键词（姓名/朝代） |
| **创建** | 姓名（必填）+ 朝代 + 简介 |
| **编辑** | 可修改所有字段（修改朝代后关联诗文自动同步） |
| **删除** | 二次确认，有关联诗歌时提示 |
| **批量匹配** | 将 poems 表 author 字段关联到 authors 表 |

### 3.5 分类管理

| 项目 | 说明 |
|------|------|
| **列表** | 表格（ID、名称、排序值、诗歌数） |
| **创建** | 名称（必填，唯一）+ 排序值 |
| **编辑** | 可修改名称和排序 |
| **删除** | 二次确认，有关联诗歌时禁止删除 |

### 3.6 标签管理

| 项目 | 说明 |
|------|------|
| **列表** | 表格（ID、名称、诗歌数） |
| **创建** | 名称（必填，唯一） |
| **删除** | 二次确认，删除不影响诗歌 |

### 3.7 用户管理

#### 3.7.1 用户列表

| 项目 | 说明 |
|------|------|
| **展示** | 表格（ID、昵称、邮箱（脱敏）、状态、注册时间） |
| **筛选** | 关键词（昵称/邮箱）、状态（active/disabled） |
| **操作** | 查看详情、禁用/启用 |

#### 3.7.2 用户详情

| 项目 | 说明 |
|------|------|
| **展示** | 个人信息 + 统计数据 |
| **统计** | 累计打卡天数、连续天数、收藏数、计划数、Passkey 数 |
| **操作** | 禁用/启用用户 |

### 3.8 打卡管理

#### 3.8.1 打卡记录列表

| 项目 | 说明 |
|------|------|
| **展示** | 表格（用户昵称、打卡日期、关联诗文、连续天数、打卡时间） |
| **筛选** | 日期范围、用户昵称/ID、诗文标题 |
| **排序** | 默认按打卡日期倒序 |
| **分页** | 每页 20 条 |
| **导出** | 支持导出 CSV |

#### 3.8.2 打卡统计看板

| 指标 | 说明 |
|------|------|
| **日均打卡率** | DAU 中打卡的比例（近 7 日/30 日） |
| **打卡用户留存** | 打卡后 7 日/30 日留存率 |
| **热门打卡诗文** | Top 10 被打卡最多的诗文 |
| **连续打卡分布** | 用户连续天数分布 |
| **图表** | 近 30 日打卡次数趋势折线图 |

### 3.9 批量工具

| 工具 | 功能 | 触发 | 结果 |
|------|------|------|------|
| **生成拼音** | 扫描 title_pinyin 为空的记录，自动生成 | 点击「执行」 | 显示「已处理 N 条」 |
| **生成简体** | 扫描简体字段为空的记录，从繁体转换 | 点击「执行」 | 显示「已处理 N 条」 |
| **提取作者** | 从 poems 表 author 字段去重插入 authors 表 | 点击「执行」 | 显示「已提取 N 个作者」 |

### 3.10 系统管理

#### 3.10.1 Banner 管理

| 项目 | 说明 |
|------|------|
| **列表** | 表格（ID、标题、图片预览、链接类型、排序、状态） |
| **创建** | 标题 + 图片上传 + 链接类型（诗歌/URL）+ 链接值 + 排序 + 状态 |
| **限制** | 最多启用 5 个 Banner |

#### 3.10.2 公告管理

| 项目 | 说明 |
|------|------|
| **列表** | 表格（ID、标题、状态、创建时间） |
| **创建** | 标题 + 内容（富文本）+ 状态（draft/published） |

#### 3.10.3 系统配置

| Key | 说明 | 类型 |
|-----|------|------|
| daily_poem_id | 每日推荐诗歌 ID | number |
| app_version | 当前 App 版本 | string |
| min_version | 最低支持版本 | string |
| force_update | 是否强制更新 | boolean |
| background_image_url | 默认背景图 URL | string |
| background_opacity | 背景图透明度（0.05-0.2） | number |

---

## 4. UI 规范

### 4.1 布局规范

| 区域 | 规范 |
|------|------|
| 列表页 | 顶部筛选栏 + 操作按钮 + 表格 + 分页 |
| 详情页 | 页头（标题+操作）+ 表单/内容区 |
| 弹窗 | Modal 表单，宽度 600px |
| 确认操作 | Popconfirm 或 Modal.confirm |

### 4.2 表格规范

| 规范 | 说明 |
|------|------|
| 列宽 | 根据内容自适应，长文本截断 + tooltip |
| 操作列 | 固定在右侧，最多 3 个按钮 + dropdown |
| 状态 | 使用 Tag 组件，颜色语义化 |
| 空状态 | 空数据图片 + 引导文案 |
| 加载 | Table skeleton 或 spin |

### 4.3 表单规范

| 规范 | 说明 |
|------|------|
| 标签 | 左对齐，宽度 80px |
| 必填 | 标签前红色星号 |
| 校验 | 失焦校验 + 提交校验 |
| 错误 | 字段下方红色提示 |

---

## 5. API 对接

### 5.1 请求配置

| 项目 | 值 |
|------|-----|
| baseURL | `import.meta.env.VITE_GLOB_API_URL` |
| 响应格式 | `{ code: 0, message: "ok", data }` |
| 认证 | Authorization: Bearer <token> |
| 401 处理 | 跳转 /login |
| 限流 | 429 时提示「请求过于频繁」 |

### 5.2 接口清单

#### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/auth/login | 登录 |
| GET | /api/admin/user/info | 管理员信息 |
| POST | /api/admin/auth/logout | 退出 |

#### 诗歌管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/poems | 诗歌列表 |
| POST | /api/admin/poems | 创建诗歌 |
| GET | /api/admin/poems/:id | 诗歌详情 |
| PUT | /api/admin/poems/:id | 更新诗歌 |
| DELETE | /api/admin/poems/:id | 删除诗歌 |
| PUT | /api/admin/poems/:id/status | 更新状态 |
| POST | /api/admin/poems/import | 批量导入 |

#### 作者管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/authors | 作者列表 |
| POST | /api/admin/authors | 创建作者 |
| PUT | /api/admin/authors/:id | 更新作者 |
| DELETE | /api/admin/authors/:id | 删除作者 |
| POST | /api/admin/authors/batch/match | 批量匹配 |

#### 分类/标签
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/categories | 分类列表 |
| POST | /api/admin/categories | 创建分类 |
| GET | /api/admin/tags | 标签列表 |
| POST | /api/admin/tags | 创建标签 |

#### 用户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/users | 用户列表 |
| GET | /api/admin/users/:id | 用户详情 |
| PUT | /api/admin/users/:id/status | 禁用/启用 |

#### 打卡管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/checkins | 打卡记录列表 |
| GET | /api/admin/stats/checkin | 打卡数据统计 |
| GET | /api/admin/checkins/export | 导出 CSV |

#### 系统管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/banners | Banner 列表 |
| POST | /api/admin/banners | 创建 Banner |
| GET | /api/admin/announcements | 公告列表 |
| POST | /api/admin/announcements | 创建公告 |
| GET | /api/admin/config | 配置列表 |
| PUT | /api/admin/config | 更新配置 |

#### 批量工具
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/tools/pinyin | 生成拼音 |
| POST | /api/admin/tools/simplify | 生成简体 |
| POST | /api/admin/tools/authors | 提取作者 |

---

## 6. 权限控制

### 6.1 角色

| 角色 | 权限 |
|------|------|
| admin | 全部功能 |
| editor | 诗歌/作者/分类/标签管理（无用户管理、系统配置） |

### 6.2 权限码

| 权限码 | 说明 |
|--------|------|
| `poem:view` | 查看诗歌 |
| `poem:create` | 创建诗歌 |
| `poem:edit` | 编辑诗歌 |
| `poem:delete` | 删除诗歌 |
| `user:view` | 查看用户 |
| `user:edit` | 编辑用户状态 |
| `config:edit` | 修改系统配置 |

---

## 7. 验收标准

### 7.1 功能验收

- [ ] 管理员登录/退出正常
- [ ] 诗歌 CRUD 完整（创建、编辑、删除、状态变更）
- [ ] 批量导入 JSON 文件，预览 + 结果统计正确
- [ ] 作者 CRUD 正常（修改朝代后关联诗文自动同步）
- [ ] 分类/标签 CRUD 正常
- [ ] 用户列表筛选、详情查看、禁用/启用正常
- [ ] 打卡记录列表筛选、分页、导出正常
- [ ] 打卡统计看板数据准确
- [ ] 批量工具执行结果正确
- [ ] Banner/公告 CRUD 正常
- [ ] 系统配置修改生效（含背景图实时预览）
- [ ] 数据总览统计准确

### 7.2 性能验收

- [ ] 列表页首屏加载 < 2s
- [ ] 表格 1000 行数据流畅滚动
- [ ] 批量导入 100 首诗 < 10s

### 7.3 兼容性验收

- [ ] Chrome 90+, Firefox 90+, Edge 90+
- [ ] 1920px - 1366px 桌面端

---

## 8. 与 v1.0 差异

| 变更项 | v1.0 | v2.0 |
|--------|------|------|
| 框架策略 | 未明确 | **脱离 Vben，纯 Vue 3 + Ant Design Vue** |
| 路由结构 | 含 `/checkin/list` 嵌套 | 扁平化 |
| 朝代字段 | 诗文表冗余 | 关联查询 authors 表 |
| 打卡管理 | 新增 | 已验证通过 |
| 系统配置 | 含多语言预留 | 精简为核心配置 |
| 表格组件 | vxe-table | a-table |
| 表单组件 | useVbenForm | a-form 原生 |
| 国际化 | @vben/locales | vue-i18n |
| 图标 | @vben/icons | lucide-vue-next |

---

## 9. 迁移执行检查清单

### 阶段 1：基础设施（2-3 天）
- [ ] 创建 `src/lib/request.ts`（axios 封装 + 拦截器 + token 刷新）
- [ ] 创建 `src/stores/preferences.ts`（主题/暗色/语言偏好）
- [ ] 创建 `src/stores/access.ts`（accessToken、accessCodes）
- [ ] 创建 `src/stores/user.ts`（userInfo）
- [ ] 创建 `src/plugins/i18n.ts`（vue-i18n 配置）
- [ ] 创建 `src/constants/index.ts`（路由常量、权限码）
- [ ] 创建 `src/types/index.ts`（全局类型定义）
- [ ] 创建 `src/composables/useWatermark.ts`（水印功能）
- [ ] 移除 @vben/request, @vben/preferences, @vben/stores
- [ ] 移除 @vben/locales, @vben/constants, @vben/hooks, @vben/utils, @vben/types

### 阶段 2：布局系统（2-3 天）
- [ ] 创建 `src/layouts/Layout.vue`（主布局：侧边栏+顶栏+内容区）
- [ ] 创建 `src/layouts/AuthLayout.vue`（登录页布局）
- [ ] 创建 `src/components/Sidebar.vue`（侧边栏菜单）
- [ ] 创建 `src/components/HeaderBar.vue`（顶栏：搜索/用户/暗色切换）
- [ ] 创建 `src/components/Breadcrumb.vue`（面包屑）
- [ ] 移除 @vben/layouts

### 阶段 3：表单 & 表格（3-5 天）
- [ ] 创建 `src/composables/useTable.ts`（分页/筛选/排序）
- [ ] 创建 `src/components/PageHeader.vue`（页面标题+操作区）
- [ ] 创建 `src/components/TableAction.vue`（表格操作列）
- [ ] 替换 poetry/list.vue → a-table
- [ ] 替换 author/list.vue → a-table
- [ ] 替换 user/list.vue → a-table
- [ ] 替换 checkin/list.vue → a-table
- [ ] 替换 category/list.vue → a-table
- [ ] 替换所有 create/edit 页 → a-form
- [ ] 替换所有 useVbenModal → a-modal
- [ ] 替换所有 useVbenDrawer → a-drawer
- [ ] 移除 @vben/common-ui, @vben/plugins, @vben/access

### 阶段 4：视图层清理（3-5 天）
- [ ] 替换 Dashboard analytics → 直接使用 echarts
- [ ] 替换 Dashboard overview → 自定义组件
- [ ] 替换 Profile 页面 → 自定义设置页
- [ ] 替换 Authentication 页面 → 自定义登录/注册
- [ ] 替换 Fallback 页面 → a-result
- [ ] 替换所有 @vben/icons → lucide-vue-next / antd 图标
- [ ] 确认所有 views 文件零 Vben 引用
- [ ] 移除 @vben/styles

### 阶段 5：构建系统清理（2 天）
- [ ] 移除 packages/@core
- [ ] 移除 packages/effects（access/common-ui/hooks/layouts/plugins/request）
- [ ] 移除 packages/constants
- [ ] 移除 packages/locales
- [ ] 移除 packages/stores
- [ ] 移除 packages/styles
- [ ] 移除 packages/types
- [ ] 移除 packages/utils
- [ ] 替换 @vben/vite-config → 标准 vite.config.ts
- [ ] 替换 @vben/tsconfig → 标准 tsconfig.json
- [ ] 替换 @vben/eslint-config → 标准 eslint 配置
- [ ] 移除 @vben/tailwind-config（如不使用 tailwind）
- [ ] 移除 turbo（单应用无需 monorepo 编排）
- [ ] 清理 devDependencies 中所有 @vben/* 包
| 批量工具 | 含作者提取 | 保留 |
