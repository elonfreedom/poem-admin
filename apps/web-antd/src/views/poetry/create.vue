<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CreatePoetryParams } from '#/api';

import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';

import { Select, message } from 'ant-design-vue';

import {
  createPoetryApi,
  getAuthorOptionsApi,
  useVbenForm,
} from '#/api';
import InputWithPinyin from '#/components/InputWithPinyin.vue';
import type { AuthorOption } from '#/api/core/author';

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
const authorLoading = ref(false);
const selectedAuthorId = ref<number | undefined>(undefined);
const authorText = ref('');

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
    component: 'Input',
    label: '作者',
    rules: 'required',
    componentProps: {
      style: { display: 'none' },
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
function handleAuthorSelect(value: number | undefined) {
  selectedAuthorId.value = value;
  if (value) {
    const author = authorOptions.value.find((a) => a.id === value);
    if (author) {
      authorText.value = author.name;
      formApi.setValues({ author: author.name, dynasty: author.dynasty });
    }
  }
}

// 作者文本变化
function handleAuthorTextChange(value: string) {
  authorText.value = value;
  formApi.setValues({ author: value });
  // 如果手动修改了文本，清除已选 author_id
  if (value && selectedAuthorId.value) {
    const author = authorOptions.value.find(
      (a) => a.id === selectedAuthorId.value,
    );
    if (author && author.name !== value) {
      selectedAuthorId.value = undefined;
    }
  }
}

async function handleSingleSubmit() {
  try {
    await formApi.validate();
    if (!authorText.value?.trim()) {
      message.warning('请输入作者');
      return;
    }
    const values = (await formApi.getValues()) as CreatePoetryParams;
    submitting.value = true;
    await createPoetryApi({
      ...values,
      author: authorText.value,
      author_id: selectedAuthorId.value,
      title_pinyin: titlePinyinRef.value?.getPinyinString() || '',
      content_pinyin: contentPinyinRef.value?.getPinyinString() || '',
      title_sc: titlePinyinRef.value?.getSimplifiedString() || titleSc.value,
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
      <template #author>
        <div>
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
            style="width: 100%"
            @search="handleAuthorSearch"
            @select="handleAuthorSelect"
            @clear="selectedAuthorId = undefined"
          />
          <input
            :value="authorText"
            type="text"
            placeholder="手动输入作者姓名"
            class="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            @input="
              handleAuthorTextChange(($event.target as HTMLInputElement).value)
            "
          />
        </div>
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
