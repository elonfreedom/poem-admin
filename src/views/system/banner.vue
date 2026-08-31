<script lang="ts" setup>
import type { Banner } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import {
  createBannerApi,
  deleteBannerApi,
  getBannerListApi,
  updateBannerApi,
} from '#/api';

const loading = ref(false);
const bannerList = ref<Banner[]>([]);
const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const submitting = ref(false);

const form = reactive({
  title: '',
  image_url: '',
  link_type: 'url' as 'poem' | 'url',
  link_value: '',
  sort: 0,
  status: 'active' as 'active' | 'inactive',
});

async function fetchList() {
  loading.value = true;
  try {
    bannerList.value = await getBannerListApi();
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingId.value = null;
  resetForm();
  modalVisible.value = true;
}

function handleEdit(banner: Banner) {
  editingId.value = banner.id;
  Object.assign(form, banner);
  modalVisible.value = true;
}

function resetForm() {
  form.title = '';
  form.image_url = '';
  form.link_type = 'url';
  form.link_value = '';
  form.sort = 0;
  form.status = 'active';
}

async function handleSubmit() {
  submitting.value = true;
  try {
    editingId.value
      ? await updateBannerApi(editingId.value, form)
      : await createBannerApi(form as Omit<Banner, 'created_at' | 'id'>);
    modalVisible.value = false;
    await fetchList();
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteBannerApi(id);
  fetchList();
}

async function handleStatusChange(id: number, status: 'active' | 'inactive') {
  await updateBannerApi(id, { status });
  fetchList();
}

onMounted(fetchList);

const columns = [
  { dataIndex: 'id', title: 'ID', width: 60 },
  { dataIndex: 'title', title: '标题' },
  {
    dataIndex: 'image_url',
    title: '图片',
    width: 120,
  },
  {
    dataIndex: 'link_type',
    title: '链接类型',
    width: 80,
  },
  { dataIndex: 'sort', title: '排序', width: 60 },
  { dataIndex: 'status', title: '状态', width: 80 },
  { dataIndex: 'actions', title: '操作', width: 180 },
];
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Banner 管理</h2>
      <a-button type="primary" @click="handleAdd">新建 Banner</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="bannerList"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'image_url'">
          <img
            :src="record.image_url"
            alt="banner"
            class="h-10 rounded object-cover"
          />
        </template>
        <template v-if="column.dataIndex === 'link_type'">
          {{ record.link_type === 'poem' ? '诗歌' : '外链' }}
        </template>
        <template v-if="column.dataIndex === 'status'">
          <a-switch
            :checked="record.status === 'active'"
            checked-children="启用"
            un-checked-children="禁用"
            @change="
              handleStatusChange(
                record.id,
                record.status === 'active' ? 'inactive' : 'active',
              )
            "
          />
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-button size="small" @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm
              title="确定删除该 Banner 吗？"
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
      :title="editingId ? '编辑 Banner' : '新建 Banner'"
      :confirm-loading="submitting"
      @ok="handleSubmit"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="图片URL" required>
          <a-input
            v-model:value="form.image_url"
            placeholder="请输入图片地址"
          />
        </a-form-item>
        <a-form-item label="链接类型" required>
          <a-select v-model:value="form.link_type">
            <a-select-option value="url">外链</a-select-option>
            <a-select-option value="poem">诗歌</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="链接值" required>
          <a-input
            v-model:value="form.link_value"
            :placeholder="
              form.link_type === 'poem' ? '请输入诗歌ID' : '请输入URL'
            "
          />
        </a-form-item>
        <a-form-item label="排序值">
          <a-input-number
            v-model:value="form.sort"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status">
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
