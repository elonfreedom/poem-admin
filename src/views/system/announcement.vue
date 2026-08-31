<script lang="ts" setup>
import type { Announcement } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import {
  createAnnouncementApi,
  deleteAnnouncementApi,
  getAnnouncementListApi,
  updateAnnouncementApi,
} from '#/api';

const loading = ref(false);
const list = ref<Announcement[]>([]);
const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const submitting = ref(false);

const form = reactive({
  title: '',
  content: '',
  status: 'draft' as 'draft' | 'published',
});

async function fetchList() {
  loading.value = true;
  try {
    list.value = await getAnnouncementListApi();
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  form.title = '';
  form.content = '';
  form.status = 'draft';
  modalVisible.value = true;
}

function handleEdit(item: Announcement) {
  editingId.value = item.id;
  form.title = item.title;
  form.content = item.content;
  form.status = item.status;
  modalVisible.value = true;
}

async function handleSubmit() {
  submitting.value = true;
  try {
    editingId.value
      ? await updateAnnouncementApi(editingId.value, form)
      : await createAnnouncementApi(form);
    modalVisible.value = false;
    await fetchList();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteAnnouncementApi(id);
  fetchList();
}

onMounted(fetchList);

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
};

const statusColors: Record<string, string> = {
  draft: 'default',
  published: 'success',
};

const columns = [
  { dataIndex: 'id', title: 'ID', width: 60 },
  { dataIndex: 'title', title: '标题' },
  { dataIndex: 'status', title: '状态', width: 100 },
  { dataIndex: 'created_at', title: '创建时间', width: 180 },
  { dataIndex: 'actions', title: '操作', width: 150 },
];
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">公告管理</h2>
      <a-button type="primary" @click="handleAdd">新建公告</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="statusColors[record.status]">
            {{ statusLabels[record.status] }}
          </a-tag>
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-button size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定删除该公告吗？"
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
      :title="editingId ? '编辑公告' : '新建公告'"
      :confirm-loading="submitting"
      @ok="handleSubmit"
    >
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" placeholder="请输入公告标题" />
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea
            v-model:value="form.content"
            placeholder="请输入公告内容"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status">
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="published">发布</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
