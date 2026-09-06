<script lang="ts" setup >
import type { Tag } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { Eye, LayoutGrid, List, Pencil, Plus, Search, Tag as TagIcon, Trash2 } from 'lucide-vue-next';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Checkbox } from '#/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/components/ui/dropdown-menu';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';

import PageHeader from '#/components/PageHeader.vue';
import { Pagination } from '#/components/ui/pagination';
import {
  createTagApi,
  deleteTagApi,
  getTagListApi,
  updateTagApi,
} from '#/api';
import { toast } from 'vue-sonner';

// ==================== 状态 ====================

const tagList = ref<Tag[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedIds = ref<Set<number>>(new Set());
const viewMode = ref<'table' | 'cloud'>('table');

// 分页
const currentPage = ref(1);
const pageSize = ref(20);

// 弹窗状态
const modalVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitting = ref(false);
const deleting = ref(false);

const editingId = ref<null | number>(null);
const deleteTarget = ref<Tag | null>(null);

const formData = ref({
  name: '',
});

const errors = ref<Record<string, string>>({});

// ==================== 计算属性 ====================

const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return tagList.value;
  const query = searchQuery.value.toLowerCase();
  return tagList.value.filter((tag) => tag.name.toLowerCase().includes(query));
});

const sortedList = computed(() => {
  return [...filteredList.value].sort((a, b) => (b.poem_count ?? 0) - (a.poem_count ?? 0));
});

// 分页数据
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedList.value.slice(start, start + pageSize.value);
});

const allSelected = computed(() => {
  const ids = filteredList.value.map((t) => t.id);
  return ids.length > 0 && ids.every((id) => selectedIds.value.has(id));
});

const selectedCount = computed(() => selectedIds.value.size);

const totalTags = computed(() => tagList.value.length);

const totalPoems = computed(() => tagList.value.reduce((sum, t) => sum + (t.poem_count ?? 0), 0));

// ==================== 方法 ====================

async function fetchList() {
  try {
    loading.value = true;
    tagList.value = await getTagListApi();
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
}

function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear();
  } else {
    filteredList.value.forEach((t) => selectedIds.value.add(t.id));
  }
}

function handleAdd() {
  editingId.value = null;
  formData.value = { name: '' };
  errors.value = {};
  modalVisible.value = true;
}

function handleEdit(tag: Tag) {
  editingId.value = tag.id;
  formData.value = { name: tag.name };
  errors.value = {};
  modalVisible.value = true;
}

async function handleSubmit() {
  errors.value = {};
  if (!formData.value.name.trim()) {
    errors.value.name = '请输入标签名称';
    return;
  }

  try {
    submitting.value = true;
    if (editingId.value) {
      await updateTagApi(editingId.value, formData.value);
      toast.success('标签更新成功');
    } else {
      await createTagApi(formData.value);
      toast.success('标签创建成功');
    }
    modalVisible.value = false;
    await fetchList();
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(tag: Tag) {
  deleteTarget.value = tag;
  deleteDialogVisible.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;

  try {
    deleting.value = true;
    await deleteTagApi(deleteTarget.value.id);
    toast.success('删除成功');
    deleteDialogVisible.value = false;
    selectedIds.value.delete(deleteTarget.value.id);
    await fetchList();
  } catch {
    // error handled by interceptor
  } finally {
    deleting.value = false;
    deleteTarget.value = null;
  }
}

function handleView(tag: Tag) {
  window.location.hash = `#/poetry/list?tag_id=${tag.id}`;
}

// 搜索时重置到第一页
watch(searchQuery, () => {
  currentPage.value = 1;
  selectedIds.value.clear();
});

function handlePageChange(page: number) {
  currentPage.value = page;
  selectedIds.value.clear();
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="space-y-4">
    <!-- 页面标题 -->
    <PageHeader title="标签管理" description="管理诗词的特征标记，一首诗可以有多个标签">
      <template #extra>
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新建标签
        </Button>
      </template>
    </PageHeader>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 gap-3">
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TagIcon class="h-5 w-5 text-primary" />
          </div>
          <div>
            <div class="text-2xl font-bold text-foreground">{{ totalTags }}</div>
            <div class="text-sm text-muted-foreground">标签总数</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <LayoutGrid class="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <div class="text-2xl font-bold text-foreground">{{ totalPoems }}</div>
            <div class="text-sm text-muted-foreground">标签引用次数</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 搜索 + 视图切换 -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索标签名称..."
          class="pl-9" />
      </div>
      <div class="flex rounded-md border border-border">
        <Button
          :variant="viewMode === 'table' ? 'secondary' : 'ghost'"
          size="sm"
          class="rounded-r-none"
          @click="viewMode = 'table'">
          <List class="h-4 w-4" />
        </Button>
        <Button
          :variant="viewMode === 'cloud' ? 'secondary' : 'ghost'"
          size="sm"
          class="rounded-l-none border-l"
          @click="viewMode = 'cloud'">
          <LayoutGrid class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 标签表格 -->
    <Card>
      <CardContent class="p-0">
        <!-- 空状态 -->
        <div v-if="!loading && tagList.length === 0" class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <TagIcon class="h-8 w-8 text-primary" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">暂无标签</h3>
          <p class="mb-4 text-sm text-muted-foreground">
            标签是诗词的特征标记，一首诗可以有多个标签
          </p>
          <Button @click="handleAdd">
            <Plus class="mr-2 h-4 w-4" />
            创建第一个标签
          </Button>
        </div>

        <!-- 搜索无结果 -->
        <div v-else-if="!loading && filteredList.length === 0" class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search class="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">
            未找到匹配「{{ searchQuery }}」的标签
          </h3>
          <div class="mt-4 flex gap-2">
            <Button variant="outline" @click="searchQuery = ''">清除搜索</Button>
            <Button @click="handleAdd">
              <Plus class="mr-2 h-4 w-4" />
              新建此标签
            </Button>
          </div>
        </div>

        <!-- 表格视图 -->
        <Table v-else-if="viewMode === 'table'">
          <TableHeader>
            <TableRow class="bg-muted/50">
              <TableHead class="w-[40px]">
                <Checkbox :checked="allSelected" @update:checked="toggleSelectAll" />
              </TableHead>
              <TableHead>标签名称</TableHead>
              <TableHead class="w-[100px] text-center">诗歌数</TableHead>
              <TableHead class="w-[180px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- 加载状态 -->
            <TableRow v-if="loading" v-for="i in 5" :key="i">
              <TableCell><Checkbox disabled /></TableCell>
              <TableCell><div class="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell><div class="mx-auto h-4 w-12 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell><div class="ml-auto h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
            </TableRow>

            <!-- 数据行 -->
            <TableRow
              v-for="(row, index) in pagedList"
              v-else
              :key="row.id"
              class="transition-colors hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  :checked="selectedIds.has(row.id)"
                  @update:checked="toggleSelect(row.id)" />
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <TagIcon class="h-4 w-4 text-primary/60" />
                  <span class="font-medium text-foreground">{{ row.name }}</span>
                  <Badge
                    v-if="index < 3"
                    class="bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800">
                    Top {{ index + 1 }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell class="text-center">
                <Badge
                  v-if="(row.poem_count ?? 0) > 0"
                  variant="secondary"
                  class="bg-primary/10 font-medium text-primary">
                  {{ row.poem_count }} 首
                </Badge>
                <span v-else class="text-sm text-muted-foreground">0</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0" title="查看诗歌" @click="handleView(row as Tag)">
                    <Eye class="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0" title="编辑" @click="handleEdit(row as Tag)">
                    <Pencil class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    title="删除"
                    @click="confirmDelete(row as Tag)">
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- 标签云视图 -->
        <div v-else-if="viewMode === 'cloud'" class="p-6">
          <div v-if="loading" class="flex flex-wrap gap-3">
            <div v-for="i in 12" :key="i" class="h-8 w-16 animate-pulse rounded-full bg-muted" />
          </div>
          <div v-else class="flex flex-wrap items-center gap-3">
            <button
              v-for="(tag, index) in pagedList"
              :key="tag.id"
              class="group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all hover:scale-105"
              :class="[
                index === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                index === 1 ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                index === 2 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                'bg-primary/5 text-primary hover:bg-primary/10 dark:bg-primary/10',
              ]"
              :style="{
                fontSize: `${Math.max(12, Math.min(20, 12 + (tag.poem_count ?? 0) / 20))}px`,
              }"
              @click="handleView(tag as Tag)">
              <TagIcon class="h-3 w-3 opacity-60" />
              <span class="font-medium">{{ tag.name }}</span>
              <span
                v-if="(tag.poem_count ?? 0) > 0"
                class="ml-0.5 text-xs opacity-60">
                {{ tag.poem_count }}
              </span>
            </button>
          </div>
        </div>

        <!-- 底部统计 + 分页 -->
        <div v-if="!loading && tagList.length > 0" class="flex items-center justify-between border-t border-border px-4 py-3">
          <div class="flex items-center gap-4">
            <span class="text-sm text-muted-foreground">
              共 {{ sortedList.length }} 个标签
            </span>
            <div v-if="selectedCount > 0" class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">已选 {{ selectedCount }} 项</span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="sm">批量操作</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <TagIcon class="mr-2 h-4 w-4" />
                    批量合并
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive">
                    <Trash2 class="mr-2 h-4 w-4" />
                    批量删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Pagination
            v-if="sortedList.length > pageSize"
            :current="currentPage"
            :page-size="pageSize"
            :total="sortedList.length"
            :show-total="false"
            :show-jumper="false"
            :show-size-changer="false"
            @update:current="handlePageChange"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 新建/编辑弹窗 -->
    <Dialog v-model:open="modalVisible">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑标签' : '新建标签' }}</DialogTitle>
          <DialogDescription>
            {{ editingId ? '修改标签名称' : '创建一个新的标签，用于标记诗词的特征、主题或意象' }}
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">
              标签名称 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="请输入标签名称"
              :class="errors.name ? 'border-destructive' : ''" />
            <p v-if="errors.name" class="text-sm text-destructive">
              {{ errors.name }}
            </p>
            <p class="text-xs text-muted-foreground">
              建议：主题（思乡）、意象（月亮）、情感（豪放）、节日（中秋）
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" @click="modalVisible = false">
              取消
            </Button>
            <Button type="submit" :loading="submitting">
              {{ submitting ? '保存中...' : '确定' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- 删除确认弹窗 -->
    <Dialog v-model:open="deleteDialogVisible">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Trash2 class="h-5 w-5 text-destructive" />
            删除标签
          </DialogTitle>
          <DialogDescription>
            <template v-if="deleteTarget">
              <span>确定要删除标签</span>
              <strong class="text-foreground">「{{ deleteTarget.name }}」</strong>
              <span>吗？</span>
            </template>
          </DialogDescription>
        </DialogHeader>

        <div v-if="deleteTarget && (deleteTarget.poem_count ?? 0) > 0" class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50">
          <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
            ℹ️ 该标签关联了 {{ deleteTarget.poem_count }} 首诗歌
          </p>
          <p class="mt-1 text-xs text-blue-700 dark:text-blue-300">
            删除后将从这些诗歌移除该标签，但诗歌本身不受影响
          </p>
        </div>

        <div v-else-if="deleteTarget" class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/50">
          <p class="text-sm text-green-700 dark:text-green-300">
            ✓ 该标签暂无关联诗歌，可以安全删除
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="deleteDialogVisible = false">
            取消
          </Button>
          <Button
            variant="destructive"
            :loading="deleting"
            @click="handleDelete">
            {{ deleting ? '删除中...' : '确定删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
