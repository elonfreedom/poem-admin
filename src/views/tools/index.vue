<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ArrowLeft, BookOpen, Link, Type } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

import PageHeader from '#/components/PageHeader.vue';
import {
  batchConvertSimplifiedApi,
  batchMatchAuthorsApi,
  generateAuthorsApi,
} from '#/api';
import { toast } from 'vue-sonner';

const router = useRouter();

// 从诗歌提取作者
async function onGenerateAuthors() {
  if (!confirm('从所有诗歌中提取不重复的作者名，自动创建到作者库（跳过已存在的）。')) {
    return;
  }
  const promise = generateAuthorsApi();
  toast.promise(promise, {
    loading: '正在提取...',
    success: (result: any) =>
      `提取完成：共 ${result.total_unique} 个不重复作者，新增 ${result.created} 个，跳过 ${result.skipped} 个`,
    error: '提取失败',
  });
}

// 批量关联诗歌与作者
async function onBatchMatch() {
  if (!confirm('尝试将诗歌的作者名与作者库匹配，自动建立关联。')) {
    return;
  }
  const promise = batchMatchAuthorsApi();
  toast.promise(promise, {
    loading: '正在匹配...',
    success: (result: any) =>
      `匹配完成：共处理 ${result.total} 首，匹配成功 ${result.matched} 首`,
    error: '匹配失败',
  });
}

// 批量生成简体
async function onBatchConvert() {
  if (!confirm('为所有存量诗歌生成简体文本。此操作将遍历所有诗歌并自动生成简体版本。')) {
    return;
  }
  const promise = batchConvertSimplifiedApi();
  toast.promise(promise, {
    loading: '正在处理中...',
    success: (result: any) =>
      `处理完成：共 ${result.total} 首，转换 ${result.converted} 首`,
    error: '处理失败',
  });
}

const tools = [
  {
    icon: BookOpen,
    title: '从诗歌提取作者',
    description:
      '扫描所有诗歌，提取不重复的作者名自动创建到作者库，跳过已存在的作者。',
    onClick: onGenerateAuthors,
    buttonText: '开始提取',
  },
  {
    icon: Link,
    title: '批量关联作者',
    description:
      '尝试将诗歌的作者名与作者库匹配，自动建立关联（设置 author_id）。',
    onClick: onBatchMatch,
    buttonText: '开始匹配',
  },
  {
    icon: Type,
    title: '批量生成简体',
    description:
      '为所有存量诗歌自动生成简体文本（title_sc、author_sc、content_sc）。',
    onClick: onBatchConvert,
    buttonText: '开始生成',
  },
];
</script>

<template>
  <div class="space-y-4">
    <PageHeader title="工具">
      <template #extra>
        <Button variant="outline" @click="router.push('/poetry/list')">
          <ArrowLeft class="mr-2 h-4 w-4" />
          返回诗歌列表
        </Button>
      </template>
    </PageHeader>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="tool in tools" :key="tool.title">
        <CardHeader>
          <div class="mb-2 flex items-center gap-2">
            <component :is="tool.icon" class="h-5 w-5 text-primary" />
            <CardTitle class="text-base">{{ tool.title }}</CardTitle>
          </div>
          <CardDescription>{{ tool.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="tool.onClick">
            {{ tool.buttonText }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- 使用说明 -->
    <Card>
      <CardHeader>
        <CardTitle class="text-sm text-muted-foreground">推荐操作流程</CardTitle>
      </CardHeader>
      <CardContent>
        <ol class="list-inside list-decimal space-y-2 text-sm">
          <li>
            <strong>提取作者</strong>：从现有诗歌中提取不重复的作者名，自动创建到作者库
          </li>
          <li>
            <strong>批量关联</strong>：将诗歌与作者库匹配，建立关联关系
          </li>
          <li>
            <strong>批量生成简体</strong>：为所有诗歌生成简体文本（可选）
          </li>
        </ol>
      </CardContent>
    </Card>
  </div>
</template>
