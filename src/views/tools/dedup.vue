<script lang="ts" setup >
import type { DedupGroup } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Archive,
  ArrowLeft,
  Calendar,
  CopyX,
  Eye,
  Info,
  ScanSearch,
  Trash2,
} from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Checkbox } from '#/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';

import PageHeader from '#/components/PageHeader.vue';
import {
  executeDedupApi,
  scanDuplicatesApi,
} from '#/api';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const router = useRouter();

// ======================== 匹配条件 ========================
const matchFields = ref<Array<'title' | 'author' | 'content'>>([
  'title',
  'author',
]);

const allFields: Array<{ key: 'title' | 'author' | 'content'; label: string }> = [
  { key: 'title', label: '标题相同' },
  { key: 'author', label: '作者相同' },
  { key: 'content', label: '内容相同' },
];

function toggleField(key: 'title' | 'author' | 'content') {
  const idx = matchFields.value.indexOf(key);
  if (idx > -1) {
    if (matchFields.value.length > 1) {
      matchFields.value.splice(idx, 1);
    }
  } else {
    matchFields.value.push(key);
  }
}

// 快捷预设
function presetTitleAuthor() {
  matchFields.value = ['title', 'author'];
}
function presetTitleOnly() {
  matchFields.value = ['title'];
}
function presetAll() {
  matchFields.value = ['title', 'author', 'content'];
}

// ======================== 筛选 ========================
const statusFilter = ref('__all__');
const dynastyFilter = ref('__all__');

const statusOptions = [
  { label: '全部状态', value: '__all__' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];

const dynastyOptions = [
  { label: '全部朝代', value: '__all__' },
  { label: '先秦', value: '先秦' },
  { label: '汉', value: '汉' },
  { label: '魏晋', value: '魏晋' },
  { label: '南北朝', value: '南北朝' },
  { label: '隋', value: '隋' },
  { label: '唐', value: '唐' },
  { label: '五代', value: '五代' },
  { label: '宋', value: '宋' },
  { label: '元', value: '元' },
  { label: '明', value: '明' },
  { label: '清', value: '清' },
  { label: '近代', value: '近代' },
  { label: '现代', value: '现代' },
  { label: '未知', value: '未知' },
];

// ======================== 扫描 ========================
const scanning = ref(false);
const scanResult = ref<{
  total_scanned: number;
  total_groups: number;
  total_duplicates: number;
  page: number;
  page_size: number;
  groups: DedupGroup[];
} | null>(null);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(20);

async function handleScan(page = 1) {
  scanning.value = true;
  currentPage.value = page;
  try {
    const result = await scanDuplicatesApi({
      match_fields: matchFields.value,
      status_filter: statusFilter.value === '__all__' ? undefined : statusFilter.value,
      dynasty_filter: dynastyFilter.value === '__all__' ? undefined : dynastyFilter.value,
      page,
      page_size: pageSize.value,
    });
    scanResult.value = result;
    // 初始化每组的默认选择
    initSelections(result.groups);
    if (page === 1) {
      toast.success(
        `扫描完成：共 ${result.total_scanned} 首，发现 ${result.total_groups} 组重复`,
      );
    }
  } catch {
    // error handled by interceptor
  } finally {
    scanning.value = false;
  }
}

// 总页数
const totalPages = computed(() => {
  if (!scanResult.value) return 0;
  return Math.ceil(scanResult.value.total_groups / scanResult.value.page_size);
});

// ======================== 选择管理 ========================
interface GroupSelection {
  keepId: number;
  archiveIds: number[];
  deleteIds: number[];
}

const selections = ref<Map<string, GroupSelection>>(new Map());

function initSelections(groups: DedupGroup[]) {
  const newMap = new Map<string, GroupSelection>();
  for (const group of groups) {
    const keepId = group.recommended_keep_id;
    newMap.set(group.group_id, {
      keepId,
      archiveIds: group.poems
        .filter((p) => p.id !== keepId)
        .map((p) => p.id),
      deleteIds: [],
    });
  }
  selections.value = newMap;
}

function setKeepId(groupId: string, keepId: number) {
  const sel = selections.value.get(groupId);
  if (!sel) return;
  // 旧保留项移回归档列表，新保留项从归档/删除列表移除
  const oldKeepId = sel.keepId;
  sel.keepId = keepId;

  // 从 archiveIds 和 deleteIds 中移除新 keepId
  sel.archiveIds = sel.archiveIds.filter((id) => id !== keepId);
  sel.deleteIds = sel.deleteIds.filter((id) => id !== keepId);

  // 旧 keepId 如果不是当前 keepId，加入 archiveIds
  if (oldKeepId !== keepId && !sel.archiveIds.includes(oldKeepId) && !sel.deleteIds.includes(oldKeepId)) {
    sel.archiveIds.push(oldKeepId);
  }
}

function toggleArchive(groupId: string, poemId: number) {
  const sel = selections.value.get(groupId);
  if (!sel) return;
  if (sel.keepId === poemId) return;
  const archiveIdx = sel.archiveIds.indexOf(poemId);
  const deleteIdx = sel.deleteIds.indexOf(poemId);
  if (archiveIdx > -1) {
    sel.archiveIds.splice(archiveIdx, 1);
  } else if (deleteIdx > -1) {
    sel.deleteIds.splice(deleteIdx, 1);
    sel.archiveIds.push(poemId);
  } else {
    sel.archiveIds.push(poemId);
  }
}

function toggleDelete(groupId: string, poemId: number) {
  const sel = selections.value.get(groupId);
  if (!sel) return;
  if (sel.keepId === poemId) return;
  const archiveIdx = sel.archiveIds.indexOf(poemId);
  const deleteIdx = sel.deleteIds.indexOf(poemId);
  if (deleteIdx > -1) {
    sel.deleteIds.splice(deleteIdx, 1);
  } else if (archiveIdx > -1) {
    sel.archiveIds.splice(archiveIdx, 1);
    sel.deleteIds.push(poemId);
  } else {
    sel.deleteIds.push(poemId);
  }
}

function setGroupAllArchive(groupId: string) {
  const sel = selections.value.get(groupId);
  if (!sel) return;
  sel.archiveIds = [];
  sel.deleteIds = [];
  const group = scanResult.value?.groups.find((g) => g.group_id === groupId);
  if (!group) return;
  for (const p of group.poems) {
    if (p.id !== sel.keepId) {
      sel.archiveIds.push(p.id);
    }
  }
}

function setGroupAllDelete(groupId: string) {
  const sel = selections.value.get(groupId);
  if (!sel) return;
  sel.archiveIds = [];
  sel.deleteIds = [];
  const group = scanResult.value?.groups.find((g) => g.group_id === groupId);
  if (!group) return;
  for (const p of group.poems) {
    if (p.id !== sel.keepId) {
      sel.deleteIds.push(p.id);
    }
  }
}

function clearGroupMarks(groupId: string) {
  const sel = selections.value.get(groupId);
  if (!sel) return;
  sel.archiveIds = [];
  sel.deleteIds = [];
}

// ======================== 汇总统计 ========================
const totalArchive = computed(() => {
  let n = 0;
  for (const sel of selections.value.values()) {
    n += sel.archiveIds.length;
  }
  return n;
});

const totalDelete = computed(() => {
  let n = 0;
  for (const sel of selections.value.values()) {
    n += sel.deleteIds.length;
  }
  return n;
});

const canExecute = computed(() => totalArchive.value + totalDelete.value > 0);

// ======================== 预览弹窗 ========================
const previewOpen = ref(false);
const previewList = ref<{ action: 'archive' | 'delete'; id: number; title: string }[]>([]);

function openPreview() {
  const list: typeof previewList.value = [];
  if (!scanResult.value) return;
  for (const group of scanResult.value.groups) {
    const sel = selections.value.get(group.group_id);
    if (!sel) continue;
    for (const p of group.poems) {
      if (sel.archiveIds.includes(p.id)) {
        list.push({ action: 'archive', id: p.id, title: p.title_sc || p.title });
      } else if (sel.deleteIds.includes(p.id)) {
        list.push({ action: 'delete', id: p.id, title: p.title_sc || p.title });
      }
    }
  }
  previewList.value = list;
  previewOpen.value = true;
}

// ======================== 执行 ========================
const executing = ref(false);

async function handleExecute() {
  const archiveIds: number[] = [];
  const deleteIds: number[] = [];
  for (const sel of selections.value.values()) {
    archiveIds.push(...sel.archiveIds);
    deleteIds.push(...sel.deleteIds);
  }

  executing.value = true;
  try {
    const result = await executeDedupApi({
      archive_ids: archiveIds,
      delete_ids: deleteIds,
    });
    toast.success(
      `处理完成：归档 ${result.archived} 首，删除 ${result.deleted} 首`,
    );
    // 移除已处理的组，重新初始化
    removeProcessedGroups(archiveIds, deleteIds);
    previewOpen.value = false;
  } catch {
    // error handled by interceptor
  } finally {
    executing.value = false;
  }
}

function removeProcessedGroups(archiveIds: number[], deleteIds: number[]) {
  if (!scanResult.value) return;
  const processedIds = new Set([...archiveIds, ...deleteIds]);
  const remainingGroups: DedupGroup[] = [];
  for (const group of scanResult.value.groups) {
    // 如果组内有任何诗文被处理，检查是否还有未处理的
    const hasProcessed = group.poems.some((p) => processedIds.has(p.id));
    if (hasProcessed) {
      // 移除已处理的诗文，如果剩余 > 1 则保留该组
      const remaining = group.poems.filter((p) => !processedIds.has(p.id));
      if (remaining.length > 1 && remaining[0]) {
        remainingGroups.push({
          ...group,
          poems: remaining,
          recommended_keep_id: remaining[0].id,
        });
      }
      // 移除该组的 selection
      selections.value.delete(group.group_id);
    } else {
      remainingGroups.push(group);
    }
  }
  // 分页模式：执行后重新加载当前页
  scanResult.value = {
    ...scanResult.value,
    groups: remainingGroups,
  };
  // 如果当前页变空且不是第一页，回退到上一页
  if (remainingGroups.length === 0 && currentPage.value > 1) {
    handleScan(currentPage.value - 1);
  } else if (remainingGroups.length === 0) {
    // 第一页也为空，说明全部处理完毕
    scanResult.value = null;
  }
}

// ======================== 辅助 ========================
const statusVariant: Record<string, string> = {
  draft: 'secondary',
  published: 'default',
  archived: 'outline',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const statusDotColor: Record<string, string> = {
  draft: 'bg-yellow-500',
  published: 'bg-emerald-500',
  archived: 'bg-gray-400',
};

function truncate(text: string, len: number): string {
  if (!text) return '-';
  const cleaned = text.replace(/\n/g, ' ');
  return cleaned.length > len ? cleaned.slice(0, len) + '...' : cleaned;
}

// 查看诗文详情弹窗
const viewDialogOpen = ref(false);
const viewDetail = ref<any>(null);

function onView(poem: any) {
  viewDetail.value = poem;
  viewDialogOpen.value = true;
}

function isActionSelected(groupId: string, poemId: number, action: 'archive' | 'delete') {
  const sel = selections.value.get(groupId);
  if (!sel) return false;
  if (action === 'archive') return sel.archiveIds.includes(poemId);
  return sel.deleteIds.includes(poemId);
}
</script>

<template>
  <div class="space-y-4 pb-20">
    <PageHeader title="诗文去重工具">
      <template #description>
        扫描重复诗文，分组对比后批量归档或删除
      </template>
      <template #extra>
        <Button variant="outline" size="sm" @click="router.push('/tools')">
          <ArrowLeft class="mr-2 h-4 w-4" />
          返回工具页
        </Button>
      </template>
    </PageHeader>

    <!-- 扫描配置卡片 -->
    <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div class="space-y-4">
        <div>
          <div class="mb-2 flex items-center gap-2 text-sm font-medium">
            <ScanSearch class="h-4 w-4 text-primary" />
            匹配条件
            <span class="text-xs text-muted-foreground">
              （满足以下所有条件的视为重复）
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="field in allFields"
              :key="field.key"
              type="button"
              class="match-field-btn"
              :class="{ active: matchFields.includes(field.key) }"
              @click="toggleField(field.key)">
              <Checkbox
                :modelValue="matchFields.includes(field.key)"
                class="pointer-events-none h-3.5 w-3.5" />
              {{ field.label }}
            </button>
          </div>
          <div class="mt-2 flex gap-2">
            <button
              type="button"
              class="preset-btn"
              :class="{ active: matchFields.length === 2 && matchFields.includes('title') && matchFields.includes('author') }"
              @click="presetTitleAuthor">
              标题+作者
            </button>
            <button
              type="button"
              class="preset-btn"
              :class="{ active: matchFields.length === 1 && matchFields.includes('title') }"
              @click="presetTitleOnly">
              仅标题
            </button>
            <button
              type="button"
              class="preset-btn"
              :class="{ active: matchFields.length === 3 }"
              @click="presetAll">
              标题+作者+内容
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">状态范围</label>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">朝代范围</label>
            <Select v-model="dynastyFilter">
              <SelectTrigger class="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in dynastyOptions"
                  :key="opt.value"
                  :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            class="h-9"
            :disabled="scanning"
            @click="handleScan">
            <ScanSearch class="mr-1.5 h-3.5 w-3.5" />
            {{ scanning ? '扫描中...' : '开始扫描' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 扫描结果 -->
    <template v-if="scanResult">
      <!-- 统计栏 -->
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-6">
          <div>
            <span class="text-sm text-muted-foreground">扫描总数</span>
            <span class="ml-2 text-lg font-semibold">{{ scanResult.total_scanned }}</span>
            <span class="text-sm text-muted-foreground">首</span>
          </div>
          <div class="h-6 w-px bg-border" />
          <div>
            <span class="text-sm text-muted-foreground">重复组</span>
            <span class="ml-2 text-lg font-semibold text-orange-500">{{ scanResult.total_groups }}</span>
            <span class="text-sm text-muted-foreground">组</span>
          </div>
          <div class="h-6 w-px bg-border" />
          <div>
            <span class="text-sm text-muted-foreground">涉及</span>
            <span class="ml-2 text-lg font-semibold text-orange-500">{{ scanResult.total_duplicates }}</span>
            <span class="text-sm text-muted-foreground">首</span>
          </div>
        </div>
      </div>

      <!-- 无结果 -->
      <div
        v-if="scanResult.groups.length === 0"
        class="rounded-xl border border-border bg-card p-12 shadow-sm">
        <div class="flex flex-col items-center justify-center text-center">
          <ScanSearch class="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p class="text-base font-medium text-foreground">未发现重复诗文</p>
          <p class="mt-1 text-sm text-muted-foreground">
            当前匹配条件下没有发现重复，可尝试调整匹配条件或筛选范围
          </p>
        </div>
      </div>

      <!-- 重复组列表 -->
      <div v-else class="space-y-4">
        <!-- 分页信息 -->
        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            第 {{ scanResult.page }} / {{ totalPages }} 页，
            共 {{ scanResult.total_groups }} 组重复
          </span>
        </div>

        <div
          v-for="group in scanResult.groups"
          :key="group.group_id"
          class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <!-- 组标题 -->
          <div class="border-b border-border bg-muted/30 px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CopyX class="h-4 w-4 text-orange-500" />
                <span class="text-sm font-medium">{{ group.match_reason }}</span>
                <span class="text-sm text-muted-foreground">
                  「{{ group.match_key }}」
                </span>
                <Badge variant="outline" class="text-xs">
                  {{ group.poems.length }} 首
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  @click="setGroupAllArchive(group.group_id)">
                  <Archive class="mr-1 h-3 w-3" />
                  全组归档
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-destructive"
                  @click="setGroupAllDelete(group.group_id)">
                  <Trash2 class="mr-1 h-3 w-3" />
                  全组删除
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  @click="clearGroupMarks(group.group_id)">
                  清空标记
                </Button>
              </div>
            </div>
          </div>
          <!-- 诗文对比卡片 -->
          <div class="p-4">
            <div class="grid gap-3" :class="group.poems.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'">
              <div
                v-for="poem in group.poems"
                :key="poem.id"
                class="poem-compare-card"
                :class="{
                  'is-keep': selections.get(group.group_id)?.keepId === poem.id,
                  'is-archive': isActionSelected(group.group_id, poem.id, 'archive'),
                  'is-delete': isActionSelected(group.group_id, poem.id, 'delete'),
                }">
                <!-- 保留选择 -->
                <div class="mb-2 flex items-center justify-between">
                  <label class="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      :name="`keep-${group.group_id}`"
                      :checked="selections.get(group.group_id)?.keepId === poem.id"
                      class="h-3.5 w-3.5 accent-primary"
                      @change="setKeepId(group.group_id, poem.id)" />
                    <span class="text-xs font-medium">
                      {{ selections.get(group.group_id)?.keepId === poem.id ? '保留' : '设为保留' }}
                    </span>
                  </label>
                  <Button
                    variant="ghost"
                    size="xs"
                    class="h-6 w-6 p-0"
                    @click="onView(poem)">
                    <Eye class="h-3 w-3" />
                  </Button>
                </div>

                <!-- 元信息 -->
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-muted-foreground">#{{ poem.id }}</span>
                    <Badge
                      :variant="statusVariant[poem.status] as any"
                      class="status-badge text-xs">
                      <span class="status-dot" :class="statusDotColor[poem.status]" />
                      {{ statusLabels[poem.status] || poem.status }}
                    </Badge>
                  </div>

                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span v-if="poem.dynasty">{{ poem.dynasty }}</span>
                    <span v-if="poem.category_name">{{ poem.category_name }}</span>
                    <span v-if="poem.created_at" class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      {{ formatDateTime(poem.created_at) }}
                    </span>
                  </div>

                  <!-- 完整度 -->
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      class="completeness-tag"
                      :class="poem.translation ? 'has' : 'missing'">
                      {{ poem.translation ? '✓' : '✗' }} 翻译
                    </span>
                    <span
                      class="completeness-tag"
                      :class="poem.appreciation ? 'has' : 'missing'">
                      {{ poem.appreciation ? '✓' : '✗' }} 赏析
                    </span>
                    <span
                      class="completeness-tag"
                      :class="poem.tags?.length ? 'has' : 'missing'">
                      {{ poem.tags?.length ? '✓' : '✗' }} 标签
                    </span>
                  </div>

                  <!-- 内容预览 -->
                  <div class="poem-content-preview">
                    {{ truncate((poem.content_sc || poem.content || '').replace(/\n/g, ' '), 60) }}
                  </div>
                </div>

                <!-- 操作选择 -->
                <div
                  v-if="selections.get(group.group_id)?.keepId !== poem.id"
                  class="mt-3 flex items-center gap-3 border-t border-border pt-2">
                  <label class="flex cursor-pointer items-center gap-1">
                    <Checkbox
                      :modelValue="isActionSelected(group.group_id, poem.id, 'archive')"
                      @update:modelValue="toggleArchive(group.group_id, poem.id)" />
                    <span class="text-xs">归档</span>
                  </label>
                  <label class="flex cursor-pointer items-center gap-1">
                    <Checkbox
                      :modelValue="isActionSelected(group.group_id, poem.id, 'delete')"
                      @update:modelValue="toggleDelete(group.group_id, poem.id)" />
                    <span class="text-xs text-destructive">删除</span>
                  </label>
                </div>
                <div v-else class="mt-3 border-t border-border pt-2">
                  <span class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <Info class="h-3 w-3" />
                    将保留此诗文
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1 || scanning"
            @click="handleScan(1)">
            首页
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1 || scanning"
            @click="handleScan(currentPage - 1)">
            上一页
          </Button>
          <span class="px-3 text-sm text-muted-foreground">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages || scanning"
            @click="handleScan(currentPage + 1)">
            下一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages || scanning"
            @click="handleScan(totalPages)">
            末页
          </Button>
        </div>
      </div>
    </template>

    <!-- 底部汇总操作栏 -->
    <div
      v-if="scanResult && scanResult.groups.length > 0"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">已标记：</span>
          <span v-if="totalArchive > 0" class="flex items-center gap-1">
            <Archive class="h-3.5 w-3.5 text-orange-500" />
            <span class="font-medium">{{ totalArchive }}</span> 首待归档
          </span>
          <span v-if="totalDelete > 0" class="flex items-center gap-1">
            <Trash2 class="h-3.5 w-3.5 text-destructive" />
            <span class="font-medium">{{ totalDelete }}</span> 首待删除
          </span>
          <span v-if="!canExecute" class="text-muted-foreground">
            请在重复组中选择要归档或删除的诗文
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!canExecute"
            @click="openPreview">
            查看预览
          </Button>
          <Button
            size="sm"
            :disabled="!canExecute || executing"
            @click="openPreview">
            {{ executing ? '执行中...' : '确认执行' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 预览确认弹窗 -->
    <Dialog v-model:open="previewOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>确认执行去重操作</DialogTitle>
          <DialogDescription>
            以下操作将直接修改数据库，请确认
          </DialogDescription>
        </DialogHeader>
        <div class="max-h-80 space-y-3 overflow-y-auto">
          <div v-if="totalArchive > 0" class="space-y-1">
            <div class="flex items-center gap-1 text-sm font-medium text-orange-500">
              <Archive class="h-3.5 w-3.5" />
              待归档 {{ totalArchive }} 首
            </div>
            <div class="ml-5 flex flex-wrap gap-1">
              <Badge
                v-for="item in previewList.filter((i) => i.action === 'archive')"
                :key="`a-${item.id}`"
                variant="outline"
                class="text-xs">
                #{{ item.id }} {{ item.title }}
              </Badge>
            </div>
          </div>
          <div v-if="totalDelete > 0" class="space-y-1">
            <div class="flex items-center gap-1 text-sm font-medium text-destructive">
              <Trash2 class="h-3.5 w-3.5" />
              待删除 {{ totalDelete }} 首（不可恢复）
            </div>
            <div class="ml-5 flex flex-wrap gap-1">
              <Badge
                v-for="item in previewList.filter((i) => i.action === 'delete')"
                :key="`d-${item.id}`"
                variant="outline"
                class="text-xs text-destructive">
                #{{ item.id }} {{ item.title }}
              </Badge>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="previewOpen = false">
            取消
          </Button>
          <Button
            variant="destructive"
            :disabled="executing"
            @click="handleExecute">
            {{ executing ? '执行中...' : '确认执行' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 诗文详情弹窗 -->
    <Dialog v-model:open="viewDialogOpen">
      <DialogContent v-if="viewDetail" class="max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Eye class="h-5 w-5" />
            {{ viewDetail.title_sc || viewDetail.title }}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{{ viewDetail.dynasty || '未知朝代' }}</span>
            <span>{{ viewDetail.author_sc || viewDetail.author || '佚名' }}</span>
            <Badge :variant="statusVariant[viewDetail.status] as any">
              {{ statusLabels[viewDetail.status] || viewDetail.status }}
            </Badge>
          </div>
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">内容</h4>
            <div class="poetry-content">
              {{ viewDetail.content_sc || viewDetail.content }}
            </div>
          </div>
          <div v-if="viewDetail.translation" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">翻译</h4>
            <p class="text-sm whitespace-pre-wrap">{{ viewDetail.translation }}</p>
          </div>
          <div v-if="viewDetail.appreciation" class="space-y-2">
            <h4 class="text-sm font-medium text-muted-foreground">赏析</h4>
            <p class="text-sm whitespace-pre-wrap">{{ viewDetail.appreciation }}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* ===== 匹配条件按钮 ===== */
.match-field-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.match-field-btn:hover {
  background: oklch(0.97 0.005 80 / 0.5);
}

.match-field-btn.active {
  border-color: var(--color-primary);
  background: oklch(from var(--color-primary) 97% 0.02 h / 0.1);
  color: var(--color-primary);
}

/* ===== 快捷预设按钮 ===== */
.preset-btn {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  background: oklch(0.97 0.005 80 / 0.5);
}

.preset-btn.active {
  background: oklch(from var(--color-primary) 97% 0.02 h / 0.15);
  color: var(--color-primary);
  border-color: oklch(from var(--color-primary) 85% 0.05 h / 0.3);
}

/* ===== 诗文对比卡片 ===== */
.poem-compare-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: oklch(0.98 0.005 80 / 0.3);
  transition: all 0.15s ease;
}

.poem-compare-card:hover {
  border-color: oklch(from var(--color-primary) 70% 0.03 h / 0.4);
}

.poem-compare-card.is-keep {
  border-color: oklch(0.7 0.1 145 / 0.4);
  background: oklch(0.7 0.1 145 / 0.06);
}

.poem-compare-card.is-archive {
  border-color: oklch(0.7 0.12 60 / 0.4);
  background: oklch(0.7 0.12 60 / 0.06);
}

.poem-compare-card.is-delete {
  border-color: oklch(0.55 0.15 25 / 0.4);
  background: oklch(0.55 0.15 25 / 0.06);
}

.dark .poem-compare-card {
  background: oklch(0.15 0.01 60 / 0.3);
}

.dark .poem-compare-card.is-keep {
  border-color: oklch(0.7 0.1 145 / 0.5);
  background: oklch(0.7 0.1 145 / 0.08);
}

.dark .poem-compare-card.is-archive {
  border-color: oklch(0.7 0.12 60 / 0.5);
  background: oklch(0.7 0.12 60 / 0.08);
}

.dark .poem-compare-card.is-delete {
  border-color: oklch(0.65 0.12 25 / 0.5);
  background: oklch(0.65 0.12 25 / 0.08);
}

/* ===== 完整度标签 ===== */
.completeness-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.completeness-tag.has {
  color: oklch(0.5 0.1 145);
  background: oklch(0.7 0.1 145 / 0.1);
}

.completeness-tag.missing {
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  background: oklch(0.95 0.005 60 / 0.5);
}

.dark .completeness-tag.has {
  color: oklch(0.75 0.1 145);
  background: oklch(0.7 0.1 145 / 0.15);
}

.dark .completeness-tag.missing {
  color: oklch(0.5 0.005 60);
  background: oklch(0.2 0.01 60 / 0.5);
}

/* ===== 内容预览 ===== */
.poem-content-preview {
  padding: 8px 10px;
  border-radius: 4px;
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
  line-height: 1.8;
  background: oklch(0.97 0.005 80 / 0.5);
  color: oklch(0.3 0.01 60);
}

.dark .poem-content-preview {
  background: oklch(0.18 0.008 60 / 0.5);
  color: oklch(0.8 0.01 70);
}

/* ===== 状态标签 ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

/* ===== 诗文详情弹窗内容 ===== */
.poetry-content {
  padding: 16px;
  background: oklch(0.97 0.005 80 / 0.5);
  border-radius: 8px;
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  line-height: 2;
  white-space: pre-wrap;
}

.dark .poetry-content {
  background: oklch(0.18 0.008 60 / 0.5);
}
</style>
