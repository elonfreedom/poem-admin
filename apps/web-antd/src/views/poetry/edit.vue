<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CreatePoetryParams, Poetry } from '#/api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { message, Modal, Tag } from 'ant-design-vue';

import {
  deletePoetryApi,
  getPoetryDetailApi,
  updatePoetryApi,
  useVbenForm,
} from '#/api';

const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const loading = ref(false);
const detail = ref<Poetry | null>(null);
const id = Number(route.params.id);

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

const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'title',
    component: 'Input',
    label: '标题',
    rules: 'required',
  },
  {
    fieldName: 'author',
    component: 'Input',
    label: '作者',
    rules: 'required',
  },
  {
    fieldName: 'dynasty',
    component: 'Input',
    label: '朝代',
  },
  {
    fieldName: 'category_id',
    component: 'InputNumber',
    label: '分类ID',
    componentProps: {
      style: { width: '100%' },
      min: 1,
    },
  },
  {
    fieldName: 'content',
    component: 'Textarea',
    label: '内容',
    rules: 'required',
    componentProps: {
      rows: 6,
    },
  },
  {
    fieldName: 'translation',
    component: 'Textarea',
    label: '翻译',
    componentProps: {
      rows: 4,
    },
  },
  {
    fieldName: 'appreciation',
    component: 'Textarea',
    label: '赏析',
    componentProps: {
      rows: 4,
    },
  },
  {
    fieldName: 'cover_url',
    component: 'Input',
    label: '封面图URL',
  },
  {
    fieldName: 'tags',
    component: 'Input',
    label: '标签',
    componentProps: {
      placeholder: '输入标签后按回车添加',
    },
  },
  {
    fieldName: 'status',
    component: 'Select',
    label: '状态',
    componentProps: {
      options: [
        { label: '草稿', value: 'draft' },
        { label: '发布', value: 'published' },
        { label: '归档', value: 'archived' },
      ],
    },
  },
];

const [Form, formApi] = useVbenForm({
  schema: formSchema,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  commonConfig: {
    formItemClass: 'mb-4',
  },
  handleSubmit() {
    handleSubmit();
  },
});

async function fetchDetail() {
  loading.value = true;
  try {
    const data = await getPoetryDetailApi(id);
    detail.value = data;
    formApi.setValues({
      ...data,
      tags: data.tags?.join(', ') || '',
    });
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    const values = (await formApi.getValues()) as CreatePoetryParams;
    submitting.value = true;
    // 将标签字符串转为数组
    const submitData = {
      ...values,
      tags: values.tags
        ? String(values.tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    await updatePoetryApi(id, submitData);
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
  <Page title="编辑诗歌">
    <template #extra>
      <div class="flex items-center gap-2">
        <VbenButton @click="router.push('/poetry/list')">返回列表</VbenButton>
        <VbenButton danger type="primary" @click="handleDelete">
          删除
        </VbenButton>
      </div>
    </template>

    <div v-if="loading" class="py-10 text-center text-muted-foreground">
      加载中...
    </div>
    <div v-else class="space-y-4">
      <!-- 元信息卡片 -->
      <div v-if="detail" class="card-box p-4">
        <h3 class="mb-3 text-sm font-medium text-muted-foreground">
          基本信息
        </h3>
        <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">ID</span>
            <span class="font-medium text-foreground">{{ detail.id }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">状态</span>
            <Tag :color="statusColors[detail.status]">
              {{ statusLabels[detail.status] }}
            </Tag>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">分类</span>
            <span class="font-medium text-foreground">
              {{ detail.category_name || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">作者</span>
            <span class="font-medium text-foreground">
              {{ detail.author || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">创建时间</span>
            <span class="text-foreground">{{ detail.created_at || '-' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">更新时间</span>
            <span class="text-foreground">{{ detail.updated_at || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 表单卡片 -->
      <div class="card-box p-4">
        <h3 class="mb-4 text-sm font-medium text-muted-foreground">
          编辑内容
        </h3>
        <Form />
      </div>
    </div>
  </Page>
</template>
