<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import {
  batchConvertSimplifiedApi,
  batchMatchAuthorsApi,
  generateAuthorsApi,
} from '#/api';

const router = useRouter();

function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

// 从诗歌提取作者
async function onGenerateAuthors() {
  try {
    await confirm(
      '从所有诗歌中提取不重复的作者名，自动创建到作者库（跳过已存在的）。',
      '提取作者',
    );
    const hideLoading = message.loading({
      content: '正在提取...',
      duration: 0,
      key: 'tool_msg',
    });
    const result = await generateAuthorsApi();
    hideLoading();
    message.success({
      content: `提取完成：共 ${result.total_unique} 个不重复作者，新增 ${result.created} 个，跳过 ${result.skipped} 个`,
      key: 'tool_msg',
    });
  } catch {
    // cancelled
  }
}

// 批量关联诗歌与作者
async function onBatchMatch() {
  try {
    await confirm(
      '尝试将诗歌的作者名与作者库匹配，自动建立关联。',
      '批量关联',
    );
    const hideLoading = message.loading({
      content: '正在匹配...',
      duration: 0,
      key: 'tool_msg',
    });
    const result = await batchMatchAuthorsApi();
    hideLoading();
    message.success({
      content: `匹配完成：共处理 ${result.total} 首，匹配成功 ${result.matched} 首`,
      key: 'tool_msg',
    });
  } catch {
    // cancelled
  }
}

// 批量生成简体
async function onBatchConvert() {
  try {
    await confirm(
      '为所有存量诗歌生成简体文本。此操作将遍历所有诗歌并自动生成简体版本。',
      '批量生成简体',
    );
    const hideLoading = message.loading({
      content: '正在处理中...',
      duration: 0,
      key: 'tool_msg',
    });
    const result = await batchConvertSimplifiedApi();
    hideLoading();
    message.success({
      content: `处理完成：共 ${result.total} 首，转换 ${result.converted} 首`,
      key: 'tool_msg',
    });
  } catch {
    // cancelled
  }
}
</script>

<template>
  <Page title="工具">
    <template #extra>
      <VbenButton @click="router.push('/poetry/list')">
        返回诗歌列表
      </VbenButton>
    </template>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <!-- 提取作者 -->
      <div class="card-box p-5">
        <div class="mb-1 flex items-center gap-2">
          <span class="text-lg">📚</span>
          <h3 class="text-base font-medium">从诗歌提取作者</h3>
        </div>
        <p class="mb-4 text-sm text-muted-foreground">
          扫描所有诗歌，提取不重复的作者名自动创建到作者库，跳过已存在的作者。
        </p>
        <VbenButton type="primary" @click="onGenerateAuthors">
          开始提取
        </VbenButton>
      </div>

      <!-- 批量关联 -->
      <div class="card-box p-5">
        <div class="mb-1 flex items-center gap-2">
          <span class="text-lg">🔗</span>
          <h3 class="text-base font-medium">批量关联作者</h3>
        </div>
        <p class="mb-4 text-sm text-muted-foreground">
          尝试将诗歌的作者名与作者库匹配，自动建立关联（设置 author_id）。
        </p>
        <VbenButton type="primary" @click="onBatchMatch">
          开始匹配
        </VbenButton>
      </div>

      <!-- 批量生成简体 -->
      <div class="card-box p-5">
        <div class="mb-1 flex items-center gap-2">
          <span class="text-lg">简</span>
          <h3 class="text-base font-medium">批量生成简体</h3>
        </div>
        <p class="mb-4 text-sm text-muted-foreground">
          为所有存量诗歌自动生成简体文本（title_sc、author_sc、content_sc）。
        </p>
        <VbenButton type="primary" @click="onBatchConvert">
          开始生成
        </VbenButton>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="card-box mt-6 p-5">
      <h3 class="mb-3 text-sm font-medium text-muted-foreground">推荐操作流程</h3>
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
    </div>
  </Page>
</template>
