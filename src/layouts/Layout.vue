<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

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
const SIDER_COLLAPSED_WIDTH = 64;

/** 当前侧边栏宽度 */
const siderWidth = computed(() =>
  collapsed.value ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
);

/** 侧边栏宽度样式 */
const siderStyle = computed(() => ({
  width: `${siderWidth.value}px`,
}));

/** 内容区 margin 样式 */
const contentStyle = computed(() => ({
  marginLeft: `${siderWidth.value}px`,
}));

/** 菜单数据（带分组） */
const menuItems = ref([
  {
    key: '/dashboard',
    label: '数据总览',
    icon: 'DashboardOutlined',
    group: '概览',
  },
  {
    key: '/poetry',
    label: '诗歌管理',
    icon: 'BookOutlined',
    group: '内容管理',
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
    group: '内容管理',
    children: [
      { key: '/author/list', label: '作者列表' },
      { key: '/author/create', label: '创建作者' },
    ],
  },
  {
    key: '/reading-plan',
    label: '阅读计划',
    icon: 'BookMarked',
    group: '内容管理',
    children: [{ key: '/reading-plan/list', label: '计划列表' }],
  },
  {
    key: '/category',
    label: '分类管理',
    icon: 'FolderOutlined',
    group: '内容管理',
  },
  {
    key: '/tag',
    label: '标签管理',
    icon: 'TagsOutlined',
    group: '内容管理',
  },
  {
    key: '/user',
    label: '用户管理',
    icon: 'TeamOutlined',
    group: '用户',
    children: [{ key: '/user/list', label: '用户列表' }],
  },
  {
    key: '/checkin',
    label: '打卡管理',
    icon: 'CalendarOutlined',
    group: '用户',
    children: [
      { key: '/checkin/list', label: '打卡记录' },
      { key: '/checkin/stats', label: '数据统计' },
    ],
  },
  {
    key: '/tools',
    label: '批量工具',
    icon: 'ToolOutlined',
    group: '工具',
  },
  {
    key: '/system',
    label: '系统管理',
    icon: 'SettingOutlined',
    group: '系统',
    children: [
      { key: '/system/banner', label: 'Banner 管理' },
      { key: '/system/announcement', label: '公告管理' },
    ],
  },
]);

/** 是否显示面包屑 */
const showBreadcrumb = computed(() => route.meta?.showBreadcrumb !== false);
</script>

<template>
  <div class="flex min-h-screen bg-background">
    <!-- 侧边栏 -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200"
      :style="siderStyle">
      <Sidebar v-model:collapsed="collapsed" :menu-items="menuItems" />
    </aside>

    <!-- 右侧内容区 -->
    <div
      class="flex flex-1 flex-col min-w-0 transition-all duration-200"
      :style="contentStyle">
      <!-- 顶栏 -->
      <header
        class="sticky top-0 z-40 flex h-14 items-center border-b border-header-border px-6 backdrop-blur-md"
        style="background: var(--header-bg)">
        <HeaderBar v-model:collapsed="collapsed" />
      </header>

      <!-- 内容区 -->
      <main class="flex flex-1 flex-col p-6">
        <!-- 页面内容 -->
        <div class="flex-1">
          <!-- 面包屑 -->
          <div v-if="showBreadcrumb" class="mb-4">
            <BreadcrumbComponent />
          </div>

          <!-- 页面内容卡片 -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            <RouterView />
          </div>
        </div>
      </main>

      <!-- 底部 -->
      <footer
        class="border-t border-border bg-background px-6 py-3 text-center text-xs text-muted-foreground">
        © 2026 {{ preferencesStore.app.name }} · 版权所有
      </footer>
    </div>
  </div>
</template>
