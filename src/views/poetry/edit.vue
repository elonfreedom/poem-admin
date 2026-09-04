<script lang="ts" setup >
import type { CreatePoetryParams, Poetry } from '#/api';

import { onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Save, Trash2 } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
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
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Textarea } from '#/components/ui/textarea';

import PageHeader from '#/components/PageHeader.vue';
import InputWithPinyin from '#/components/InputWithPinyin.vue';
import AuthorSelect from '#/components/AuthorSelect.vue';
import {
  deletePoetryApi,
  getPoetryDetailApi,
  updatePoetryApi,
} from '#/api';
import type { AuthorOption } from '#/api/core/author';
import { formatDateTime } from '#/lib/utils';
import { toast } from 'vue-sonner';

const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const loading = ref(false);
const detail = ref<null | Poetry>(null);
const id = Number(route.params.id);

// 拼音组件的 ref
const titlePinyinRef = useTemplateRef('titlePinyin');
const contentPinyinRef = useTemplateRef('contentPinyin');

// 简体文本（可修正）
const titleSc = ref('');
const contentSc = ref('');

// 作者相关
const selectedAuthorId = ref<number | undefined>(undefined);
const authorText = ref('');

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-green-500 text-white',
  archived: 'bg-yellow-500 text-white',
};

// 表单数据
const formData = ref({
  title: '',
  author: '',
  dynasty: '',
  category_id: undefined as number | undefined,
  content: '',
  translation: '',
  appreciation: '',
  cover_url: '',
  source: '',
  tags: '',
  status: 'draft',
});

// 表单错误
const errors = ref<Record<string, string>>({});

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '发布', value: 'published' },
  { label: '归档', value: 'archived' },
];

// 选择作者
function handleAuthorSelect(author: AuthorOption) {
  selectedAuthorId.value = author.id;
  authorText.value = author.name;
  formData.value.author = author.name;
  formData.value.dynasty = author.dynasty;
}

// 作者 ID 变化（清空时）
function handleAuthorIdChange(value: number | undefined) {
  if (!value) {
    selectedAuthorId.value = undefined;
  }
}

async function fetchDetail() {
  loading.value = true;
  try {
    const data = await getPoetryDetailApi(id);
    detail.value = data;
    // 设置简体文本
    titleSc.value = data.title_sc || '';
    contentSc.value = data.content_sc || '';
    // 设置作者
    authorText.value = data.author || '';
    selectedAuthorId.value = data.author_id;
    formData.value = {
      title: data.title || '',
      author: data.author || '',
      dynasty: data.dynasty || '',
      category_id: data.category_id,
      content: data.content || '',
      translation: data.translation || '',
      appreciation: data.appreciation || '',
      cover_url: data.cover_url || '',
      source: data.source || '',
      tags: data.tags?.join(', ') || '',
      status: data.status || 'draft',
    };
    // 等组件渲染后再设置拼音
    setTimeout(() => {
      if (data.title_pinyin) {
        titlePinyinRef.value?.setPinyinList(
          data.title_pinyin.split(/\s+/).filter(Boolean),
        );
      }
      if (data.content_pinyin) {
        contentPinyinRef.value?.setPinyinList(
          data.content_pinyin.split(/\s+/).filter(Boolean),
        );
      }
    }, 100);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  errors.value = {};
  if (!formData.value.title?.trim()) {
    errors.value.title = '请输入标题';
  }
  if (!authorText.value?.trim()) {
    errors.value.author = '请输入作者';
  }
  if (!formData.value.content?.trim()) {
    errors.value.content = '请输入内容';
  }
  if (Object.keys(errors.value).length > 0) {
    return;
  }

  try {
    submitting.value = true;
    const submitData = {
      ...formData.value,
      author: authorText.value,
      author_id: selectedAuthorId.value,
      title_pinyin: titlePinyinRef.value?.getPinyinString() || '',
      content_pinyin: contentPinyinRef.value?.getPinyinString() || '',
      title_sc: titlePinyinRef.value?.getSimplifiedString() || titleSc.value,
      content_sc:
        contentPinyinRef.value?.getSimplifiedString() || contentSc.value,
      tags: formData.value.tags
        ? String(formData.value.tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    await updatePoetryApi(id, submitData as CreatePoetryParams);
    toast.success('保存成功');
    router.push('/poetry/list');
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  try {
    await deletePoetryApi(id);
    toast.success('删除成功');
    router.push('/poetry/list');
  } catch {
    // error handled by interceptor
  }
}

onMounted(fetchDetail);
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="编辑诗歌">
      <template #extra>
        <div class="flex gap-2">
          <Button variant="outline" @click="router.push('/poetry/list')">
            返回列表
          </Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive">
                <Trash2 class="mr-2 h-4 w-4" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除确认</AlertDialogTitle>
                <AlertDialogDescription>
                  确定删除该诗歌吗？删除后不可恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="handleDelete">
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else class="space-y-4">
      <!-- 元信息卡片 -->
      <Card v-if="detail">
        <CardContent class="pt-6">
          <h3 class="mb-3 text-sm font-medium text-muted-foreground">基本信息</h3>
          <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">ID</span>
              <span class="font-medium">{{ detail.id }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">状态</span>
              <span
                class="inline-block rounded-md px-2 py-0.5 text-xs"
                :class="statusColors[detail.status]"
              >
                {{ statusLabels[detail.status] }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">分类</span>
              <span class="font-medium">
                {{ detail.category_name || '-' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">作者</span>
              <span class="font-medium">
                {{ detail.author || '-' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">来源</span>
              <span class="font-medium">
                {{ detail.source || '-' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">创建时间</span>
              <span>{{ formatDateTime(detail.created_at) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">更新时间</span>
              <span>{{ formatDateTime(detail.updated_at) }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 表单卡片 -->
      <Card>
        <CardContent class="pt-6">
          <h3 class="mb-4 text-sm font-medium text-muted-foreground">编辑内容</h3>
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- 标题（带拼音） -->
            <div class="space-y-2">
              <Label for="title">
                标题 <span class="text-destructive">*</span>
              </Label>
              <InputWithPinyin
                id="title"
                ref="titlePinyin"
                v-model="formData.title"
                :simplified-value="titleSc"
                type="input"
                placeholder="请输入标题"
                show-convert
                @update:simplified-value="titleSc = $event"
              />
              <p v-if="errors.title" class="text-sm text-destructive">
                {{ errors.title }}
              </p>
            </div>

            <!-- 作者（搜索选择） -->
            <div class="space-y-2">
              <Label>
                作者 <span class="text-destructive">*</span>
              </Label>
              <AuthorSelect
                v-model="selectedAuthorId"
                :author-name="authorText"
                @select="handleAuthorSelect"
                @update:model-value="handleAuthorIdChange"
              />
              <p v-if="errors.author" class="text-sm text-destructive">
                {{ errors.author }}
              </p>
            </div>

            <!-- 朝代（随作者绑定，选择作者后自动填充） -->
            <div class="space-y-2">
              <Label for="dynasty">朝代</Label>
              <Input
                id="dynasty"
                v-model="formData.dynasty"
                :disabled="!!selectedAuthorId"
                placeholder="选择作者后自动填充"
              />
            </div>

            <!-- 分类ID -->
            <div class="space-y-2">
              <Label for="category_id">分类ID</Label>
              <Input
                id="category_id"
                v-model.number="formData.category_id"
                type="number"
                :min="1"
                placeholder="请输入分类ID"
              />
            </div>

            <!-- 内容（带拼音） -->
            <div class="space-y-2">
              <Label for="content">
                内容 <span class="text-destructive">*</span>
              </Label>
              <InputWithPinyin
                id="content"
                ref="contentPinyin"
                v-model="formData.content"
                :simplified-value="contentSc"
                type="textarea"
                :rows="4"
                placeholder="请输入内容"
                show-convert
                @update:simplified-value="contentSc = $event"
              />
              <p v-if="errors.content" class="text-sm text-destructive">
                {{ errors.content }}
              </p>
            </div>

            <!-- 翻译 -->
            <div class="space-y-2">
              <Label for="translation">翻译</Label>
              <Textarea
                id="translation"
                v-model="formData.translation"
                :rows="4"
                placeholder="请输入翻译（可选）"
              />
            </div>

            <!-- 赏析 -->
            <div class="space-y-2">
              <Label for="appreciation">赏析</Label>
              <Textarea
                id="appreciation"
                v-model="formData.appreciation"
                :rows="4"
                placeholder="请输入赏析（可选）"
              />
            </div>

            <!-- 封面图URL -->
            <div class="space-y-2">
              <Label for="cover_url">封面图URL</Label>
              <Input
                id="cover_url"
                v-model="formData.cover_url"
                placeholder="请输入封面图URL"
              />
            </div>

            <!-- 来源 -->
            <div class="space-y-2">
              <Label for="source">来源</Label>
              <Input
                id="source"
                v-model="formData.source"
                placeholder="如《唐诗三百首》《宋词三百首》"
              />
            </div>

            <!-- 标签 -->
            <div class="space-y-2">
              <Label for="tags">标签</Label>
              <Input
                id="tags"
                v-model="formData.tags"
                placeholder="输入标签后按回车添加"
              />
            </div>

            <!-- 状态 -->
            <div class="space-y-2">
              <Label for="status">状态</Label>
              <Select v-model="formData.status">
                <SelectTrigger>
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 提交按钮 -->
            <div class="flex gap-2">
              <Button type="submit" :loading="submitting">
                <Save class="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button variant="outline" @click="router.push('/poetry/list')">
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
