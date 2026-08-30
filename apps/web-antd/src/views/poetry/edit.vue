<script lang="ts" setup>
import type { CreatePoetryParams, Poetry } from '#/api';

import { onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { DeleteOutlined, SaveOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import InputWithPinyin from '#/components/InputWithPinyin.vue';
import {
  deletePoetryApi,
  getAuthorOptionsApi,
  getPoetryDetailApi,
  updatePoetryApi,
} from '#/api';
import type { AuthorOption } from '#/api/core/author';

const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const loading = ref(false);
const detail = ref<null | Poetry>(null);
const id = Number(route.params.id);

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

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const statusColors: Record<string, string> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
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

// 状态选项
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '发布', value: 'published' },
  { label: '归档', value: 'archived' },
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
  try {
    await formRef.value.validate();
    if (!authorText.value?.trim()) {
      message.warning('请输入作者');
      return;
    }
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
    message.success('保存成功');
    router.push('/poetry/list');
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}

function handleDelete() {
  Modal.confirm({
    content: '确定删除该诗歌吗？删除后不可恢复。',
    okType: 'danger',
    title: '删除确认',
    onOk() {
      const hideLoading = message.loading({
        content: '正在删除...',
        duration: 0,
        key: 'delete_msg',
      });
      deletePoetryApi(id)
        .then(() => {
          message.success({
            content: '删除成功',
            key: 'delete_msg',
          });
          router.push('/poetry/list');
        })
        .catch(() => {
          hideLoading();
        });
    },
  });
}

onMounted(fetchDetail);
</script>

<template>
  <div>
    <PageHeader title="编辑诗歌">
      <template #extra>
        <Space>
          <Button @click="router.push('/poetry/list')">返回列表</Button>
          <Button danger type="primary" @click="handleDelete">
            <DeleteOutlined />
            删除
          </Button>
        </Space>
      </template>
    </PageHeader>

    <div v-if="loading" class="py-10 text-center text-gray-500">
      加载中...
    </div>
    <div v-else class="space-y-4">
      <!-- 元信息卡片 -->
      <Card v-if="detail" size="small">
        <h3 class="mb-3 text-sm font-medium text-gray-500">基本信息</h3>
        <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div class="flex items-center gap-2">
            <span class="text-gray-500">ID</span>
            <span class="font-medium">{{ detail.id }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">状态</span>
            <Tag :color="statusColors[detail.status]">
              {{ statusLabels[detail.status] }}
            </Tag>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">分类</span>
            <span class="font-medium">
              {{ detail.category_name || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">作者</span>
            <span class="font-medium">
              {{ detail.author || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">来源</span>
            <span class="font-medium">
              {{ detail.source || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">创建时间</span>
            <span>{{ detail.created_at || '-' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">更新时间</span>
            <span>{{ detail.updated_at || '-' }}</span>
          </div>
        </div>
      </Card>

      <!-- 表单卡片 -->
      <Card size="small">
        <h3 class="mb-4 text-sm font-medium text-gray-500">编辑内容</h3>
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

          <!-- 标签 -->
          <FormItem label="标签" name="tags">
            <Input
              v-model:value="formData.tags"
              placeholder="输入标签后按回车添加"
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
  </div>
</template>
