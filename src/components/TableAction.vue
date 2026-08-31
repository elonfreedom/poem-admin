<script lang="ts" setup>
/**
 * 表格操作列组件
 *
 * 支持最多 N 个按钮 + 更多下拉菜单 + 确认弹窗
 */

import { computed } from 'vue';

import { MoreHorizontal } from 'lucide-vue-next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/components/ui/tooltip';

/** 操作项配置 */
export interface TableActionItem {
  /** 操作文本 */
  text: string;
  /** 图标（lucide-vue-next 组件） */
  icon?: any;
  /** 是否危险操作（红色） */
  danger?: boolean;
  /** 是否显示（支持函数动态判断） */
  ifShow?: boolean | (() => boolean);
  /** 点击回调 */
  onClick?: () => void;
  /** 确认弹窗配置 */
  confirm?: {
    title: string;
    description?: string;
    confirm?: () => void | Promise<void>;
    cancel?: () => void;
    confirmText?: string;
    cancelText?: string;
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
    size?: 'sm' | 'default' | 'lg';
  }>(),
  {
    actions: () => [],
    dropdownActions: () => [],
    maxVisible: 3,
    align: 'center',
    size: 'sm',
  },
);

/** 判断操作是否可见 */
const isVisible = (item: TableActionItem): boolean => {
  if (item.ifShow === undefined) return true;
  return typeof item.ifShow === 'function' ? item.ifShow() : item.ifShow;
};

/** 可见的操作列表 */
const visibleActions = computed(() => props.actions.filter(isVisible));

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
</script>

<template>
  <div
    class="flex items-center gap-1"
    :style="{ justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }">
    <!-- 显示的操作按钮 -->
    <template v-for="item in displayActions" :key="item.text">
      <!-- 有确认弹窗 -->
      <AlertDialog v-if="item.confirm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <AlertDialogTrigger as-child>
                <Button
                  variant="ghost"
                  :size="size"
                  :disabled="item.disabled"
                  :class="item.danger ? 'text-destructive hover:text-destructive' : ''">
                  <component :is="item.icon" v-if="item.icon" class="mr-1 h-4 w-4" />
                  {{ item.text }}
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent v-if="item.tooltip">
              {{ item.tooltip }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ item.confirm.title }}</AlertDialogTitle>
            <AlertDialogDescription v-if="item.confirm.description">
              {{ item.confirm.description }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="item.confirm.cancel">
              {{ item.confirm.cancelText || '取消' }}
            </AlertDialogCancel>
            <AlertDialogAction @click="item.confirm.confirm">
              {{ item.confirm.confirmText || '确定' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <!-- 无确认弹窗 -->
      <TooltipProvider v-else>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              :size="size"
              :disabled="item.disabled"
              :class="item.danger ? 'text-destructive hover:text-destructive' : ''"
              @click="item.onClick">
              <component :is="item.icon" v-if="item.icon" class="mr-1 h-4 w-4" />
              {{ item.text }}
            </Button>
          </TooltipTrigger>
          <TooltipContent v-if="item.tooltip">
            {{ item.tooltip }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </template>

    <!-- 更多下拉菜单 -->
    <DropdownMenu v-if="allDropdownItems.length > 0">
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" :size="size">
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <template v-for="item in allDropdownItems" :key="item.text">
          <AlertDialog v-if="item.confirm">
            <AlertDialogTrigger as-child>
              <DropdownMenuItem
                :class="item.danger ? 'text-destructive' : ''"
                :disabled="item.disabled"
                @select.prevent>
                <component :is="item.icon" v-if="item.icon" class="mr-2 h-4 w-4" />
                {{ item.text }}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ item.confirm.title }}</AlertDialogTitle>
                <AlertDialogDescription v-if="item.confirm.description">
                  {{ item.confirm.description }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel @click="item.confirm.cancel">
                  {{ item.confirm.cancelText || '取消' }}
                </AlertDialogCancel>
                <AlertDialogAction @click="item.confirm.confirm">
                  {{ item.confirm.confirmText || '确定' }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DropdownMenuItem
            v-else
            :class="item.danger ? 'text-destructive' : ''"
            :disabled="item.disabled"
            @click="item.onClick">
            <component :is="item.icon" v-if="item.icon" class="mr-2 h-4 w-4" />
            {{ item.text }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
