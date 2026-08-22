<script lang="ts" setup>
import type { Category } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
} from '#/api';

const loading = ref(false);
const categoryList = ref<Category[]>([]);
const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const submitting = ref(false);

const form = reactive({
  name: '',
  sort: 0,
});

async function fetchList() {
  loading.value = true;
  try {
    categoryList.value = await getCategoryListApi();
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  form.name = '';
  form.sort = 0;
  modalVisible.value = true;
}

function handleEdit(category: Category) {
  editingId.value = category.id;
  form.name = category.name;
  form.sort = category.sort;
  modalVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  try {
    editingId.value
      ? await updateCategoryApi(editingId.value, form)
      : await createCategoryApi(form);
    modalVisible.value = false;
    await fetchList();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteCategoryApi(id);
  fetchList();
}

onMounted(fetchList);

const columns = [
  { dataIndex: 'id', title: 'ID', width: 60 },
  { dataIndex: 'name', title: '分类名称' },
  { dataIndex: 'sort', title: '排序', width: 80 },
  { dataIndex: 'poem_count', title: '诗歌数', width: 80 },
  { dataIndex: 'actions', title: '操作', width: 150 },
];
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">分类管理</h2>
      <a-button type="primary" @click="handleAdd">新建分类</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="categoryList"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-button size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定删除该分类吗？"
              @confirm="handleDelete(record.id)"
            >
              <a-button size="small" danger type="link">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑分类' : '新建分类'"
      :confirm-loading="submitting"
      @ok="handleSubmit"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="分类名称" required>
          <a-input v-model:value="form.name" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="排序值">
          <a-input-number
            v-model:value="form.sort"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
