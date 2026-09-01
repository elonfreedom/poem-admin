<script lang="ts" setup >
import { onMounted, reactive, ref } from 'vue';

import { Button } from '#/components/ui/button';
import { Checkbox } from '#/components/ui/checkbox';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '@lucide/vue';
import { RouterLink } from 'vue-router';

import { REMEMBER_USERNAME_KEY } from '#/constants';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formData = reactive({
  username: '',
  password: '',
});

const rememberMe = ref(false);
const showPassword = ref(false);

const fieldErrors = ref<{ username?: string; password?: string }>({});
const loginError = ref('');

const usernameRef = ref<InstanceType<typeof Input>>();
const passwordRef = ref<InstanceType<typeof Input>>();

async function handleSubmit() {
  fieldErrors.value = {};
  loginError.value = '';

  let hasError = false;
  if (!formData.username.trim()) {
    fieldErrors.value.username = $t('page.auth.errors.usernameRequired');
    hasError = true;
  }
  if (!formData.password) {
    fieldErrors.value.password = $t('page.auth.errors.passwordRequired');
    hasError = true;
  }
  if (hasError) return;

  if (rememberMe.value) {
    localStorage.setItem(REMEMBER_USERNAME_KEY, formData.username);
  } else {
    localStorage.removeItem(REMEMBER_USERNAME_KEY);
  }

  const result = await authStore.authLogin({
    username: formData.username.trim(),
    password: formData.password,
  });

  if (result?.error) {
    loginError.value = result.error.message;
  }
}

onMounted(() => {
  const savedUsername = localStorage.getItem(REMEMBER_USERNAME_KEY);
  if (savedUsername) {
    formData.username = savedUsername;
    rememberMe.value = true;
    (passwordRef.value?.$el as HTMLInputElement)?.focus();
  } else {
    (usernameRef.value?.$el as HTMLInputElement)?.focus();
  }
});
</script>

<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <!-- 标题 -->
    <div class="form-header auth-anim-up">
      <h1>{{ $t('page.auth.welcomeBack') }}</h1>
    </div>

    <!-- 登录失败错误 -->
    <div
      v-if="loginError"
      class="form-alert auth-anim-up-d1"
      role="alert"
    >
      {{ loginError }}
    </div>

    <!-- 用户名 -->
    <div class="form-field auth-anim-up-d1">
      <Label class="form-label">{{ $t('page.auth.username') }}</Label>
      <div class="input-wrap">
        <UserIcon class="input-icon" />
        <Input
          id="username"
          ref="usernameRef"
          v-model="formData.username"
          :placeholder="$t('page.auth.usernamePlaceholder')"
          autocomplete="username"
          class="form-input"
          :class="fieldErrors.username ? 'has-error' : ''"
        />
      </div>
      <p v-if="fieldErrors.username" class="form-error">
        {{ fieldErrors.username }}
      </p>
    </div>

    <!-- 密码 -->
    <div class="form-field auth-anim-up-d2">
      <Label class="form-label">{{ $t('page.auth.password') }}</Label>
      <div class="input-wrap">
        <LockIcon class="input-icon" />
        <Input
          id="password"
          ref="passwordRef"
          v-model="formData.password"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="$t('page.auth.passwordPlaceholder')"
          autocomplete="current-password"
          class="form-input"
          :class="fieldErrors.password ? 'has-error' : ''"
        />
        <button
          type="button"
          class="toggle-pw"
          :aria-label="showPassword ? '隐藏密码' : '显示密码'"
          @click="showPassword = !showPassword"
        >
          <EyeOffIcon v-if="showPassword" class="h-4 w-4" />
          <EyeIcon v-else class="h-4 w-4" />
        </button>
      </div>
      <p v-if="fieldErrors.password" class="form-error">
        {{ fieldErrors.password }}
      </p>
    </div>

    <!-- 记住我 + 忘记密码 -->
    <div class="form-row auth-anim-up-d3">
      <label class="checkbox-wrap">
        <Checkbox
          id="remember"
          v-model="rememberMe"
          class="hidden"
        />
        <span class="checkbox-visual" :class="rememberMe ? 'checked' : ''">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span class="checkbox-label">{{ $t('page.auth.rememberMe') }}</span>
      </label>
      <RouterLink to="/forgot-password" class="form-link">
        {{ $t('page.auth.forgetPassword') }}
      </RouterLink>
    </div>

    <!-- 登录按钮 -->
    <Button
      type="submit"
      class="btn-login auth-anim-up-d4"
      :loading="authStore.loginLoading"
    >
      {{
        authStore.loginLoading
          ? $t('page.auth.loginLoading')
          : $t('page.auth.login')
      }}
    </Button>

    <!-- 底部 -->
    <div class="form-footer auth-anim-up-d4">
      © {{ new Date().getFullYear() }} 晓诗 · 版权所有
    </div>
  </form>
</template>

<style scoped>
.login-form {
  width: 100%;
}

/* ===== 标题 ===== */
.form-header {
  margin-bottom: 32px;
}

.form-header h1 {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--auth-fg-primary);
}

/* ===== 错误提示 ===== */
.form-alert {
  background: var(--auth-error-bg);
  border: 1px solid var(--auth-error-border);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--auth-error);
  margin-bottom: 20px;
}

/* ===== 表单字段 ===== */
.form-field {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--auth-fg-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}

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
  pointer-events: none;
}

.form-input {
  width: 100%;
  height: 42px;
  padding: 0 12px 0 38px;
  border: 1px solid var(--auth-border-input);
  border-radius: 6px;
  background: var(--auth-bg-input);
  font-size: 14px;
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

.form-input.has-error {
  border-color: var(--auth-error);
}

/* 密码切换按钮 */
.toggle-pw {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--auth-fg-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toggle-pw:hover {
  color: var(--auth-fg-secondary);
}

.form-error {
  font-size: 12px;
  color: var(--auth-error);
  margin-top: 4px;
}

/* ===== 记住我 + 忘记密码行 ===== */
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.checkbox-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-visual {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--auth-border-input);
  border-radius: 3px;
  display: grid;
  place-items: center;
  transition: all 0.15s;
  color: var(--auth-bg-base);
}

.checkbox-visual.checked {
  background: var(--auth-accent);
  border-color: var(--auth-accent);
}

.checkbox-visual svg {
  opacity: 0;
  transition: opacity 0.15s;
}

.checkbox-visual.checked svg {
  opacity: 1;
}

.checkbox-label {
  font-size: 13px;
  color: var(--auth-fg-secondary);
}

.form-link {
  font-size: 13px;
  color: var(--auth-fg-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--auth-border-input);
  padding-bottom: 1px;
  transition: border-color 0.2s, color 0.2s;
}

.form-link:hover {
  color: var(--auth-fg-primary);
  border-color: var(--auth-border-focus);
}

/* ===== 登录按钮 ===== */
.btn-login {
  width: 100%;
  height: 44px;
  background: linear-gradient(
    135deg,
    var(--auth-accent) 0%,
    oklch(from var(--auth-accent) calc(l * 0.85) c h) 100%
  );
  color: var(--auth-accent-fg);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-login:hover {
  background: var(--auth-accent-hover);
  box-shadow: 0 4px 16px oklch(from var(--auth-accent) l c h / 0.3);
}

.btn-login:active {
  transform: scale(0.98);
}

/* ===== 底部 ===== */
.form-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--auth-fg-muted);
}

/* ===== 动画 ===== */
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

.auth-anim-up {
  animation: authFadeUp 0.6s ease-out both;
}

.auth-anim-up-d1 {
  animation: authFadeUp 0.6s ease-out 0.1s both;
}

.auth-anim-up-d2 {
  animation: authFadeUp 0.6s ease-out 0.2s both;
}

.auth-anim-up-d3 {
  animation: authFadeUp 0.6s ease-out 0.3s both;
}

.auth-anim-up-d4 {
  animation: authFadeUp 0.6s ease-out 0.4s both;
}
</style>
