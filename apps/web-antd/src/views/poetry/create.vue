<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CreatePoetryParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { createPoetryApi, useVbenForm } from '#/api';

const router = useRouter();

// ========== 单个录入 ==========
const submitting = ref(false);

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
    fieldName: 'source',
    component: 'Input',
    label: '来源',
    componentProps: {
      placeholder: '如《唐诗三百首》《宋词三百首》',
    },
  },
  {
    fieldName: 'status',
    component: 'Select',
    label: '状态',
    defaultValue: 'draft',
    componentProps: {
      options: [
        { label: '草稿', value: 'draft' },
        { label: '发布', value: 'published' },
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
    handleSingleSubmit();
  },
});

async function handleSingleSubmit() {
  try {
    const values = (await formApi.getValues()) as CreatePoetryParams;
    submitting.value = true;
    await createPoetryApi(values);
    router.push('/poetry/list');
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Page title="诗歌录入">
    <template #extra>
      <div class="flex gap-2">
        <VbenButton @click="router.push('/poetry/batch')">批量导入</VbenButton>
        <VbenButton @click="router.push('/poetry/list')">返回列表</VbenButton>
      </div>
    </template>

    <Form />
  </Page>
</template>
