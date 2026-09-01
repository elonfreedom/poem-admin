<script lang="ts" setup>
import type {
  CreateReadingPlanParams,
  Poetry,
} from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Plus, Search, Trash2, X } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Textarea } from '#/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';

import { Pagination } from '#/components/ui/pagination';
import {
  createReadingPlanApi,
  getReadingPlanDetailApi,
  getPoetryListApi,
  updateReadingPlanApi,
} from '#/api';
import { toast } from 'vue-sonner';

const route = useRoute();
const router = useRouter();

// 是否为编辑模式
const isEdit = computed(() => !!route.params.id);
const planId = computed(() => Number(route.params.id));

// 表单数据
const form = ref<CreateReadingPlanParams>({
  title: '',
  description: '',
  cover_url: '',
  difficulty: 'beginner',
  tags: [],
  status: 'draft',
  poems: [],
});

// 标签输入
const tagInput = ref('');

// 加载状态
const loading = ref(false);
const detailLoading = ref(false);

// 诗词选择器
const poemSelectorOpen = ref(false);
const poemKeyword = ref('');
const poemList = ref<Poetry[]>([]);
const poemTotal = ref(0);
const poemLoading = ref(false);
const poemPage = ref(1);
const poemPageSize = ref(10);

// 已选诗词（本地状态）
const selectedPoems = ref<Array<{ poem_id: number; title: string; author: string; dynasty?: string }>>([]);

// 难度选项
const difficultyOptions = [
  { label: '入门', value: 'beginner' },
  { label: '进阶', value: 'intermediate' },
  { label: '高级', value: 'advanced' },
];

// 加载计划详情
async function loadDetail() {
  if (!planId.value) return;
  detailLoading.value = true;
  try {
    const detail = await getReadingPlanDetailApi(planId.value);
    form.value = {
      title: detail.title,
      description: detail.description || '',
      cover_url: detail.cover_url || '',
      difficulty: detail.difficulty,
      tags: detail.tags || [],
      status: detail.status,
      poems: [],
    };
    // TODO: 如果有诗词列表接口，加载已选诗词
    selectedPoems.value = [];
  } catch {
    // error handled by interceptor
  } finally {
    detailLoading.value = false;
  }
}

// 搜索诗词
async function searchPoems() {
  poemLoading.value = true;
  try {
    const result = await getPoetryListApi({
      page: poemPage.value,
      page_size: poemPageSize.value,
      keyword: poemKeyword.value || undefined,
      status: 'published',
    });
    poemList.value = result.items;
    poemTotal.value = result.total;
  } catch {
    // error handled by interceptor
  } finally {
    poemLoading.value = false;
  }
}

// 打开诗词选择器
function openPoemSelector() {
  poemSelectorOpen.value = true;
  poemKeyword.value = '';
  poemPage.value = 1;
  searchPoems();
}

// 关闭诗词选择器
function closePoemSelector() {
  poemSelectorOpen.value = false;
}

// 选择诗词
function togglePoem(poetry: Poetry) {
  const index = selectedPoems.value.findIndex((p) => p.poem_id === poetry.id);
  if (index > -1) {
    selectedPoems.value.splice(index, 1);
  } else {
    selectedPoems.value.push({
      poem_id: poetry.id,
      title: poetry.title,
      author: poetry.author,
      dynasty: poetry.dynasty,
    });
  }
}

// 是否已选中
function isPoemSelected(poemId: number): boolean {
  return selectedPoems.value.some((p) => p.poem_id === poemId);
}

// 移除已选诗词
function removePoem(poemId: number) {
  const index = selectedPoems.value.findIndex((p) => p.poem_id === poemId);
  if (index > -1) {
    selectedPoems.value.splice(index, 1);
  }
}

// 确认选择
function confirmPoemSelection() {
  form.value.poems = selectedPoems.value.map((p, index) => ({
    poem_id: p.poem_id,
    order: index + 1,
  }));
  closePoemSelector();
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim();
  if (tag && !form.value.tags?.includes(tag)) {
    form.value.tags = [...(form.value.tags || []), tag];
  }
  tagInput.value = '';
}

// 移除标签
function removeTag(tag: string) {
  form.value.tags = form.value.tags?.filter((t) => t !== tag);
}

// 分页变化
function handlePoemPageChange(page: number) {
  poemPage.value = page;
  searchPoems();
}

// 提交
async function handleSubmit() {
  if (!form.value.title.trim()) {
    toast.error('请输入计划名称');
    return;
  }
  loading.value = true;
  try {
    if (isEdit.value && planId.value) {
      await updateReadingPlanApi(planId.value, form.value);
      toast.success('更新计划成功');
    } else {
      await createReadingPlanApi(form.value);
      toast.success('创建计划成功');
    }
    router.push('/reading-plan/list');
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
}

// 取消
function handleCancel() {
  router.push('/reading-plan/list');
}

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <div class="space-y-4">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        {{ isEdit ? '编辑计划' : '创建计划' }}
      </h2>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="handleCancel">取消</Button>
        <Button :disabled="loading" @click="handleSubmit">
          {{ loading ? '保存中...' : isEdit ? '保存修改' : '创建计划' }}
        </Button>
      </div>
    </div>

    <!-- 加载态 -->
    <div v-if="detailLoading" class="flex h-64 items-center justify-center">
      <div class="loading-spinner" />
    </div>

    <template v-else>
      <!-- 基本信息 -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 class="mb-4 text-base font-medium">基本信息</h3>
        <div class="space-y-4">
          <!-- 计划名称 -->
          <div class="grid gap-2">
            <Label for="title">计划名称 <span class="text-destructive">*</span></Label>
            <Input
              id="title"
              v-model="form.title"
              placeholder="请输入计划名称，如：唐诗三百首入门" />
          </div>

          <!-- 计划描述 -->
          <div class="grid gap-2">
            <Label for="description">计划描述</Label>
            <Textarea
              id="description"
              v-model="form.description"
              placeholder="请输入计划描述（选填）"
              :rows="3" />
          </div>

          <!-- 难度 + 封面 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="difficulty">难度等级</Label>
              <Select v-model="form.difficulty">
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="选择难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in difficultyOptions"
                    :key="opt.value"
                    :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label for="cover">封面图URL</Label>
              <Input
                id="cover"
                v-model="form.cover_url"
                placeholder="请输入封面图URL（选填）" />
            </div>
          </div>

          <!-- 标签 -->
          <div class="grid gap-2">
            <Label>标签</Label>
            <div class="flex flex-wrap items-center gap-2">
              <TransitionGroup name="tag" tag="div" class="flex flex-wrap gap-2">
                <span
                  v-for="tag in form.tags"
                  :key="tag"
                  class="tag-item">
                  {{ tag }}
                  <button
                    type="button"
                    class="tag-remove"
                    @click="removeTag(tag)">
                    <X class="h-3 w-3" />
                  </button>
                </span>
              </TransitionGroup>
              <Input
                v-model="tagInput"
                placeholder="输入标签后回车"
                class="w-32"
                @keyup.enter="addTag" />
            </div>
          </div>
        </div>
      </div>

      <!-- 计划诗词 -->
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-base font-medium">计划诗词</h3>
            <p class="mt-1 text-sm text-muted-foreground">
              已添加 {{ selectedPoems.length }} 首诗词
            </p>
          </div>
          <Button variant="outline" size="sm" @click="openPoemSelector">
            <Plus class="mr-2 h-4 w-4" />
            添加诗词
          </Button>
        </div>

        <!-- 已选诗词列表 -->
        <div v-if="selectedPoems.length > 0" class="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="w-[60px] text-center">序号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead class="w-[90px]">作者</TableHead>
                <TableHead class="w-[70px]">朝代</TableHead>
                <TableHead class="w-[80px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(poem, index) in selectedPoems"
                :key="poem.poem_id"
                class="data-row">
                <TableCell class="text-center text-muted-foreground">
                  {{ index + 1 }}
                </TableCell>
                <TableCell class="font-medium">{{ poem.title }}</TableCell>
                <TableCell>{{ poem.author || '-' }}</TableCell>
                <TableCell>{{ poem.dynasty || '-' }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    @click="removePoem(poem.poem_id)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12">
          <p class="text-sm text-muted-foreground">暂未添加诗词</p>
          <Button variant="link" size="sm" class="mt-2" @click="openPoemSelector">
            <Plus class="mr-1 h-4 w-4" />
            从诗词库选择
          </Button>
        </div>
      </div>
    </template>
  </div>

  <!-- 诗词选择器弹窗 -->
  <Dialog v-model:open="poemSelectorOpen">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>选择诗词</DialogTitle>
      </DialogHeader>
      <div class="space-y-4">
        <!-- 搜索 -->
        <div class="flex items-center gap-2">
          <div class="search-wrap">
            <Search class="search-icon" />
            <Input
              v-model="poemKeyword"
              placeholder="搜索标题或作者..."
              class="search-input"
              @keyup.enter="searchPoems" />
          </div>
          <Button variant="outline" @click="searchPoems">搜索</Button>
        </div>

        <!-- 已选提示 -->
        <div v-if="selectedPoems.length > 0" class="text-sm text-muted-foreground">
          已选择 <span class="font-medium text-foreground">{{ selectedPoems.length }}</span> 首诗词
        </div>

        <!-- 诗词列表 -->
        <div class="max-h-[400px] overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="w-[50px]">选择</TableHead>
                <TableHead>标题</TableHead>
                <TableHead class="w-[90px]">作者</TableHead>
                <TableHead class="w-[70px]">朝代</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="poemLoading">
                <TableCell colspan="4" class="h-32 text-center text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
              <template v-else>
                <TableRow
                  v-for="poem in poemList"
                  :key="poem.id"
                  :class="{ 'bg-primary/5': isPoemSelected(poem.id) }"
                  class="cursor-pointer data-row"
                  @click="togglePoem(poem)">
                  <TableCell>
                    <input
                      type="checkbox"
                      :checked="isPoemSelected(poem.id)"
                      class="h-4 w-4 rounded border-border"
                      @click.stop />
                  </TableCell>
                  <TableCell class="font-medium">{{ poem.title }}</TableCell>
                  <TableCell>{{ poem.author || '-' }}</TableCell>
                  <TableCell>{{ poem.dynasty || '-' }}</TableCell>
                </TableRow>
                <TableRow v-if="poemList.length === 0">
                  <TableCell colspan="4" class="h-32 text-center text-muted-foreground">
                    暂无诗词
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>

        <!-- 分页 -->
        <div class="flex justify-end">
          <Pagination
            :current="poemPage"
            :page-size="poemPageSize"
            :total="poemTotal"
            :show-size-changer="false"
            :show-jumper="false"
            @update:current="handlePoemPageChange" />
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="flex items-center justify-between border-t border-border pt-4">
        <div class="text-sm text-muted-foreground">
          已选 {{ selectedPoems.length }} 首
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="closePoemSelector">取消</Button>
          <Button @click="confirmPoemSelection">确认选择</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* ===== 标签 ===== */
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 10px;
  border-radius: 6px;
  background: oklch(0.95 0.01 75);
  font-size: 12px;
  color: oklch(0.4 0.02 60);
}

.dark .tag-item {
  background: oklch(0.2 0.01 60);
  color: oklch(0.75 0.02 70);
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s;
}

.tag-remove:hover {
  opacity: 1;
  background: oklch(0.85 0.01 70 / 0.3);
}

/* 标签动画 */
.tag-enter-active,
.tag-leave-active {
  transition: all 0.2s ease;
}

.tag-enter-from,
.tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* ===== 搜索框 ===== */
.search-wrap {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted-foreground, oklch(0.55 0.005 60));
  pointer-events: none;
}

.search-input {
  padding-left: 34px;
}

/* ===== 数据行 ===== */
.data-row {
  transition: background-color 0.15s ease;
}

.data-row:hover {
  background: oklch(0.97 0.005 80 / 0.4);
}

.dark .data-row:hover {
  background: oklch(0.18 0.008 60 / 0.4);
}

/* ===== 加载态 ===== */
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
