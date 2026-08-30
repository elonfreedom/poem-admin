<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { LayoutContent, LayoutFooter, LayoutHeader, LayoutSider } from 'ant-design-vue';

import BreadcrumbComponent from '#/components/Breadcrumb.vue';
import HeaderBar from '#/components/HeaderBar.vue';
import Sidebar from '#/components/Sidebar.vue';
import { usePreferencesStore } from '#/stores/preferences';

const route = useRoute();
const preferencesStore = usePreferencesStore();

/** 侧边栏折叠状态 */
const collapsed = ref(false);

/** 侧边栏宽度 */
const SIDER_WIDTH = 220;
const SIDER_COLLAPSED_WIDTH = 80;

/** 当前侧边栏宽度 */
const siderWidth = computed(() =>
  collapsed.value ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
);

/** 菜单数据（可从路由或 API 动态生成） */
const menuItems = ref([
  {
    key: '/dashboard',
    label: '数据总览',
    icon: 'DashboardOutlined',
  },
  {
    key: '/poetry',
    label: '诗歌管理',
    icon: 'BookOutlined',
    children: [
      { key: '/poetry/list', label: '诗歌列表' },
      { key: '/poetry/create', label: '创建诗歌' },
      { key: '/poetry/batch', label: '批量导入' },
    ],
  },
  {
    key: '/author',
    label: '作者管理',
    icon: 'UserOutlined',
    children: [
      { key: '/author/list', label: '作者列表' },
      { key: '/author/create', label: '创建作者' },
    ],
  },
  {
    key: '/category',
    label: '分类管理',
    icon: 'FolderOutlined',
  },
  {
    key: '/tag',
    label: '标签管理',
    icon: 'TagsOutlined',
  },
  {
    key: '/user',
    label: '用户管理',
    icon: 'TeamOutlined',
    children: [
      { key: '/user/list', label: '用户列表' },
    ],
  },
  {
    key: '/checkin',
    label: '打卡管理',
    icon: 'CalendarOutlined',
    children: [
      { key: '/checkin/list', label: '打卡记录' },
      { key: '/checkin/stats', label: '数据统计' },
    ],
  },
  {
    key: '/tools',
    label: '批量工具',
    icon: 'ToolOutlined',
  },
  {
    key: '/system',
    label: '系统管理',
    icon: 'SettingOutlined',
    children: [
      { key: '/system/banner', label: 'Banner 管理' },
      { key: '/system/announcement', label: '公告管理' },
      { key: '/system/config', label: '系统配置' },
    ],
  },
]);

/** 是否显示面包屑 */
const showBreadcrumb = computed(() => route.meta?.showBreadcrumb !== false);
</script>

<template>
  <div class="main-layout">
    <LayoutSider
      v-model:collapsed="collapsed"
      :width="SIDER_WIDTH"
      :collapsed-width="SIDER_COLLAPSED_WIDTH"
      :trigger="null"
      collapsible
      theme="dark"
    >
      <Sidebar v-model:collapsed="collapsed" :menu-items="menuItems" />
    </LayoutSider>

    <div class="layout-right">
      <LayoutHeader class="layout-header" :style="{ width: `calc(100% - ${siderWidth}px)` }">
        <HeaderBar v-model:collapsed="collapsed" />
      </LayoutHeader>

      <LayoutContent class="layout-content">
        <!-- 面包屑 -->
        <div v-if="showBreadcrumb" class="content-breadcrumb">
          <BreadcrumbComponent />
        </div>

        <!-- 页面内容 -->
        <div class="content-main">
          <RouterView />
        </div>
      </LayoutContent>

      <LayoutFooter class="layout-footer">
        <span>© 2026 {{ preferencesStore.app.name }} · 版权所有</span>
      </LayoutFooter>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
}

.layout-right {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.layout-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 99;
  height: 64px;
  padding: 0;
  transition: width 0.2s;
}

.layout-content {
  display: flex;
  flex-direction: column;
  margin-top: 64px;
  padding: 16px;
  background: #f5f5f5;
}

.content-breadcrumb {
  margin-bottom: 16px;
}

.content-main {
  flex: 1;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.layout-footer {
  padding: 12px 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  background: #fff;
}
</style>
