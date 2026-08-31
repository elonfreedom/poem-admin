<script lang="ts" setup >
import { computed, ref } from 'vue';

import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';

const props = withDefaults(
  defineProps<{
    current?: number;
    pageSize?: number;
    total?: number;
    pageSizeOptions?: number[];
    showTotal?: boolean;
    showJumper?: boolean;
    showSizeChanger?: boolean;
  }>(),
  {
    current: 1,
    pageSize: 20,
    total: 0,
    pageSizeOptions: () => [10, 20, 50, 100],
    showTotal: true,
    showJumper: true,
    showSizeChanger: true,
  },
);

const emit = defineEmits<{
  'update:current': [value: number];
  'update:pageSize': [value: number];
}>();

/** 总页数 */
const totalPages = computed(() =>
  Math.ceil((props.total || 0) / (props.pageSize || 20)),
);

/** 显示的数字页码 */
const pageNumbers = computed(() => {
  const current = props.current || 1;
  const total = totalPages.value;
  const pages: number[] = [];

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  // 保证至少显示 5 个页码
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4);
    } else {
      start = Math.max(1, end - 4);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

/** 跳转输入框 */
const jumperValue = ref('');

/** 跳转到指定页 */
function handleJump() {
  const page = Number(jumperValue.value);
  if (page >= 1 && page <= totalPages.value) {
    emit('update:current', page);
  }
  jumperValue.value = '';
}

/** 切换每页条数 */
function handlePageSizeChange(value: any) {
  emit('update:pageSize', Number(value));
  emit('update:current', 1);
}

/** 切换页面 */
function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === props.current) return;
  emit('update:current', page);
}
</script>

<template>
  <div class="pagination">
    <!-- 总数 -->
    <div v-if="showTotal" class="pagination-total">
      共 <span class="font-medium text-foreground">{{ total }}</span> 条
    </div>

    <!-- 上一页 -->
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8"
      :disabled="current <= 1"
      aria-label="上一页"
      @click="goToPage(current - 1)">
      <ChevronLeft class="h-4 w-4" />
    </Button>

    <!-- 第一页 -->
    <Button
      v-if="pageNumbers.length > 0 && pageNumbers[0]! > 1"
      variant="outline"
      class="h-8 w-8"
      @click="goToPage(1)">
      1
    </Button>

    <!-- 前省略号 -->
    <span
      v-if="pageNumbers.length > 0 && pageNumbers[0]! > 2"
      class="pagination-ellipsis">
      •••
    </span>

    <!-- 页码 -->
    <Button
      v-for="page in pageNumbers"
      :key="page"
      :variant="page === current ? 'default' : 'outline'"
      class="h-8 w-8"
      @click="goToPage(page)">
      {{ page }}
    </Button>

    <!-- 后省略号 -->
    <span
      v-if="pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1]! < totalPages - 1"
      class="pagination-ellipsis">
      •••
    </span>

    <!-- 最后一页 -->
    <Button
      v-if="pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1]! < totalPages"
      variant="outline"
      class="h-8 w-8"
      @click="goToPage(totalPages)">
      {{ totalPages }}
    </Button>

    <!-- 下一页 -->
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8"
      :disabled="current >= totalPages"
      aria-label="下一页"
      @click="goToPage(current + 1)">
      <ChevronRight class="h-4 w-4" />
    </Button>

    <!-- 每页条数 -->
    <Select
      v-if="showSizeChanger"
      :model-value="String(pageSize)"
      @update:model-value="handlePageSizeChange">
      <SelectTrigger class="h-8 w-24">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="size in pageSizeOptions"
          :key="size"
          :value="String(size)">
          {{ size }} 条/页
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- 跳转 -->
    <div v-if="showJumper" class="pagination-jumper">
      <span class="text-muted-foreground">跳至</span>
      <input
        v-model="jumperValue"
        type="number"
        min="1"
        :max="totalPages"
        class="jumper-input"
        @keyup.enter="handleJump" />
      <span class="text-muted-foreground">页</span>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pagination-total {
  font-size: 13px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  margin-right: 8px;
}

.pagination-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 12px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  letter-spacing: 2px;
}

.pagination-jumper {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  font-size: 13px;
}

.jumper-input {
  width: 48px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--color-border, oklch(0.85 0.01 70 / 0.3));
  border-radius: 6px;
  background: var(--color-background, oklch(1 0 0));
  font-size: 13px;
  text-align: center;
  color: var(--color-foreground);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.jumper-input:focus {
  outline: none;
  border-color: var(--color-ring, oklch(0.6 0.05 60 / 0.5));
  box-shadow: 0 0 0 3px oklch(0.6 0.05 60 / 0.08);
}

.jumper-input::-webkit-inner-spin-button,
.jumper-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
