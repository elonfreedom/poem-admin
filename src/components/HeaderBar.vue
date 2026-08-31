<script lang="ts" setup >
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ChevronDown,
  Expand,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shrink,
  Sun,
} from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { Input } from '#/components/ui/input';

import { usePreferencesStore } from '#/stores/preferences';
import { useUserStore } from '#/stores/user';
import { useAuthStore } from '#/store';

const router = useRouter();
const preferencesStore = usePreferencesStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const props = defineProps<{
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
}>();

const searchValue = ref('');
const isFullscreen = ref(false);

/** 用户名 */
const username = computed(
  () => userStore.userInfo?.realName || userStore.userInfo?.username || '管理员',
);

/** 用户角色 */
const userRole = computed(() => {
  const roles = userStore.userInfo?.roles;
  if (!roles || roles.length === 0) return '管理员';
  return roles[0];
});

/** 用户头像首字母 */
const userInitial = computed(() => {
  const name = username.value;
  return name ? name.charAt(0).toUpperCase() : '管';
});

/** 当前是否为暗色 */
const isDark = computed(() => preferencesStore.currentTheme === 'dark');

/** 切换折叠 */
function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed);
}

/** 切换暗色模式 */
function toggleDarkMode() {
  const newMode = preferencesStore.currentTheme === 'dark' ? 'light' : 'dark';
  preferencesStore.setThemeMode(newMode);
}

/** 退出登录 */
async function handleLogout() {
  await authStore.logout();
}

/** 切换全屏 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
}

/** 聚焦搜索框 */
function focusSearch() {
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder*="搜索"]',
  );
  input?.focus();
}

/** ⌘K / Ctrl+K 快捷键 */
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    focusSearch();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <header class="header-bar">
    <!-- 左侧：折叠按钮 -->
    <Button variant="ghost" size="icon" class="header-btn" @click="toggleCollapsed">
      <Menu class="h-5 w-5" />
    </Button>

    <!-- 中间：搜索 -->
    <div class="header-search">
      <div class="search-wrap">
        <Search class="search-icon" />
        <Input
          v-model="searchValue"
          placeholder="搜索菜单..."
          class="search-input" />
        <kbd class="search-shortcut">⌘K</kbd>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="header-actions">
      <!-- 暗色模式切换 -->
      <button
        class="theme-switch"
        :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
        @click="toggleDarkMode">
        <div class="theme-switch-track">
          <div class="theme-switch-thumb" :class="{ dark: isDark }">
            <Sun v-if="!isDark" class="h-3 w-3" />
            <Moon v-else class="h-3 w-3" />
          </div>
        </div>
      </button>

      <!-- 全屏 -->
      <Button variant="ghost" size="icon" class="header-btn" aria-label="全屏" @click="toggleFullscreen">
        <Shrink v-if="isFullscreen" class="h-5 w-5" />
        <Expand v-else class="h-5 w-5" />
      </Button>

      <!-- 分隔线 -->
      <div class="header-divider" />

      <!-- 用户菜单 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="user-trigger">
            <div class="user-avatar">
              <span class="user-initial">{{ userInitial }}</span>
            </div>
            <span class="user-name">{{ username }}</span>
            <ChevronDown class="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuLabel>
            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ username }}</span>
              <span class="text-xs text-muted-foreground">{{ userRole }}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="router.push('/system/banner')">
            <Settings class="mr-2 h-4 w-4" />
            系统设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

/* ===== 按钮 ===== */
.header-btn {
  color: var(--header-fg-secondary);
}
.header-btn:hover {
  background: var(--header-bg-hover);
  color: var(--header-fg-primary);
}

/* ===== 搜索 ===== */
.header-search {
  max-width: 280px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--header-fg-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 56px 0 34px;
  border: 1px solid var(--header-border);
  border-radius: 8px;
  background: var(--header-bg-input);
  font-size: 13px;
  color: var(--header-fg-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: var(--header-fg-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--header-border-focus);
  box-shadow: 0 0 0 3px var(--header-shadow-focus);
}

.search-shortcut {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border: 1px solid var(--header-border);
  border-radius: 4px;
  background: var(--header-bg-keyboard);
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--header-fg-muted);
}

/* ===== 右侧操作区 ===== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.header-divider {
  width: 1px;
  height: 20px;
  margin: 0 8px;
  background: var(--header-border);
  opacity: 0.5;
}

/* ===== 主题切换开关 ===== */
.theme-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.theme-switch:hover {
  background: var(--header-bg-hover);
}

.theme-switch-track {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 9px;
  background: var(--header-bg-track);
  border: 1px solid var(--header-border);
  transition: background-color 0.3s;
}

.theme-switch-thumb {
  position: absolute;
  top: 1px;
  left: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--header-bg-thumb);
  color: var(--header-fg-thumb);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-switch-thumb.dark {
  transform: translateX(14px);
}

/* ===== 用户菜单 ===== */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-trigger:hover {
  background: var(--header-bg-hover);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--header-bg-avatar);
  color: var(--header-fg-avatar);
}

.user-initial {
  font-size: 13px;
  font-weight: 600;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--header-fg-primary);
}

@media (max-width: 640px) {
  .user-name {
    display: none;
  }

  .header-search {
    max-width: 180px;
  }
}
</style>
