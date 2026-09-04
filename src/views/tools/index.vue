<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ArrowLeft, BookOpen, CopyX, Eraser, Link, Languages, Type, Users } from 'lucide-vue-next';

import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

import PageHeader from '#/components/PageHeader.vue';
import {
  batchConvertSimplifiedApi,
  batchMatchAuthorsApi,
  cleanupAuthorNamesApi,
  cleanupAuthorNamesScApi,
  convertAuthorNamesTraditionalApi,
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
      `提取完成：共 ${result.total_unique} 个不重复作者，新增 ${result.created} 个，跳过 ${result.skipped} 个${result.with_dynasty ? `（${result.with_dynasty} 个附带朝代）` : ''}${result.backfilled ? `，回填 ${result.backfilled} 个已有作者朝代` : ''}`,
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

// 诗文去重跳转
function onDedup() {
  router.push('/tools/dedup');
}

// 清理作者重复繁简名
function onCleanupAuthorNames() {
  if (!confirm('清理 name 与 name_traditional 相同的作者记录，将冗余的繁体名清空。')) {
    return;
  }
  const promise = cleanupAuthorNamesApi();
  toast.promise(promise, {
    loading: '正在清理...',
    success: (result: any) => result.message || `清理完成：已处理 ${result.cleaned} 个作者`,
    error: '清理失败',
  });
}

// 作者姓名转简体
function onCleanupAuthorNamesSc() {
  if (!confirm('将 name 中的繁体字转为简体，原值保留为 name_traditional。')) {
    return;
  }
  const promise = cleanupAuthorNamesScApi();
  toast.promise(promise, {
    loading: '正在处理...',
    success: (result: any) => result.message || `处理完成：已处理 ${result.processed} 个作者`,
    error: '处理失败',
  });
}

// 作者姓名转简体→繁体
function onConvertAuthorNamesTraditional() {
  if (!confirm('将所有作者的 name（简体）转为繁体，写入 name_traditional 字段。已有繁体名的将被覆盖。')) {
    return;
  }
  const promise = convertAuthorNamesTraditionalApi();
  toast.promise(promise, {
    loading: '正在转换...',
    success: (result: any) => result.message || `转换完成：已处理 ${result.processed} 个作者`,
    error: '转换失败',
  });
}

const tools = [
  {
    icon: CopyX,
    title: '诗文去重',
    description:
      '扫描重复诗文（标题/作者/内容匹配），分组对比后批量归档或删除多余项。',
    onClick: onDedup,
    buttonText: '开始去重',
  },
  {
    icon: Users,
    title: '作者查重',
    description:
      '扫描重复作者（按姓名或姓名+朝代），合并后重新关联诗歌。',
    onClick: () => router.push('/tools/author-dedup'),
    buttonText: '开始查重',
  },
  {
    icon: Eraser,
    title: '清理作者繁简名',
    description:
      '清理 name 与 name_traditional 相同的作者记录，清空冗余的繁体名。',
    onClick: onCleanupAuthorNames,
    buttonText: '开始清理',
  },
  {
    icon: Type,
    title: '作者姓名转简体',
    description:
      '将 name 中的繁体字转为简体，原值保留为 name_traditional。',
    onClick: onCleanupAuthorNamesSc,
    buttonText: '开始处理',
  },
  {
    icon: Languages,
    title: '作者姓名转繁体',
    description:
      '将所有作者的 name（简体）转为繁体，写入 name_traditional 字段。',
    onClick: onConvertAuthorNamesTraditional,
    buttonText: '开始转换',
  },
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
      '为所有存量诗歌自动生成简体文本，同时补充作者名的繁体（name_traditional）。',
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
            <strong>诗文去重</strong>：扫描重复诗文，分组对比后批量归档或删除
          </li>
          <li>
            <strong>提取作者</strong>：从现有诗歌中提取不重复的作者名，自动创建到作者库
          </li>
          <li>
            <strong>批量关联</strong>：将诗歌与作者库匹配，建立关联关系
          </li>
          <li>
            <strong>批量生成简体</strong>：为所有诗歌生成简体文本，补充作者名繁体（可选）
          </li>
        </ol>
      </CardContent>
    </Card>
  </div>
</template>
