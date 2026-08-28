<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CreatePoetryParams } from '#/api';

import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { createPoetryApi, useVbenForm } from '#/api';
import InputWithPinyin from '#/components/InputWithPinyin.vue';

const router = useRouter();

// ========== 单个录入 ==========
const submitting = ref(false);

// 拼音组件的 ref
const titlePinyinRef = useTemplateRef('titlePinyin');
const authorPinyinRef = useTemplateRef('authorPinyin');
const contentPinyinRef = useTemplateRef('contentPinyin');

// 简体文本（可修正）
const titleSc = ref('');
const authorSc = ref('');
const contentSc = ref('');

const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'title',
    component: InputWithPinyin,
    label: '标题',
    rules: 'required',
    componentProps: {
      type: 'input',
      placeholder: '请输入标题',
    },
  },
  {
    fieldName: 'author',
    component: InputWithPinyin,
    label: '作者',
    rules: 'required',
    componentProps: {
      type: 'input',
      placeholder: '请输入作者',
    },
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
    component: InputWithPinyin,
    label: '内容',
    rules: 'required',
    componentProps: {
      type: 'textarea',
      rows: 4,
      placeholder: '请输入内容',
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
  wrapperClass: 'grid-cols-1',
  commonConfig: {
    formItemClass: 'mb-4',
    labelClass: 'font-medium',
  },
  handleSubmit() {
    handleSingleSubmit();
  },
});

async function handleSingleSubmit() {
  try {
    const values = (await formApi.getValues()) as CreatePoetryParams;
    submitting.value = true;
    await createPoetryApi({
      ...values,
      title_pinyin: titlePinyinRef.value?.getPinyinString() || '',
      author_pinyin: authorPinyinRef.value?.getPinyinString() || '',
      content_pinyin: contentPinyinRef.value?.getPinyinString() || '',
      title_sc: titlePinyinRef.value?.getSimplifiedString() || titleSc.value,
      author_sc: authorPinyinRef.value?.getSimplifiedString() || authorSc.value,
      content_sc:
        contentPinyinRef.value?.getSimplifiedString() || contentSc.value,
    });
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

    <Form>
      <template #title="{ modelValue, 'onUpdate:modelValue': onUpdate }">
        <InputWithPinyin
          ref="titlePinyin"
          :model-value="modelValue"
          :simplified-value="titleSc"
          type="input"
          placeholder="请输入标题"
          show-convert
          @update:model-value="onUpdate"
          @update:simplified-value="titleSc = $event"
        />
      </template>
      <template #author="{ modelValue, 'onUpdate:modelValue': onUpdate }">
        <InputWithPinyin
          ref="authorPinyin"
          :model-value="modelValue"
          :simplified-value="authorSc"
          type="input"
          placeholder="请输入作者"
          show-convert
          @update:model-value="onUpdate"
          @update:simplified-value="authorSc = $event"
        />
      </template>
      <template #content="{ modelValue, 'onUpdate:modelValue': onUpdate }">
        <InputWithPinyin
          ref="contentPinyin"
          :model-value="modelValue"
          :simplified-value="contentSc"
          type="textarea"
          :rows="4"
          placeholder="请输入内容"
          show-convert
          @update:model-value="onUpdate"
          @update:simplified-value="contentSc = $event"
        />
      </template>
    </Form>
  </Page>
</template>
