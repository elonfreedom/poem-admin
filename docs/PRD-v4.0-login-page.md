# 晓诗后台管理 PRD v4.0 — 登录页优化

> **版本**：v4.1 · **日期**：2026-08-31 · **状态**：执行中
> **项目**：poem-admin（Vue 3 + shadcn-vue + Tailwind CSS 4）
> **前置版本**：PRD v3.0（设计系统重构，已完成 shadcn-vue 迁移）
> **设计规则**：[登录页设计规则 — 亮色/暗色模式规范](./login-page-design-rules.md)

---

## 1. 变更概述

### 1.1 背景

当前登录页（`/auth/login`）是从 Vben 模板继承后仅做最小化修改的版本，存在以下问题：

1. **功能缺失**：无记住我、无忘记密码、无密码可见性切换、无登录失败差异化提示
2. **交互缺陷**：Button 组件的 `:loading` 属性为死代码（组件未声明 loading prop），登录无加载反馈
3. **品牌脱节**：紫色渐变背景 +「诗」字方块 Logo，与「古诗文」产品定位不匹配
4. **暗色模式缺失**：AuthLayout 硬编码亮色渐变，不支持暗色模式
5. **安全隐患**：无防爆破机制、无环境标识

### 1.2 目标

| 目标 | 说明 |
|------|------|
| **补齐基础功能** | 记住我、密码可见性切换、登录失败差异化提示 |
| **修复交互缺陷** | 实现真正的 loading 状态、表单自动聚焦、入场动画 |
| **品牌化视觉** | 融入古诗文/中国文化元素，与产品定位一致 |
| **暗色模式适配** | 登录页支持亮/暗/跟随系统三种模式，遵循设计规则 |
| **安全增强** | 登录失败次数限制、环境标识 |

### 1.3 设计原则

1. **文化契合**：视觉语言体现「古诗文」韵味，亮色如宣纸作画，暗色如碑帖拓印
2. **渐进增强**：先补齐功能，再升级视觉，分阶段交付
3. **无障碍**：所有交互符合 WCAG 2.1 AA 标准
4. **响应式**：适配桌面、平板、手机
5. **双模式统一**：亮色/暗色模式均保持品牌一致性，详见 [设计规则](./login-page-design-rules.md)

---

## 2. 功能需求

### 2.1 P0 — 核心功能（必须实现）

#### 2.1.1 登录失败差异化提示

| 场景 | 当前行为 | 目标行为 |
|------|----------|----------|
| 用户名不存在 | 通用 toast 错误 | 表单级提示：「该用户名不存在」 |
| 密码错误 | 通用 toast 错误 | 表单级提示：「密码错误，请重试」 |
| 账号被锁定 | 无 | 表单级提示：「账号已被锁定，请联系管理员」 |
| 网络异常 | 通用 toast 错误 | 表单级提示：「网络异常，请检查网络连接」 |

**实现方式**：authStore.authLogin 增加 try/catch，根据后端错误码返回结构化错误信息，组件层展示。

#### 2.1.2 记住我（Remember Me）

| 配置项 | 说明 |
|--------|------|
| UI | 登录表单增加「记住我」复选框 |
| 行为 | 勾选后用户名持久化到 localStorage，下次访问自动填充 |
| 存储 key | `admin_remember_username` |
| 默认值 | 不勾选 |

#### 2.1.3 密码可见性切换

| 配置项 | 说明 |
|--------|------|
| UI | 密码输入框右侧增加眼睛图标按钮 |
| 行为 | 点击切换 type="password" ↔ type="text" |
| 图标 | lucide-vue-next 的 `Eye` / `EyeOff` |

#### 2.1.4 登录成功后跳转首页

| 配置项 | 说明 |
|--------|------|
| 行为 | 登录成功后**始终跳转至 `/dashboard/overview`（数据总览页）** |
| 路径常量 | `LOGIN_REDIRECT_PATH = '/dashboard/overview'`（定义于 `src/constants/index.ts`） |
| 忽略后端 homePath | 不使用后端返回的 `userInfo.homePath`，统一跳转至数据总览 |
| Toast 提示 | 跳转成功后显示「登录成功，欢迎回来：{用户名}」 |

**实现方式**：`authStore.authLogin` 成功后调用 `router.push(LOGIN_REDIRECT_PATH)`。

#### 2.1.5 登录按钮 Loading 状态修复

| 配置项 | 说明 |
|--------|------|
| 问题 | Button 组件未声明 `loading` prop，当前为死代码 |
| 方案 | 扩展 Button 组件，增加 `loading` prop |
| loading 行为 | 显示 spinner + 禁用点击 + 文字变为「登录中…」 |
| 防重复提交 | loading 时按钮 disabled |

### 2.2 P1 — 体验优化（短期实现）

#### 2.2.1 表单自动聚焦

- 页面加载后，用户名输入框自动 focus
- 用户名输入框已有内容时（记住我），聚焦到密码框

#### 2.2.2 入场动画

- 登录卡片增加 fade-in + slide-up 动画（duration: 600ms）
- 装饰元素增加缓慢浮动动画
- 支持 `prefers-reduced-motion` 禁用动画

#### 2.2.3 亮色/暗色模式适配

> **详细规范见**：[登录页设计规则 §1-§3](./login-page-design-rules.md)

| 模式 | 背景方案 | 视觉意象 |
|------|----------|----------|
| 亮色模式 | 暖白渐变 `#f7f3eb → #ede8dc` + 淡墨山水 | 宣纸画卷 · 晨光 |
| 暗色模式 | 墨黑渐变 `#1a1714 → #0f0d0b` + 深墨山水 | 深夜砚台 · 月影 |
| 跟随系统 | 监听 `prefers-color-scheme` | 自动切换 |

**色彩令牌**：使用 CSS 变量 `--auth-*` 系列，通过 `.dark` 类切换。

#### 2.2.4 忘记密码入口

| 配置项 | 说明 |
|--------|------|
| UI | 登录表单下方增加「忘记密码？」链接 |
| 行为 | 跳转至 `/forgot-password` 页面（占位页，提示联系管理员） |
| 备注 | 完整找回流程需后端支持，当前仅做入口 |

### 2.3 P2 — 安全增强（中期实现）

#### 2.3.1 登录失败次数限制

| 配置项 | 说明 |
|--------|------|
| 阈值 | 连续失败 5 次 |
| 行为 | 锁定 60 秒，显示倒计时 |
| 前端校验 | 仅前端计数，后端需独立实现限流 |

#### 2.3.2 环境标识

| 环境 | 标识 |
|------|------|
| 开发 | 左上角显示「开发环境」标签 |
| 测试 | 左上角显示「测试环境」标签 |
| 生产 | 不显示 |

### 2.4 P3 — 品牌升级（已完成）

#### 2.4.1 视觉风格重塑

| 元素 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 背景 | 通用紫蓝渐变 | 水墨山水 / 宣纸纹理 | ✅ |
| Logo | 「诗」字白底方块 | 印章风格 / 朱砂红 | ✅ |
| 装饰 | 白色半透明圆 | 竖排诗句 / 明月 / 飞鸟 | ✅ |
| 字体 | Geist/Inter | 标题使用思源宋体 | ✅ |

#### 2.4.2 品牌文案

| 位置 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 副标题 | 「晓诗 · 后台管理系统」 | 「传承千年诗韵 · 匠心内容管理」 | ✅ |
| 欢迎语 | 无 | 「登录以继续管理诗词内容」 | ✅ |

---

## 3. 技术方案

### 3.1 文件变更清单

| 文件 | 变更类型 | 说明 | 状态 |
|------|----------|------|------|
| `src/components/ui/button/Button.vue` | **修改** | 增加 `loading` prop + spinner | ✅ |
| `src/components/ui/button/index.ts` | **修改** | buttonVariants 增加 loading 样式 | ✅ |
| `src/views/_core/authentication/login.vue` | **重写** | 完整重构登录表单 | ✅ |
| `src/layouts/AuthLayout.vue` | **重写** | 品牌化视觉 + 亮色/暗色双模式 | ✅ |
| `src/store/auth.ts` | **修改** | 增加错误处理 + 记住我逻辑 | ✅ |
| `src/constants/index.ts` | **修改** | 增加 REMEMBER_USERNAME_KEY | ✅ |
| `src/locales/langs/zh-CN/page.json` | **修改** | 增加认证相关翻译 | ✅ |
| `src/locales/langs/en-US/page.json` | **修改** | 增加认证相关翻译 | ✅ |
| `src/styles/globals.css` | **修改** | 增加登录页动画关键帧 + 色彩令牌 | ✅ |
| `docs/login-page-design-rules.md` | **新建** | 亮色/暗色模式设计规则 | ✅ |

### 3.2 色彩令牌实现

> 完整令牌定义见 [设计规则 §2.1](./login-page-design-rules.md#21-设计令牌css-变量)

```css
/* src/styles/globals.css 新增 */
@theme {
  /* 登录页专用令牌 - 亮色模式（默认） */
  --auth-bg-base: oklch(0.96 0.01 80);
  --auth-bg-scene: oklch(0.94 0.015 75);
  --auth-bg-card: oklch(0.98 0.005 80 / 0.92);
  --auth-bg-input: oklch(1 0 0 / 0.06);
  --auth-fg-primary: oklch(0.2 0.01 60);
  --auth-fg-secondary: oklch(0.45 0.01 60);
  --auth-fg-muted: oklch(0.55 0.005 60);
  --auth-accent: oklch(0.45 0.08 30);
  --auth-accent-hover: oklch(0.5 0.09 30);
  --auth-accent-fg: oklch(0.98 0.005 80);
  --auth-border: oklch(0.85 0.01 70 / 0.25);
  --auth-border-input: oklch(0.8 0.01 70 / 0.3);
  --auth-border-focus: oklch(0.6 0.05 60 / 0.5);
  --auth-shadow-card: 0 24px 80px oklch(0 0 0 / 0.12);
  --auth-shadow-input: 0 0 0 3px oklch(0.6 0.05 60 / 0.08);
  --auth-error: oklch(0.5 0.15 25);
  --auth-error-bg: oklch(0.5 0.15 25 / 0.1);
  --auth-error-border: oklch(0.5 0.15 25 / 0.25);
}

/* 暗色模式覆盖 */
.dark {
  --auth-bg-base: oklch(0.12 0.01 60);
  --auth-bg-scene: oklch(0.1 0.01 60);
  --auth-bg-card: oklch(0.15 0.01 60 / 0.85);
  --auth-bg-input: oklch(1 0 0 / 0.04);
  --auth-fg-primary: oklch(0.92 0.01 80);
  --auth-fg-secondary: oklch(0.7 0.01 70);
  --auth-fg-muted: oklch(0.55 0.005 60);
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

### 3.3 核心组件设计

#### 3.3.1 Button 组件扩展

```vue
// Button.vue 新增 loading prop
interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  loading?: boolean  // 新增
}
```

loading 状态下的 DOM 结构：
```html
<button disabled>
  <Spinner class="mr-2 h-4 w-4 animate-spin" />
  <slot />  <!-- 或显示 loadingText -->
</button>
```

#### 3.3.2 登录表单组件结构

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- 错误提示 Banner -->
    <div v-if="loginError" class="form-alert" role="alert">
      {{ loginError }}
    </div>

    <!-- 用户名 -->
    <div class="form-field">
      <Label class="form-label">用户名</Label>
      <div class="input-wrap">
        <UserIcon class="input-icon" />
        <Input
          ref="usernameRef"
          v-model="formData.username"
          class="form-input"
          :class="fieldErrors.username ? 'has-error' : ''"
        />
      </div>
    </div>

    <!-- 密码 -->
    <div class="form-field">
      <Label class="form-label">密码</Label>
      <div class="input-wrap">
        <LockIcon class="input-icon" />
        <Input
          ref="passwordRef"
          v-model="formData.password"
          :type="showPassword ? 'text' : 'password'"
          class="form-input"
        />
        <button type="button" @click="showPassword = !showPassword">
          <EyeOffIcon v-if="showPassword" />
          <EyeIcon v-else />
        </button>
      </div>
    </div>

    <!-- 记住我 + 忘记密码 -->
    <div class="form-row">
      <label class="checkbox-wrap">
        <Checkbox v-model:checked="rememberMe" />
        <span class="checkbox-visual" :class="rememberMe ? 'checked' : ''">
          <!-- checkmark svg -->
        </span>
        <span class="checkbox-label">记住我</span>
      </label>
      <RouterLink to="/forgot-password" class="form-link">
        忘记密码？
      </RouterLink>
    </div>

    <!-- 登录按钮 -->
    <Button type="submit" class="btn-login" :loading="authStore.loginLoading">
      登录
    </Button>
  </form>
</template>
```

#### 3.3.3 AuthLayout 双模式方案

> 详细设计见 [设计规则 §3](./login-page-design-rules.md#3-背景场景规范)

```css
/* 基础布局 */
.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: var(--auth-bg-base);
  transition: background-color 0.3s ease;
}

/* 亮色模式背景 */
.auth-bg {
  background: linear-gradient(160deg, #f7f3eb 0%, #ede8dc 100%);
}

/* 暗色模式背景 */
.dark .auth-bg {
  background: linear-gradient(160deg, #1a1714 0%, #0f0d0b 100%);
}

/* 卡片 */
.auth-card {
  background: var(--auth-bg-card);
  backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid var(--auth-border);
  box-shadow: var(--auth-shadow-card);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
```

### 3.4 状态管理变更

#### 3.4.1 authStore 错误处理

```typescript
// 新增错误类型
interface LoginError {
  code: 'USER_NOT_FOUND' | 'WRONG_PASSWORD' | 'ACCOUNT_LOCKED' | 'NETWORK_ERROR'
  message: string
}

// authLogin 增加 try/catch
async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
  loginLoading.value = true
  try {
    const { access_token } = await loginApi(params)
    // ... 成功逻辑
  } catch (error: any) {
    const loginError = parseLoginError(error)
    return { userInfo: null, error: loginError }
  } finally {
    loginLoading.value = false
  }
}
```

#### 3.4.2 记住我逻辑

```typescript
// 登录成功后
if (rememberMe.value) {
  localStorage.setItem(REMEMBER_USERNAME_KEY, formData.username)
} else {
  localStorage.removeItem(REMEMBER_USERNAME_KEY)
}

// 页面加载时
const savedUsername = localStorage.getItem(REMEMBER_USERNAME_KEY)
if (savedUsername) {
  formData.username = savedUsername
  rememberMe.value = true
}
```

### 3.5 i18n 翻译新增

```json
// zh-CN/page.json 新增
{
  "auth": {
    "login": "登录",
    "username": "用户名",
    "password": "密码",
    "rememberMe": "记住我",
    "forgotPassword": "忘记密码？",
    "loginLoading": "登录中…",
    "errors": {
      "usernameRequired": "请输入用户名",
      "passwordRequired": "请输入密码",
      "userNotFound": "该用户名不存在",
      "wrongPassword": "密码错误，请重试",
      "accountLocked": "账号已被锁定，请联系管理员",
      "networkError": "网络异常，请检查网络连接"
    },
    "welcomeBack": "登录以继续管理诗词内容",
    "usernamePlaceholder": "请输入用户名",
    "passwordPlaceholder": "请输入密码",
    "forgotPasswordDesc": "请联系系统管理员重置密码"
  }
}

// en-US/page.json 新增
{
  "auth": {
    "login": "Sign In",
    "username": "Username",
    "password": "Password",
    "rememberMe": "Remember me",
    "forgotPassword": "Forgot password?",
    "loginLoading": "Signing in…",
    "errors": {
      "usernameRequired": "Please enter username",
      "passwordRequired": "Please enter password",
      "userNotFound": "Username not found",
      "wrongPassword": "Incorrect password, please try again",
      "accountLocked": "Account locked, please contact administrator",
      "networkError": "Network error, please check your connection"
    },
    "welcomeBack": "Sign in to manage poetry content",
    "usernamePlaceholder": "Enter your username",
    "passwordPlaceholder": "Enter your password",
    "forgotPasswordDesc": "Please contact system administrator to reset password"
  }
}
```

---

## 4. 验收标准

### 4.1 P0 验收标准

| # | 测试项 | 预期结果 |
|---|--------|----------|
| 1 | 输入空用户名点击登录 | 显示「请输入用户名」，不发起请求 |
| 2 | 输入空密码点击登录 | 显示「请输入密码」，不发起请求 |
| 3 | 输入错误用户名 | 显示「该用户名不存在」 |
| 4 | 输入错误密码 | 显示「密码错误，请重试」 |
| 5 | 点击登录按钮 | 按钮显示 spinner + 「登录中…」，不可重复点击 |
| 6 | 登录成功后 | spinner 消失，跳转至 `/dashboard/overview`，显示成功 toast |
| 7 | 勾选「记住我」后登录 | 刷新页面，用户名自动填充 |
| 8 | 不勾选「记住我」登录 | 刷新页面，用户名为空 |
| 9 | 点击密码框眼睛图标 | 密码明文/密文切换 |

### 4.2 P1 验收标准

| # | 测试项 | 预期结果 |
|---|--------|----------|
| 10 | 页面加载 | 用户名输入框自动 focus |
| 11 | 页面加载 | 卡片有 fade-in 动画 |
| 12 | 切换暗色模式 | 登录页背景变为深色，所有元素适配 |
| 13 | 切换亮色模式 | 登录页背景变为暖白，所有元素适配 |
| 14 | 点击「忘记密码？」 | 跳转至忘记密码页面 |
| 15 | 模式切换 | 300ms 平滑过渡，无闪烁 |
| 16 | 亮色模式文字对比度 | ≥ 4.5:1 |
| 17 | 暗色模式文字对比度 | ≥ 4.5:1 |

---

## 5. 实施计划

### 5.1 阶段划分

| 阶段 | 内容 | 预估工时 | 状态 |
|------|------|----------|------|
| **Phase 1** | P0 核心功能（记住我、密码切换、loading 修复、错误提示） | 4h | ✅ 完成 |
| **Phase 2** | P1 体验优化（自动聚焦、动画、双模式适配、忘记密码入口） | 3h | ✅ 完成 |
| **Phase 3** | P2 安全增强（失败限制、环境标识） | 2h | ⏳ 待执行 |
| **Phase 4** | P3 品牌升级（视觉重塑、文案优化） | 4h | ✅ 完成 |

### 5.2 Phase 1 详细任务

| # | 任务 | 文件 | 依赖 | 状态 |
|---|------|------|------|------|
| 1.1 | Button 组件增加 loading prop | Button.vue, index.ts | 无 | ✅ |
| 1.2 | 登录表单增加输入框图标 + 密码切换 | login.vue | 无 | ✅ |
| 1.3 | 登录表单增加「记住我」功能 | login.vue, constants.ts | 无 | ✅ |
| 1.4 | authStore 增加错误处理 + 错误码映射 | auth.ts | 无 | ✅ |
| 1.5 | 登录表单展示差异化错误提示 | login.vue | 1.4 | ✅ |
| 1.6 | 登录按钮 loading 状态接入 | login.vue | 1.1 | ✅ |
| 1.7 | i18n 翻译新增 | page.json (zh-CN + en-US) | 无 | ✅ |

### 5.3 Phase 2 详细任务

| # | 任务 | 文件 | 依赖 | 状态 |
|---|------|------|------|------|
| 2.1 | 表单自动聚焦 | login.vue | 1.3 | ✅ |
| 2.2 | 卡片入场动画 | AuthLayout.vue, globals.css | 无 | ✅ |
| 2.3 | 装饰元素浮动动画 | AuthLayout.vue | 无 | ✅ |
| 2.4 | AuthLayout 亮色/暗色双模式适配 | AuthLayout.vue, globals.css | 无 | ✅ |
| 2.5 | 忘记密码页面 + 路由 | forgot-password.vue, core.ts | 无 | ✅ |
| 2.6 | 色彩令牌系统实现 | globals.css | 无 | ✅ |
| 2.7 | 设计规则文档编写 | docs/login-page-design-rules.md | 无 | ✅ |

---

## 6. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 后端错误码未统一 | 无法精确区分错误类型 | 先按 HTTP 状态码 + 错误消息模糊匹配，后续对接后端 |
| 品牌视觉方案需设计资源 | P3 阶段可能延期 | 先用 CSS 渐变 + 开源字体实现 MVP，设计资源到位后替换 |
| 暗色模式与品牌色冲突 | 暗色下中国风效果不佳 | 暗色模式采用深青/墨色调，保持文化感；亮色/暗色分别定义色彩令牌 |
| 双模式测试覆盖不足 | 某些元素可能只在一种模式下正常 | 使用 CSS 变量统一定义，切换时自动继承；验收时两种模式分别测试 |

---

## 7. 参考资料

- [PRD v3.0 设计系统重构](./PRD-v3.0-design-system.md)
- [设计系统规范](./design-system-spec.md)
- [登录页设计规则 — 亮色/暗色模式规范](./login-page-design-rules.md)
- [shadcn-vue 组件文档](https://www.shadcn-vue.com/)
- [lucide-vue-next 图标](https://lucide.dev/)
- [WCAG 2.1 AA 标准](https://www.w3.org/WAI/WCAG21/quickref/)
- [oklch 色彩空间](https://oklch.com/)
