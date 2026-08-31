<script lang="ts" setup>
import type { CreatePoetryParams } from '#/api';

import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { ArrowLeft, Save, Upload } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
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
import { createPoetryApi } from '#/api';
import type { AuthorOption } from '#/api/core/author';
import { toast } from 'vue-sonner';

const router = useRouter();

// ========== 单个录入 ==========
const submitting = ref(false);

// 拼音组件的 ref
const titlePinyinRef = useTemplateRef('titlePinyin');
const contentPinyinRef = useTemplateRef('contentPinyin');

// 简体文本（可修正）
const titleSc = ref('');
const contentSc = ref('');

// 作者相关
const authorOptions = ref<AuthorOption[]>([]);
const selectedAuthorId = ref<number | undefined>(undefined);
const authorText = ref('');

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
  status: 'draft',
});

// 表单错误
const errors = ref<Record<string, string>>({});

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '发布', value: 'published' },
];

// 选择作者
function handleAuthorSelect(value: any) {
  selectedAuthorId.value = value as number | undefined;
  if (value) {
    const author = authorOptions.value.find((a) => a.id === value);
    if (author) {
      authorText.value = author.name;
      formData.value.author = author.name;
      formData.value.dynasty = author.dynasty;
    }
  }
}

// 作者文本变化
function handleAuthorTextChange(value: string) {
  authorText.value = value;
  formData.value.author = value;
  if (value && selectedAuthorId.value) {
    const author = authorOptions.value.find(
      (a) => a.id === selectedAuthorId.value,
    );
    if (author && author.name !== value) {
      selectedAuthorId.value = undefined;
    }
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
    await createPoetryApi({
      ...formData.value,
      author: authorText.value,
      author_id: selectedAuthorId.value,
      title_pinyin: titlePinyinRef.value?.getPinyinString() || '',
      content_pinyin: contentPinyinRef.value?.getPinyinString() || '',
      title_sc: titlePinyinRef.value?.getSimplifiedString() || titleSc.value,
      content_sc:
        contentPinyinRef.value?.getSimplifiedString() || contentSc.value,
    } as CreatePoetryParams);
    toast.success('诗歌创建成功');
    router.push('/poetry/list');
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="诗歌录入">
      <template #extra>
        <div class="flex gap-2">
          <Button variant="outline" @click="router.push('/poetry/batch')">
            <Upload class="mr-2 h-4 w-4" />
            批量导入
          </Button>
          <Button variant="outline" @click="router.push('/poetry/list')">
            <ArrowLeft class="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </div>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="pt-6">
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

          <!-- 作者（搜索选择 + 手动输入） -->
          <div class="space-y-2">
            <Label for="author">
              作者 <span class="text-destructive">*</span>
            </Label>
            <Select :model-value="selectedAuthorId" @update:model-value="handleAuthorSelect">
              <SelectTrigger>
                <SelectValue placeholder="搜索或选择作者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="opt in authorOptions"
                  :key="opt.id"
                  :value="opt.id"
                >
                  {{ opt.name }}（{{ opt.dynasty }}）
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              :value="authorText"
              placeholder="手动输入作者姓名"
              @input="
                handleAuthorTextChange(($event.target as HTMLInputElement).value)
              "
            />
            <p v-if="errors.author" class="text-sm text-destructive">
              {{ errors.author }}
            </p>
          </div>

          <!-- 朝代 -->
          <div class="space-y-2">
            <Label for="dynasty">朝代</Label>
            <Input
              id="dynasty"
              v-model="formData.dynasty"
              placeholder="自动填充或手动输入"
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
</template>
