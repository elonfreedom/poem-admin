<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  BellOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import { Avatar, Dropdown, Input, Menu, MenuItem, Switch } from 'ant-design-vue';

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

/** 用户头像 */
const avatar = computed(
  () => userStore.userInfo?.avatar || undefined,
);

/** 用户名 */
const username = computed(
  () => userStore.userInfo?.realName || userStore.userInfo?.username || '管理员',
);

/** 切换折叠 */
function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed);
}

/** 切换暗色模式 */
function toggleDarkMode(checked: boolean) {
  preferencesStore.setThemeMode(checked ? 'dark' : 'light');
}

/** Switch change 事件适配（antd Switch 传递 CheckedType） */
function handleDarkModeChange(checked: any) {
  toggleDarkMode(Boolean(checked));
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

/** 搜索 */
function handleSearch() {
  if (searchValue.value.trim()) {
    // TODO: 实现全局搜索
    console.log('搜索:', searchValue.value);
  }
}

/** 用户下拉菜单 */
const userMenuItems = [
  {
    icon: UserOutlined,
    key: 'profile',
    label: '个人中心',
    onClick: () => router.push('/profile'),
  },
  {
    icon: SettingOutlined,
    key: 'settings',
    label: '系统设置',
    onClick: () => router.push('/system/config'),
  },
  {
    type: 'divider' as const,
  },
  {
    icon: LogoutOutlined,
    key: 'logout',
    label: '退出登录',
    onClick: handleLogout,
  },
];
</script>

<template>
  <header class="header-bar">
    <!-- 左侧 -->
    <div class="header-left">
      <div class="collapse-btn" @click="toggleCollapsed">
        <MenuFoldOutlined v-if="!collapsed" />
        <MenuUnfoldOutlined v-else />
      </div>
    </div>

    <!-- 中间：搜索 -->
    <div class="header-center">
      <Input.Search
        v-model:value="searchValue"
        placeholder="搜索菜单、功能..."
        class="search-input"
        @search="handleSearch"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </Input.Search>
    </div>

    <!-- 右侧 -->
    <div class="header-right">
      <!-- 暗色模式切换 -->
      <div class="header-action">
        <Switch
          :checked="preferencesStore.currentTheme === 'dark'"
          checked-children="🌙"
          un-checked-children="☀️"
          @change="handleDarkModeChange"
        />
      </div>

      <!-- 全屏 -->
      <div class="header-action" @click="toggleFullscreen">
        <FullscreenExitOutlined v-if="isFullscreen" />
        <FullscreenOutlined v-else />
      </div>

      <!-- 通知 -->
      <div class="header-action">
        <BellOutlined />
        <span class="notification-badge" />
      </div>

      <!-- 用户菜单 -->
      <Dropdown :trigger="['click']">
        <div class="user-trigger">
          <Avatar :src="avatar" size="small">
            <template #icon><UserOutlined /></template>
          </Avatar>
          <span class="username">{{ username }}</span>
        </div>
        <template #overlay>
          <Menu>
            <MenuItem
              v-for="item in userMenuItems.filter((i) => i.type !== 'divider')"
              :key="item.key"
              @click="item.onClick"
            >
              <component :is="item.icon" v-if="item.icon" class="menu-icon" />
              {{ item.label }}
            </MenuItem>
            <Menu.Divider v-if="userMenuItems.some((i) => i.type === 'divider')" />
          </Menu>
        </template>
      </Dropdown>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 24px;
}

.search-input {
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.header-action:hover {
  background: rgba(0, 0, 0, 0.04);
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

.username {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.menu-icon {
  margin-right: 8px;
}
</style>
