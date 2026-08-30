<script lang="ts" setup>
import type { Category } from '#/api';

import { ref } from 'vue';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
} from '#/api';

const categoryList = ref<Category[]>([]);
const editingId = ref<null | number>(null);
const modalVisible = ref(false);
const submitting = ref(false);
const formRef = ref();

// 表单数据
const formData = ref({
  name: '',
  sort: 0,
});

// 表格列
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80, key: 'id' },
  { title: '分类名称', dataIndex: 'name', key: 'name' },
  { title: '排序', dataIndex: 'sort', width: 100, key: 'sort' },
  { title: '诗歌数', dataIndex: 'poem_count', width: 100, key: 'poem_count' },
  {
    title: '操作',
    key: 'operation',
    width: 150,
    fixed: 'right' as const,
  },
];

async function fetchList() {
  try {
    categoryList.value = await getCategoryListApi();
  } catch {
    // error handled by interceptor
  }
}

function handleAdd() {
  editingId.value = null;
  formData.value = { name: '', sort: 0 };
  modalVisible.value = true;
}

function handleEdit(category: Category) {
  editingId.value = category.id;
  formData.value = { name: category.name, sort: category.sort };
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value.validate();
    submitting.value = true;
    if (editingId.value) {
      await updateCategoryApi(editingId.value, formData.value);
      message.success('分类更新成功');
    } else {
      await createCategoryApi(formData.value);
      message.success('分类创建成功');
    }
    modalVisible.value = false;
    await fetchList();
  } catch {
    // validation errors handled by form
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  try {
    await deleteCategoryApi(id);
    message.success('删除成功');
    await fetchList();
  } catch {
    // error handled by interceptor
  }
}

// 初始加载
fetchList();
</script>

<template>
  <div>
    <PageHeader title="分类管理">
      <template #extra>
        <Button type="primary" @click="handleAdd">
          <PlusOutlined />
          新建分类
        </Button>
      </template>
    </PageHeader>

    <Card :bordered="false">
      <Table
        :columns="columns"
        :data-source="categoryList"
        :row-key="(record: Category) => record.id"
        :pagination="false"
        bordered
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'poem_count'">
            {{ record.poem_count ?? 0 }}
          </template>
          <template v-else-if="column.key === 'operation'">
            <Space>
              <Button size="small" @click="handleEdit(record as Category)">
                <EditOutlined />
                编辑
              </Button>
              <Popconfirm
                title="确定删除该分类吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <Button size="small" danger>
                  <DeleteOutlined />
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新建/编辑弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑分类' : '新建分类'"
      :confirm-loading="submitting"
      destroy-on-close
      @ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <Form
        ref="formRef"
        :model="formData"
        layout="vertical"
        @finish="handleSubmit"
      >
        <FormItem label="分类名称" name="name" required>
          <Input v-model:value="formData.name" placeholder="请输入分类名称" />
        </FormItem>
        <FormItem label="排序值" name="sort">
          <InputNumber
            v-model:value="formData.sort"
            :min="0"
            style="width: 100%"
            placeholder="请输入排序值"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
