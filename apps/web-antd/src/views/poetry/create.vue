<script lang="ts" setup>
import type { CreatePoetryParams } from '#/api';

import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import InputWithPinyin from '#/components/InputWithPinyin.vue';
import { createPoetryApi, getAuthorOptionsApi } from '#/api';
import type { AuthorOption } from '#/api/core/author';

const router = useRouter();

// ========== 单个录入 ==========
const submitting = ref(false);
const formRef = ref();

// 拼音组件的 ref
const titlePinyinRef = useTemplateRef('titlePinyin');
const contentPinyinRef = useTemplateRef('contentPinyin');

// 简体文本（可修正）
const titleSc = ref('');
const contentSc = ref('');

// 作者相关
const authorOptions = ref<AuthorOption[]>([]);
const authorLoading = ref(false);
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

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '发布', value: 'published' },
];

// 搜索作者
async function handleAuthorSearch(keyword: string) {
  if (!keyword) {
    authorOptions.value = [];
    return;
  }
  authorLoading.value = true;
  try {
    const data = await getAuthorOptionsApi(keyword);
    authorOptions.value = data;
  } finally {
    authorLoading.value = false;
  }
}

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
  try {
    await formRef.value.validate();
    if (!authorText.value?.trim()) {
      message.warning('请输入作者');
      return;
    }
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
    message.success('诗歌创建成功');
    router.push('/poetry/list');
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="诗歌录入">
      <template #extra>
        <Space>
          <Button @click="router.push('/poetry/batch')">
            <UploadOutlined />
            批量导入
          </Button>
          <Button @click="router.push('/poetry/list')">
            <ArrowLeftOutlined />
            返回列表
          </Button>
        </Space>
      </template>
    </PageHeader>

    <Card>
      <Form
        ref="formRef"
        :model="formData"
        layout="vertical"
        @finish="handleSubmit"
      >
        <!-- 标题（带拼音） -->
        <FormItem label="标题" name="title" required>
          <InputWithPinyin
            ref="titlePinyin"
            v-model:value="formData.title"
            :simplified-value="titleSc"
            type="input"
            placeholder="请输入标题"
            show-convert
            @update:simplified-value="titleSc = $event"
          />
        </FormItem>

        <!-- 作者（搜索选择 + 手动输入） -->
        <FormItem label="作者" name="author" required>
          <Select
            :value="selectedAuthorId"
            :options="
              authorOptions.map((a) => ({
                label: `${a.name}（${a.dynasty}）`,
                value: a.id,
              }))
            "
            :loading="authorLoading"
            allow-clear
            show-search
            :filter-option="false"
            placeholder="搜索或选择作者"
            @search="handleAuthorSearch"
            @update:value="handleAuthorSelect"
            @clear="selectedAuthorId = undefined"
          />
          <Input
            :value="authorText"
            placeholder="手动输入作者姓名"
            class="mt-2"
            @input="
              handleAuthorTextChange(($event.target as HTMLInputElement).value)
            "
          />
        </FormItem>

        <!-- 朝代 -->
        <FormItem label="朝代" name="dynasty">
          <Input v-model:value="formData.dynasty" placeholder="自动填充或手动输入" />
        </FormItem>

        <!-- 分类ID -->
        <FormItem label="分类ID" name="category_id">
          <InputNumber
            v-model:value="formData.category_id"
            :min="1"
            style="width: 100%"
            placeholder="请输入分类ID"
          />
        </FormItem>

        <!-- 内容（带拼音） -->
        <FormItem label="内容" name="content" required>
          <InputWithPinyin
            ref="contentPinyin"
            v-model:value="formData.content"
            :simplified-value="contentSc"
            type="textarea"
            :rows="4"
            placeholder="请输入内容"
            show-convert
            @update:simplified-value="contentSc = $event"
          />
        </FormItem>

        <!-- 翻译 -->
        <FormItem label="翻译" name="translation">
          <Input.TextArea
            v-model:value="formData.translation"
            :rows="4"
            placeholder="请输入翻译（可选）"
          />
        </FormItem>

        <!-- 赏析 -->
        <FormItem label="赏析" name="appreciation">
          <Input.TextArea
            v-model:value="formData.appreciation"
            :rows="4"
            placeholder="请输入赏析（可选）"
          />
        </FormItem>

        <!-- 封面图URL -->
        <FormItem label="封面图URL" name="cover_url">
          <Input v-model:value="formData.cover_url" placeholder="请输入封面图URL" />
        </FormItem>

        <!-- 来源 -->
        <FormItem label="来源" name="source">
          <Input
            v-model:value="formData.source"
            placeholder="如《唐诗三百首》《宋词三百首》"
          />
        </FormItem>

        <!-- 状态 -->
        <FormItem label="状态" name="status">
          <Select v-model:value="formData.status" :options="statusOptions" />
        </FormItem>

        <!-- 提交按钮 -->
        <FormItem>
          <Space>
            <Button type="primary" :loading="submitting" html-type="submit">
              <SaveOutlined />
              保存
            </Button>
            <Button @click="router.push('/poetry/list')">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
