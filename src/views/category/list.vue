<script lang="ts" setup >
import type { Category } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { ChevronDown, ChevronRight, Eye, Folder, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next';

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
import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
} from '#/api';
import { toast } from 'vue-sonner';

// ==================== 类型定义 ====================

interface CategoryNode extends Category {
  children?: CategoryNode[];
  level?: number;
  parent?: CategoryNode | null;
}

// ==================== 状态 ====================

const categoryList = ref<CategoryNode[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedIds = ref<Set<number>>(new Set());
const expandedIds = ref<Set<number>>(new Set());

// 弹窗状态
const modalVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitting = ref(false);
const deleting = ref(false);

const editingId = ref<null | number>(null);
const deleteTarget = ref<CategoryNode | null>(null);

const formData = ref({
  name: '',
  parent_id: null as number | null,
  sort: 0,
});

const errors = ref<Record<string, string>>({});

// ==================== 计算属性 ====================

/** 扁平化展示的分类列表（根据展开状态） */
const flattenedList = computed(() => {
  const result: CategoryNode[] = [];

  function flatten(nodes: CategoryNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length && expandedIds.value.has(node.id)) {
        flatten(node.children);
      }
    }
  }

  flatten(filteredList.value);
  return result;
});

/** 搜索过滤 */
const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return categoryList.value;
  const query = searchQuery.value.toLowerCase();

  function filterNodes(nodes: CategoryNode[]): CategoryNode[] {
    return nodes
      .map((node) => {
        const matches = node.name.toLowerCase().includes(query);
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as CategoryNode[];
  }

  return filterNodes(categoryList.value);
});

const allSelected = computed(() => {
  const visibleIds = flattenedList.value.filter((n) => (n.poem_count ?? 0) === 0 || true).map((n) => n.id);
  return visibleIds.length > 0 && visibleIds.every((id) => selectedIds.value.has(id));
});

const selectedCount = computed(() => selectedIds.value.size);

// ==================== 方法 ====================

/** 构建树形结构 */
function buildTree(categories: Category[]): CategoryNode[] {
  const nodeMap = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  // 先创建所有节点
  for (const cat of categories) {
    nodeMap.set(cat.id, { ...cat, children: [], level: 0, parent: null });
  }

  // 建立父子关系
  for (const cat of categories) {
    const node = nodeMap.get(cat.id)!;
    if (cat.parent_id && nodeMap.has(cat.parent_id)) {
      const parent = nodeMap.get(cat.parent_id)!;
      parent.children = parent.children || [];
      parent.children.push(node);
      node.parent = parent;
      node.level = (parent.level || 0) + 1;
    } else {
      roots.push(node);
    }
  }

  // 按 sort 降序、id 升序排序
  function sortNodes(nodes: CategoryNode[]) {
    nodes.sort((a, b) => b.sort - a.sort || a.id - b.id);
    for (const node of nodes) {
      if (node.children) sortNodes(node.children);
    }
  }
  sortNodes(roots);

  return roots;
}

async function fetchList() {
  try {
    loading.value = true;
    const data = await getCategoryListApi();
    categoryList.value = buildTree(data);
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
}

function toggleExpand(id: number) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
}

function toggleAllExpand() {
  const allExpanded = flattenedList.value.every((n) => !n.children?.length || expandedIds.value.has(n.id));
  if (allExpanded) {
    expandedIds.value.clear();
  } else {
    function addAll(nodes: CategoryNode[]) {
      for (const node of nodes) {
        if (node.children?.length) {
          expandedIds.value.add(node.id);
          addAll(node.children);
        }
      }
    }
    addAll(categoryList.value);
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
    flattenedList.value.forEach((n) => selectedIds.value.add(n.id));
  }
}

function handleAdd() {
  editingId.value = null;
  formData.value = { name: '', parent_id: null, sort: 0 };
  errors.value = {};
  modalVisible.value = true;
}

function handleEdit(category: CategoryNode) {
  editingId.value = category.id;
  formData.value = {
    name: category.name,
    parent_id: category.parent_id ?? null,
    sort: category.sort,
  };
  errors.value = {};
  modalVisible.value = true;
}

async function handleSubmit() {
  errors.value = {};
  if (!formData.value.name.trim()) {
    errors.value.name = '请输入分类名称';
    return;
  }

  try {
    submitting.value = true;
    if (editingId.value) {
      await updateCategoryApi(editingId.value, formData.value);
      toast.success('分类更新成功');
    } else {
      await createCategoryApi(formData.value);
      toast.success('分类创建成功');
    }
    modalVisible.value = false;
    await fetchList();
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(category: CategoryNode) {
  deleteTarget.value = category;
  deleteDialogVisible.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;

  try {
    deleting.value = true;
    await deleteCategoryApi(deleteTarget.value.id);
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

function handleView(category: CategoryNode) {
  // 跳转到诗歌列表页并筛选该分类
  window.location.hash = `#/poetry/list?category_id=${category.id}`;
}

/** 获取所有分类的扁平列表（用于父级选择） */
function getAllCategories(): CategoryNode[] {
  const result: CategoryNode[] = [];
  function traverse(nodes: CategoryNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children) traverse(node.children);
    }
  }
  traverse(categoryList.value);
  return result;
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="space-y-4">
    <!-- 页面标题 -->
    <PageHeader title="分类管理" description="管理诗词的门类和层级体系，一首诗只能属于一个分类">
      <template #extra>
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新建分类
        </Button>
      </template>
    </PageHeader>

    <!-- 搜索栏 -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索分类名称..."
          class="pl-9" />
      </div>
      <Button variant="outline" size="sm" @click="toggleAllExpand">
        <template v-if="expandedIds.size > 0">
          <ChevronDown class="mr-1 h-3 w-3" />
          全部折叠
        </template>
        <template v-else>
          <ChevronRight class="mr-1 h-3 w-3" />
          全部展开
        </template>
      </Button>
    </div>

    <!-- 分类表格 -->
    <Card>
      <CardContent class="p-0">
        <!-- 空状态 -->
        <div v-if="!loading && categoryList.length === 0" class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
            <Folder class="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">暂无分类</h3>
          <p class="mb-4 text-sm text-muted-foreground">
            分类是诗词的门类体系，一首诗只能属于一个分类
          </p>
          <Button @click="handleAdd">
            <Plus class="mr-2 h-4 w-4" />
            创建第一个分类
          </Button>
        </div>

        <!-- 搜索无结果 -->
        <div v-else-if="!loading && flattenedList.length === 0" class="flex flex-col items-center justify-center py-16">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search class="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 class="mb-1 text-lg font-medium text-foreground">
            未找到匹配「{{ searchQuery }}」的分类
          </h3>
          <div class="mt-4 flex gap-2">
            <Button variant="outline" @click="searchQuery = ''">清除搜索</Button>
            <Button @click="handleAdd">
              <Plus class="mr-2 h-4 w-4" />
              新建此分类
            </Button>
          </div>
        </div>

        <!-- 数据表格 -->
        <Table v-else>
          <TableHeader>
            <TableRow class="bg-muted/50">
              <TableHead class="w-[40px]">
                <Checkbox :checked="allSelected" @update:checked="toggleSelectAll" />
              </TableHead>
              <TableHead>分类名称</TableHead>
              <TableHead class="w-[80px] text-center">排序</TableHead>
              <TableHead class="w-[100px] text-center">诗歌数</TableHead>
              <TableHead class="w-[180px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- 加载状态 -->
            <TableRow v-if="loading" v-for="i in 5" :key="i">
              <TableCell><Checkbox disabled /></TableCell>
              <TableCell>
                <div class="h-4 w-32 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell><div class="mx-auto h-4 w-8 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell><div class="mx-auto h-4 w-12 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell><div class="ml-auto h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
            </TableRow>

            <!-- 数据行 -->
            <TableRow
              v-for="row in flattenedList"
              v-else
              :key="row.id"
              class="transition-colors hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  :checked="selectedIds.has(row.id)"
                  @update:checked="toggleSelect(row.id)" />
              </TableCell>
              <TableCell>
                <div class="flex items-center" :style="{ paddingLeft: `${(row.level || 0) * 20}px` }">
                  <!-- 展开/折叠按钮 -->
                  <button
                    v-if="row.children?.length"
                    class="mr-1 flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted"
                    @click="toggleExpand(row.id)">
                    <ChevronDown
                      v-if="expandedIds.has(row.id)"
                      class="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                    <ChevronRight
                      v-else
                      class="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                  </button>
                  <span v-else class="mr-1 w-5" />

                  <!-- 图标 -->
                  <FolderOpen
                    v-if="row.children?.length && expandedIds.has(row.id)"
                    class="mr-2 h-4 w-4 text-amber-700 dark:text-amber-500" />
                  <Folder
                    v-else-if="row.children?.length"
                    class="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <Folder
                    v-else
                    class="mr-2 h-4 w-4 text-muted-foreground" />

                  <!-- 名称 -->
                  <span :class="row.level === 0 ? 'font-semibold text-foreground' : 'text-foreground'">
                    {{ row.name }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="text-center text-sm text-muted-foreground">
                {{ row.sort }}
              </TableCell>
              <TableCell class="text-center">
                <Badge
                  v-if="(row.poem_count ?? 0) > 0"
                  variant="secondary"
                  class="bg-amber-50 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {{ row.poem_count }} 首
                </Badge>
                <span v-else class="text-sm text-muted-foreground">0</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0" title="查看诗歌" @click="handleView(row)">
                    <Eye class="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0" title="编辑" @click="handleEdit(row)">
                    <Pencil class="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    title="删除"
                    @click="confirmDelete(row)">
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- 底部统计 -->
        <div v-if="!loading && categoryList.length > 0" class="flex items-center justify-between border-t border-border px-4 py-3">
          <span class="text-sm text-muted-foreground">
            共 {{ getAllCategories().length }} 个分类
          </span>
          <div v-if="selectedCount > 0" class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">已选 {{ selectedCount }} 项</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm">批量操作</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem class="text-destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  批量删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 新建/编辑弹窗 -->
    <Dialog v-model:open="modalVisible">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ editingId ? '编辑分类' : '新建分类' }}</DialogTitle>
          <DialogDescription>
            {{ editingId ? '修改分类的名称、父级或排序' : '创建一个新的诗词分类，可指定父级分类形成层级结构' }}
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">
              分类名称 <span class="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="请输入分类名称"
              :class="errors.name ? 'border-destructive' : ''" />
            <p v-if="errors.name" class="text-sm text-destructive">
              {{ errors.name }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="parent">父级分类</Label>
            <Input
              id="parent"
              :value="formData.parent_id ? getAllCategories().find(c => c.id === formData.parent_id)?.name || '' : '（顶级分类）'"
              disabled
              placeholder="顶级分类" />
            <p class="text-xs text-muted-foreground">
              暂不支持在弹窗中选择父级，请在列表中使用「移动」功能
            </p>
          </div>
          <div class="space-y-2">
            <Label for="sort">排序值</Label>
            <Input
              id="sort"
              v-model.number="formData.sort"
              type="number"
              :min="0"
              placeholder="0" />
            <p class="text-xs text-muted-foreground">
              数值越大，排序越靠前
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
            删除分类
          </DialogTitle>
          <DialogDescription>
            <template v-if="deleteTarget">
              <span>确定要删除分类</span>
              <strong class="text-foreground">「{{ deleteTarget.name }}」</strong>
              <span>吗？</span>
            </template>
          </DialogDescription>
        </DialogHeader>

        <div v-if="deleteTarget" class="space-y-3">
          <!-- 有关联诗歌 -->
          <div v-if="(deleteTarget.poem_count ?? 0) > 0" class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
              ⚠️ 该分类下还有 {{ deleteTarget.poem_count }} 首诗歌
            </p>
            <p class="mt-1 text-xs text-amber-700 dark:text-amber-300">
              请先转移这些诗歌到其他分类，然后再删除此分类
            </p>
          </div>

          <!-- 有子分类 -->
          <div v-if="(deleteTarget.children?.length ?? 0) > 0" class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50">
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
              ⚠️ 该分类下还有 {{ deleteTarget.children?.length }} 个子分类
            </p>
            <p class="mt-1 text-xs text-amber-700 dark:text-amber-300">
              请先删除或转移子分类，然后再删除此分类
            </p>
          </div>

          <!-- 安全删除 -->
          <div v-if="(deleteTarget.poem_count ?? 0) === 0 && (deleteTarget.children?.length ?? 0) === 0" class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/50">
            <p class="text-sm text-green-700 dark:text-green-300">
              ✓ 该分类为空，可以安全删除
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="deleteDialogVisible = false">
            取消
          </Button>
          <Button
            variant="destructive"
            :loading="deleting"
            :disabled="(deleteTarget?.poem_count ?? 0) > 0 || (deleteTarget?.children?.length ?? 0) > 0"
            @click="handleDelete">
            {{ deleting ? '删除中...' : '确定删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
