<script lang="ts" setup>
/**
 * 表格操作列组件
 * 替代 @vben/common-ui 的 VbenTableAction
 *
 * 支持最多 N 个按钮 + 更多下拉菜单 + Popconfirm 确认
 */

import { computed } from 'vue';

import { EllipsisOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  Popconfirm,
  Space,
  Tooltip,
} from 'ant-design-vue';

/** 操作项配置 */
export interface TableActionItem {
  /** 操作文本 */
  text: string;
  /** 图标（lucide-vue-next 组件或 antd 图标组件） */
  icon?: any;
  /** 是否危险操作（红色） */
  danger?: boolean;
  /** 是否显示（支持函数动态判断） */
  ifShow?: boolean | (() => boolean);
  /** 点击回调 */
  onClick?: () => void;
  /** Popconfirm 确认配置 */
  popConfirm?: {
    title: string;
    description?: string;
    confirm?: () => void | Promise<void>;
    cancel?: () => void;
    okText?: string;
    cancelText?: string;
    okType?: 'primary' | 'danger';
  };
  /** 是否禁用 */
  disabled?: boolean;
  /** 提示文本 */
  tooltip?: string;
}

const props = withDefaults(
  defineProps<{
    /** 操作按钮列表 */
    actions?: TableActionItem[];
    /** 下拉菜单中的操作 */
    dropdownActions?: TableActionItem[];
    /** 最多显示几个按钮，超出的放入下拉菜单 */
    maxVisible?: number;
    /** 对齐方式 */
    align?: 'left' | 'center' | 'right';
    /** 按钮大小 */
    size?: 'small' | 'middle' | 'large';
  }>(),
  {
    actions: () => [],
    dropdownActions: () => [],
    maxVisible: 3,
    align: 'center',
    size: 'small',
  },
);

/** 判断操作是否可见 */
const isVisible = (item: TableActionItem): boolean => {
  if (item.ifShow === undefined) return true;
  return typeof item.ifShow === 'function' ? item.ifShow() : item.ifShow;
};

/** 可见的操作列表 */
const visibleActions = computed(() =>
  props.actions.filter(isVisible),
);

/** 可见的下拉操作 */
const visibleDropdownActions = computed(() =>
  props.dropdownActions.filter(isVisible),
);

/** 显示的操作按钮（前 maxVisible 个） */
const displayActions = computed(() =>
  visibleActions.value.slice(0, props.maxVisible),
);

/** 需要放入下拉菜单的操作 */
const overflowActions = computed(() =>
  visibleActions.value.slice(props.maxVisible),
);

/** 所有下拉菜单项 */
const allDropdownItems = computed(() => [
  ...overflowActions.value,
  ...visibleDropdownActions.value,
]);

/** 处理操作点击 */
function handleAction(item: TableActionItem) {
  if (item.popConfirm) {
    // 有 popConfirm 时不直接执行 onClick
    return;
  }
  item.onClick?.();
}
</script>

<template>
  <div class="table-action" :style="{ textAlign: align }">
    <Space :size="4">
      <!-- 显示的操作按钮 -->
      <template v-for="item in displayActions" :key="item.text">
        <Popconfirm
          v-if="item.popConfirm"
          :title="item.popConfirm.title"
          :ok-text="item.popConfirm.okText || '确定'"
          :cancel-text="item.popConfirm.cancelText || '取消'"
          :ok-type="item.popConfirm.okType || 'primary'"
          @confirm="item.popConfirm.confirm"
          @cancel="item.popConfirm.cancel"
        >
          <Tooltip v-if="item.tooltip" :title="item.tooltip">
            <Button
              :danger="item.danger"
              :disabled="item.disabled"
              :size="size"
              type="link"
            >
              <component :is="item.icon" v-if="item.icon" class="action-icon" />
              {{ item.text }}
            </Button>
          </Tooltip>
          <Button
            v-else
            :danger="item.danger"
            :disabled="item.disabled"
            :size="size"
            type="link"
          >
            <component :is="item.icon" v-if="item.icon" class="action-icon" />
            {{ item.text }}
          </Button>
        </Popconfirm>
        <Tooltip v-else-if="item.tooltip" :title="item.tooltip">
          <Button
            :danger="item.danger"
            :disabled="item.disabled"
            :size="size"
            type="link"
            @click="handleAction(item)"
          >
            <component :is="item.icon" v-if="item.icon" class="action-icon" />
            {{ item.text }}
          </Button>
        </Tooltip>
        <Button
          v-else
          :danger="item.danger"
          :disabled="item.disabled"
          :size="size"
          type="link"
          @click="handleAction(item)"
        >
          <component :is="item.icon" v-if="item.icon" class="action-icon" />
          {{ item.text }}
        </Button>
      </template>

      <!-- 更多下拉菜单 -->
      <Dropdown v-if="allDropdownItems.length > 0" :trigger="['click']">
        <Button :size="size" type="link">
          <EllipsisOutlined />
        </Button>
        <template #overlay>
          <Menu>
            <MenuItem
              v-for="item in allDropdownItems"
              :key="item.text"
              :danger="item.danger"
              :disabled="item.disabled"
            >
              <Popconfirm
                v-if="item.popConfirm"
                :title="item.popConfirm.title"
                :ok-text="item.popConfirm.okText || '确定'"
                :cancel-text="item.popConfirm.cancelText || '取消'"
                :ok-type="item.popConfirm.okType || 'primary'"
                @confirm="item.popConfirm.confirm"
                @cancel="item.popConfirm.cancel"
              >
                <span class="dropdown-item">
                  <component
                    :is="item.icon"
                    v-if="item.icon"
                    class="action-icon"
                  />
                  {{ item.text }}
                </span>
              </Popconfirm>
              <span v-else class="dropdown-item" @click="handleAction(item)">
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  class="action-icon"
                />
                {{ item.text }}
              </span>
            </MenuItem>
          </Menu>
        </template>
      </Dropdown>
    </Space>
  </div>
</template>

<style scoped>
.table-action {
  display: inline-flex;
}

.action-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 4px;
  vertical-align: text-bottom;
}

.dropdown-item {
  display: flex;
  align-items: center;
}
</style>
