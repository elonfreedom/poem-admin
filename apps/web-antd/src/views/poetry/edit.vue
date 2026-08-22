<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CreatePoetryParams } from '#/api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { getPoetryDetailApi, updatePoetryApi, useVbenForm } from '#/api';

const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const loading = ref(false);
const id = Number(route.params.id);

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
    formApi.setValues(data);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  try {
    const values = (await formApi.getValues()) as CreatePoetryParams;
    submitting.value = true;
    await updatePoetryApi(id, values);
    router.push('/poetry/list');
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}

onMounted(fetchDetail);
</script>

<template>
  <Page title="编辑诗歌">
    <template #extra>
      <VbenButton @click="router.push('/poetry/list')">返回列表</VbenButton>
    </template>

    <div v-if="loading" class="py-10 text-center text-gray-500">加载中...</div>
    <Form v-else />
  </Page>
</template>
