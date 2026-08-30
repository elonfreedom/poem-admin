<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue';
import { Menu } from 'ant-design-vue';

const props = defineProps<{
  /** 菜单数据 */
  menuItems?: Array<{
    key: string;
    label: string;
    icon?: any;
    children?: Array<{ key: string; label: string }>;
  }>;
  /** 是否折叠 */
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
}>();

const route = useRoute();
const router = useRouter();

/** 当前选中的菜单项 */
const selectedKeys = ref<string[]>([]);

/** 展开的菜单项 */
const openKeys = ref<string[]>([]);

/** 监听路由变化，更新选中状态 */
watch(
  () => route.fullPath,
  () => {
    selectedKeys.value = [route.path];
    // 更新展开的父级菜单
    const matched = route.matched
      .filter((item) => item.path !== '/' && item.path !== route.path)
      .map((item) => item.path);
    openKeys.value = matched;
  },
  { immediate: true },
);

/** 菜单点击处理 */
function handleMenuClick(info: { key: string | number }) {
  router.push(String(info.key));
}

/** 切换折叠状态 */
function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed);
}
</script>

<template>
  <div class="sidebar">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <div v-if="!collapsed" class="logo-text">晓诗管理</div>
      <div v-else class="logo-icon">诗</div>
    </div>

    <!-- 菜单 -->
    <Menu
      v-model:openKeys="openKeys"
      v-model:selectedKeys="selectedKeys"
      mode="inline"
      :inline-collapsed="collapsed"
      theme="dark"
      @click="handleMenuClick"
    >
      <template v-for="item in menuItems" :key="item.key">
        <Menu.SubMenu v-if="item.children?.length" :key="item.key">
          <template #title>
            <span class="menu-item-title">
              <component :is="item.icon" v-if="item.icon" class="menu-icon" />
              <span>{{ item.label }}</span>
            </span>
          </template>
          <Menu.Item v-for="child in item.children" :key="child.key">
            {{ child.label }}
          </Menu.Item>
        </Menu.SubMenu>
        <Menu.Item v-else :key="item.key">
          <component :is="item.icon" v-if="item.icon" class="menu-icon" />
          <span>{{ item.label }}</span>
        </Menu.Item>
      </template>
    </Menu>

    <!-- 折叠按钮 -->
    <div class="collapse-trigger" @click="toggleCollapsed">
      <MenuFoldOutlined v-if="!collapsed" />
      <MenuUnfoldOutlined v-else />
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #001529;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  white-space: nowrap;
}

.logo-icon {
  font-size: 24px;
  font-weight: 700;
}

:deep(.ant-menu) {
  flex: 1;
  border-right: none;
}

.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.collapse-trigger {
  padding: 16px;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: color 0.3s;
}

.collapse-trigger:hover {
  color: #fff;
}
</style>
