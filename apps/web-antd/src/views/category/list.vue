<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { Category } from '#/api';

import { ref } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
  useVbenForm,
} from '#/api';

const categoryList = ref<Category[]>([]);
const editingId = ref<null | number>(null);
const showForm = ref(false);

// 表单 Schema
const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'name',
    component: 'Input',
    label: '分类名称',
    rules: 'required',
    componentProps: {
      placeholder: '请输入分类名称',
    },
  },
  {
    fieldName: 'sort',
    component: 'InputNumber',
    label: '排序值',
    defaultValue: 0,
    componentProps: {
      min: 0,
      style: { width: '100%' },
    },
  },
];

const [CategoryForm, formApi] = useVbenForm({
  schema: formSchema,
  wrapperClass: 'grid-cols-1',
  commonConfig: {
    formItemClass: 'mb-4',
  },
  // 不显示表单默认的提交/重置按钮
  showDefaultActions: false,
});

async function fetchList() {
  categoryList.value = await getCategoryListApi();
}

function handleAdd() {
  editingId.value = null;
  formApi.setValues({ name: '', sort: 0 });
  showForm.value = true;
}

function handleEdit(category: Category) {
  editingId.value = category.id;
  formApi.setValues({ name: category.name, sort: category.sort });
  showForm.value = true;
}

async function handleSubmit() {
  try {
    const values = await formApi.getValues();
    editingId.value
      ? await updateCategoryApi(editingId.value, values)
      : await createCategoryApi(values);
    showForm.value = false;
    await fetchList();
  } catch {
    // validation errors handled by form
  }
}

async function handleDelete(id: number) {
  await deleteCategoryApi(id);
  await fetchList();
}

// 初始加载
fetchList();
</script>

<template>
  <Page auto-content-height>
    <template #extra>
      <VbenButton type="primary" @click="handleAdd">
        <Plus class="size-4" />
        新建分类
      </VbenButton>
    </template>

    <div class="rounded-lg bg-background p-4">
      <table class="w-full">
        <thead>
          <tr class="border-b text-left text-sm text-muted-foreground">
            <th class="pb-3 pr-4 font-medium" style="width: 60px">ID</th>
            <th class="pb-3 pr-4 font-medium">分类名称</th>
            <th class="pb-3 pr-4 font-medium" style="width: 80px">排序</th>
            <th class="pb-3 pr-4 font-medium" style="width: 80px">诗歌数</th>
            <th class="pb-3 font-medium" style="width: 150px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in categoryList"
            :key="item.id"
            class="border-b last:border-b-0"
          >
            <td class="py-3 pr-4 text-sm">{{ item.id }}</td>
            <td class="py-3 pr-4 text-sm">{{ item.name }}</td>
            <td class="py-3 pr-4 text-sm">{{ item.sort }}</td>
            <td class="py-3 pr-4 text-sm">{{ item.poem_count ?? 0 }}</td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <VbenButton size="sm" variant="ghost" @click="handleEdit(item)">
                  编辑
                </VbenButton>
                <VbenButton
                  size="sm"
                  variant="ghost"
                  class="text-destructive"
                  @click="handleDelete(item.id)"
                >
                  删除
                </VbenButton>
              </div>
            </td>
          </tr>
          <tr v-if="categoryList.length === 0">
            <td colspan="5" class="py-8 text-center text-muted-foreground">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新建/编辑表单 -->
    <div
      v-if="showForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h3 class="mb-4 text-lg font-semibold">
          {{ editingId ? '编辑分类' : '新建分类' }}
        </h3>
        <CategoryForm />
        <div class="mt-4 flex justify-end gap-2">
          <VbenButton variant="outline" @click="showForm = false">
            取消
          </VbenButton>
          <VbenButton type="primary" @click="handleSubmit"> 确定 </VbenButton>
        </div>
      </div>
    </div>
  </Page>
</template>
