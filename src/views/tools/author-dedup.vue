<script lang="ts" setup >
import type { AuthorDedupGroup } from '#/api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ArrowLeft,
  BookUser,
  CopyX,
  ScanSearch,
  Users,
} from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';

import PageHeader from '#/components/PageHeader.vue';
import {
  mergeAuthorsApi,
  scanAuthorDuplicatesApi,
} from '#/api';
import { toast } from 'vue-sonner';

const router = useRouter();

// ======================== 匹配条件 ========================
type MatchBy = 'name' | 'name_dynasty';
const matchBy = ref<MatchBy>('name_dynasty');

const matchByOptions = [
  { label: '姓名 + 朝代', value: 'name_dynasty' },
  { label: '仅姓名', value: 'name' },
];

// ======================== 扫描 ========================
const scanning = ref(false);
const scanResult = ref<{
  total_scanned: number;
  total_groups: number;
  groups: AuthorDedupGroup[];
} | null>(null);

async function handleScan() {
  scanning.value = true;
  try {
    const result = await scanAuthorDuplicatesApi({
      match_by: matchBy.value,
    });
    scanResult.value = result;
    initSelections(result.groups);
    toast.success(
      `扫描完成：共 ${result.total_scanned} 个作者，发现 ${result.total_groups} 组重复`,
    );
  } catch {
    // error handled by interceptor
  } finally {
    scanning.value = false;
  }
}

// ======================== 选择管理 ========================
const keepSelections = ref<Map<string, number>>(new Map());

function initSelections(groups: AuthorDedupGroup[]) {
  const newMap = new Map<string, number>();
  for (const group of groups) {
    // 默认选诗歌数最多的作为保留项
    const sorted = [...group.authors].sort((a, b) => (b.poem_count ?? 0) - (a.poem_count ?? 0));
    newMap.set(group.group_id, sorted[0]?.id ?? 0);
  }
  keepSelections.value = newMap;
}

function setKeepId(groupId: string, authorId: number) {
  keepSelections.value.set(groupId, authorId);
}

// ======================== 合并 ========================
const executingGroups = ref<Set<string>>(new Set());

async function handleMergeGroup(groupId: string) {
  const group = scanResult.value?.groups.find((g) => g.group_id === groupId);
  if (!group) return;
  const keepId = keepSelections.value.get(groupId);
  if (!keepId) return;

  const mergeIds = group.authors
    .filter((a) => a.id !== keepId)
    .map((a) => a.id);
  if (mergeIds.length === 0) return;

  executingGroups.value.add(groupId);
  try {
    const result = await mergeAuthorsApi({
      keep_id: keepId,
      merge_ids: mergeIds,
    });
    toast.success(result.message || `合并完成，已处理 ${result.merged} 个作者`);
    removeGroup(groupId);
  } catch {
    // error handled by interceptor
  } finally {
    executingGroups.value.delete(groupId);
  }
}

function removeGroup(groupId: string) {
  if (!scanResult.value) return;
  scanResult.value = {
    ...scanResult.value,
    groups: scanResult.value.groups.filter((g) => g.group_id !== groupId),
  };
  keepSelections.value.delete(groupId);
}

// ======================== 统计 ========================
const totalToMerge = computed(() => {
  if (!scanResult.value) return 0;
  let n = 0;
  for (const group of scanResult.value.groups) {
    n += group.authors.length - 1;
  }
  return n;
});
</script>

<template>
  <div class="space-y-4 pb-20">
    <PageHeader title="作者查重工具">
      <template #description>
        扫描重复作者，合并后重新关联诗歌
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
      <div class="flex flex-wrap items-end gap-3">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">匹配方式</label>
          <Select v-model="matchBy">
            <SelectTrigger class="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in matchByOptions"
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

    <!-- 扫描结果 -->
    <template v-if="scanResult">
      <!-- 统计栏 -->
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-6">
          <div>
            <span class="text-sm text-muted-foreground">作者总数</span>
            <span class="ml-2 text-lg font-semibold">{{ scanResult.total_scanned }}</span>
            <span class="text-sm text-muted-foreground">个</span>
          </div>
          <div class="h-6 w-px bg-border" />
          <div>
            <span class="text-sm text-muted-foreground">重复组</span>
            <span class="ml-2 text-lg font-semibold text-orange-500">{{ scanResult.total_groups }}</span>
            <span class="text-sm text-muted-foreground">组</span>
          </div>
        </div>
      </div>

      <!-- 无结果 -->
      <div
        v-if="scanResult.groups.length === 0"
        class="rounded-xl border border-border bg-card p-12 shadow-sm">
        <div class="flex flex-col items-center justify-center text-center">
          <ScanSearch class="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p class="text-base font-medium text-foreground">未发现重复作者</p>
          <p class="mt-1 text-sm text-muted-foreground">
            当前匹配条件下没有发现重复作者，可尝试调整匹配方式
          </p>
        </div>
      </div>

      <!-- 重复组列表 -->
      <div v-else class="space-y-4">
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
                  {{ group.author_count }} 个
                </Badge>
              </div>
              <Button
                size="xs"
                :disabled="executingGroups.has(group.group_id)"
                @click="handleMergeGroup(group.group_id)">
                <Users v-if="!executingGroups.has(group.group_id)" class="mr-1 h-3 w-3" />
                <Users v-else class="mr-1 h-3 w-3 animate-spin" />
                {{ executingGroups.has(group.group_id) ? '合并中...' : '合并此组' }}
              </Button>
            </div>
          </div>

          <!-- 作者列表 -->
          <div class="p-4">
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="author in group.authors"
                :key="author.id"
                class="author-card rounded-lg border p-3 transition-all"
                :class="{
                  'is-keep': keepSelections.get(group.group_id) === author.id,
                }">
                <div class="mb-2 flex items-center justify-between">
                  <label class="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      :name="`keep-${group.group_id}`"
                      :checked="keepSelections.get(group.group_id) === author.id"
                      class="h-3.5 w-3.5 accent-primary"
                      @change="setKeepId(group.group_id, author.id)" />
                    <span class="text-xs font-medium">
                      {{ keepSelections.get(group.group_id) === author.id ? '保留' : '设为保留' }}
                    </span>
                  </label>
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-sm font-medium">
                    {{ author.name }}
                    <span v-if="author.name_traditional" class="text-xs text-muted-foreground">
                      ({{ author.name_traditional }})
                    </span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <span v-if="author.dynasty" class="dynasty-tag">{{ author.dynasty }}</span>
                    <span v-else class="text-muted-foreground/50">未知朝代</span>
                  </div>
                  <div class="flex items-center gap-1 text-xs">
                    <BookUser class="h-3 w-3 text-muted-foreground" />
                    <span class="font-medium tabular-nums">{{ author.poem_count ?? 0 }}</span>
                    <span class="text-muted-foreground">首诗歌</span>
                  </div>
                  <div v-if="author.biography" class="line-clamp-2 text-xs text-muted-foreground">
                    {{ author.biography }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 底部汇总操作栏 -->
    <div
      v-if="scanResult && scanResult.groups.length > 0"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div class="flex items-center gap-4 text-sm">
          <span class="text-muted-foreground">共 {{ totalToMerge }} 个重复作者待合并</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">点击各组「合并此组」按钮逐一处理</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 作者卡片 ===== */
.author-card {
  border-color: var(--color-border);
  background: oklch(0.98 0.005 80 / 0.3);
  transition: all 0.15s ease;
}

.author-card:hover {
  border-color: oklch(from var(--color-primary) 70% 0.03 h / 0.4);
}

.author-card.is-keep {
  border-color: oklch(0.7 0.1 145 / 0.4);
  background: oklch(0.7 0.1 145 / 0.06);
}

.dark .author-card {
  background: oklch(0.15 0.01 60 / 0.3);
}

.dark .author-card.is-keep {
  border-color: oklch(0.7 0.1 145 / 0.5);
  background: oklch(0.7 0.1 145 / 0.08);
}

/* ===== 朝代标签 ===== */
.dynasty-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  background: oklch(0.95 0.01 75);
  color: oklch(0.4 0.02 60);
}

.dark .dynasty-tag {
  background: oklch(0.2 0.01 60);
  color: oklch(0.75 0.02 70);
}
</style>
