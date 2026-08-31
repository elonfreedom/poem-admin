<script lang="ts" setup >
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cog,
  FolderOpen,
  LayoutDashboard,
  LineChart,
  PenLine,
  Settings,
  Tags,
  Users,
  Wrench,
} from 'lucide-vue-next';

import { cn } from '#/lib/utils';

const props = defineProps<{
  menuItems?: Array<{
    key: string;
    label: string;
    icon?: string;
    children?: Array<{ key: string; label: string }>;
    group?: string;
  }>;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  'update:collapsed': [value: boolean];
}>();

const route = useRoute();
const router = useRouter();

const iconMap: Record<string, any> = {
  'DashboardOutlined': LayoutDashboard,
  'BookOutlined': BookOpen,
  'UserOutlined': Users,
  'FolderOutlined': FolderOpen,
  'TagsOutlined': Tags,
  'TeamOutlined': Users,
  'CalendarOutlined': CalendarCheck,
  'ToolOutlined': Wrench,
  'SettingOutlined': Settings,
};

function getIcon(key?: string) {
  if (!key) return FolderOpen;
  if (iconMap[key]) return iconMap[key];
  if (key.includes('dashboard')) return LayoutDashboard;
  if (key.includes('poetry')) return BookOpen;
  if (key.includes('author')) return PenLine;
  if (key.includes('category')) return FolderOpen;
  if (key.includes('tag')) return Tags;
  if (key.includes('user')) return Users;
  if (key.includes('checkin')) return CalendarCheck;
  if (key.includes('tools')) return Wrench;
  if (key.includes('system')) return Settings;
  if (key.includes('banner')) return LineChart;
  if (key.includes('announcement')) return Cog;
  if (key.includes('config')) return Settings;
  return FolderOpen;
}

const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>([]);

watch(
  () => route.fullPath,
  () => {
    selectedKeys.value = [route.path];
    const matched = route.matched
      .filter((item) => item.path !== '/' && item.path !== route.path)
      .map((item) => item.path);
    openKeys.value = matched;
  },
  { immediate: true },
);

function handleMenuClick(key: string) {
  router.push(key);
}

function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed);
}

function isActive(key: string): boolean {
  return route.path === key || route.path.startsWith(key + '/');
}

function toggleSubMenu(key: string) {
  if (props.collapsed) return;
  const index = openKeys.value.indexOf(key);
  if (index > -1) {
    openKeys.value.splice(index, 1);
  } else {
    openKeys.value.push(key);
  }
}

interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  children?: Array<{ key: string; label: string }>;
  group?: string;
}

const groupedMenus = computed(() => {
  const groups: Array<{ name: string; items: MenuItem[] }> = [];
  let currentGroup: string | null = null;
  let currentItems: MenuItem[] = [];

  props.menuItems?.forEach((item) => {
    const groupName = item.group || '';
    if (groupName !== currentGroup) {
      if (currentGroup !== null && currentItems.length > 0) {
        groups.push({ name: currentGroup, items: currentItems });
      }
      currentGroup = groupName;
      currentItems = [item];
    } else {
      currentItems.push(item);
    }
  });

  if (currentGroup !== null && currentItems.length > 0) {
    groups.push({ name: currentGroup, items: currentItems });
  }

  return groups;
});
</script>

<template>
  <div class="sidebar">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <div v-if="!collapsed" class="logo-expanded">
        <div class="logo-seal">
          <span class="logo-char">诗</span>
        </div>
        <span class="logo-text">晓诗管理</span>
      </div>
      <div v-else class="logo-collapsed">
        <div class="logo-seal">
          <span class="logo-char">诗</span>
        </div>
      </div>
    </div>

    <!-- 菜单 -->
    <nav class="sidebar-nav">
      <div
        v-for="(group, groupIndex) in groupedMenus"
        :key="group.name || groupIndex"
        class="menu-group">
        <!-- 分组标题 -->
        <div
          v-if="group.name && !collapsed"
          class="group-title">
          {{ group.name }}
        </div>
        <div
          v-else-if="group.name && collapsed"
          class="group-divider" />

        <!-- 菜单项 -->
        <ul class="menu-list">
          <li v-for="item in group.items" :key="item.key">
            <!-- 有子菜单 -->
            <template v-if="item.children?.length">
              <button
                :class="
                  cn(
                    'menu-item',
                    isActive(item.key) && !collapsed && 'active',
                    collapsed && 'collapsed',
                  )
                "
                :title="collapsed ? item.label : undefined"
                @click="toggleSubMenu(item.key)">
                <component :is="getIcon(item.key)" class="menu-icon" />
                <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
                <ChevronDown
                  v-if="!collapsed && openKeys.includes(item.key)"
                  class="menu-arrow" />
                <ChevronRight
                  v-else-if="!collapsed"
                  class="menu-arrow" />
              </button>
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-96 opacity-100"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="max-h-96 opacity-100"
                leave-to-class="max-h-0 opacity-0">
                <ul
                  v-show="openKeys.includes(item.key) && !collapsed"
                  class="submenu">
                  <li v-for="child in item.children" :key="child.key">
                    <button
                      :class="
                        cn(
                          'submenu-item',
                          route.path === child.key && 'active',
                        )
                      "
                      @click="handleMenuClick(child.key)">
                      {{ child.label }}
                    </button>
                  </li>
                </ul>
              </Transition>
            </template>

            <!-- 无子菜单 -->
            <button
              v-else
              :class="
                cn(
                  'menu-item',
                  isActive(item.key) && 'active',
                  collapsed && 'collapsed',
                )
              "
              :title="collapsed ? item.label : undefined"
              @click="handleMenuClick(item.key)">
              <component :is="getIcon(item.key)" class="menu-icon" />
              <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- 折叠按钮 -->
    <div class="sidebar-footer" @click="toggleCollapsed">
      <ChevronLeft v-if="!collapsed" class="h-5 w-5" />
      <ChevronRight v-else class="h-5 w-5" />
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sidebar-bg);
  color: var(--sidebar-fg);
}

/* ===== Logo ===== */
.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}

.logo-expanded {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-collapsed {
  display: flex;
  align-items: center;
}

.logo-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-fg);
  box-shadow: 0 2px 8px oklch(from var(--sidebar-accent) l c h / 0.3);
}

.logo-char {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 700;
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* ===== 菜单 ===== */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.menu-group {
  margin-bottom: 16px;
}

.group-title {
  margin-bottom: 8px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sidebar-fg);
  opacity: 0.5;
}

.group-divider {
  margin: 8px 12px;
  border-top: 1px solid var(--sidebar-border);
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--sidebar-fg);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.menu-item:hover {
  background: var(--sidebar-bg-hover);
}

.menu-item.active {
  background: var(--sidebar-bg-active);
  color: var(--sidebar-fg-active);
  font-weight: 600;
}

.menu-item.collapsed {
  justify-content: center;
  padding: 10px;
}

.menu-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
}

.menu-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

/* ===== 子菜单 ===== */
.submenu {
  margin-left: 20px;
  margin-top: 4px;
  padding-left: 12px;
  border-left: 1px solid var(--sidebar-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  list-style: none;
}

.submenu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--sidebar-fg);
  opacity: 0.7;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.submenu-item:hover {
  background: var(--sidebar-bg-hover);
  opacity: 1;
}

.submenu-item.active {
  background: var(--sidebar-bg-active);
  color: var(--sidebar-fg-active);
  font-weight: 600;
  opacity: 1;
}

/* ===== 底部折叠 ===== */
.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-top: 1px solid var(--sidebar-border);
  color: var(--sidebar-fg);
  opacity: 0.6;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.sidebar-footer:hover {
  opacity: 1;
  background: var(--sidebar-bg-hover);
}
</style>
