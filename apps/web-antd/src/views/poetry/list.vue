<script lang="ts" setup>
import type { Poetry, PoetryListParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Col,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import TableAction from '#/components/TableAction.vue';
import { useTable } from '#/composables/useTable';
import {
  batchUpdatePoetryStatusApi,
  deletePoetryApi,
  getPoetryListApi,
  updatePoetryStatusApi,
} from '#/api';

const router = useRouter();

/** 状态选项 */
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];

const statusColors: Record<string, string> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

/** 朝代选项 */
const dynastyOptions = [
  { label: '先秦', value: '先秦' },
  { label: '汉', value: '汉' },
  { label: '魏晋', value: '魏晋' },
  { label: '南北朝', value: '南北朝' },
  { label: '隋', value: '隋' },
  { label: '唐', value: '唐' },
  { label: '五代', value: '五代' },
  { label: '宋', value: '宋' },
  { label: '元', value: '元' },
  { label: '明', value: '明' },
  { label: '清', value: '清' },
  { label: '近代', value: '近代' },
  { label: '现代', value: '现代' },
  { label: '未知', value: '未知' },
];

/** 搜索筛选 */
const keyword = ref('');
const dynasty = ref<string | undefined>(undefined);
const status = ref<string | undefined>(undefined);

/** 选中行 */
const selectedRowKeys = ref<number[]>([]);
const selectedStatus = ref<string | null>(null);

/** 表格数据 */
const { data, pagination, loading, refresh, setFilters, onTableChange } =
  useTable<Poetry>({
    fetchData: async ({ page, pageSize }) => {
      const params: PoetryListParams = {
        page,
        page_size: pageSize,
        keyword: keyword.value || undefined,
        dynasty: dynasty.value || undefined,
        status: status.value || undefined,
      };
      return await getPoetryListApi(params);
    },
    immediate: true,
  });

/** 搜索 */
function handleSearch() {
  setFilters({});
}

/** 重置筛选 */
function handleReset() {
  keyword.value = '';
  dynasty.value = undefined;
  status.value = undefined;
  setFilters({});
}

/** 选中变化 */
function onSelectChange(keys: number[]) {
  selectedRowKeys.value = keys;
  if (keys.length === 0) {
    selectedStatus.value = null;
  } else if (!selectedStatus.value) {
    const firstRow = data.value.find((r) => r.id === keys[0]);
    selectedStatus.value = firstRow?.status ?? null;
  }
}

/** 行选择配置 */
const rowSelection = {
  selectedRowKeys: selectedRowKeys.value,
  onChange: onSelectChange,
  getCheckboxProps: (record: Poetry) => ({
    disabled:
      selectedStatus.value && selectedStatus.value !== record.status,
  }),
} as any;

/** 表格列 */
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80, key: 'id' },
  { title: '标题', dataIndex: 'title', minWidth: 150, key: 'title' },
  { title: '作者', dataIndex: 'author', width: 100, key: 'author' },
  { title: '朝代', dataIndex: 'dynasty', width: 80, key: 'dynasty' },
  {
    title: '分类',
    dataIndex: 'category_name',
    width: 100,
    key: 'category_name',
  },
  {
    title: '来源',
    dataIndex: 'source',
    minWidth: 120,
    key: 'source',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    key: 'status',
  },
  { title: '创建时间', dataIndex: 'created_at', width: 180, key: 'created_at' },
  {
    title: '操作',
    key: 'operation',
    width: 200,
    fixed: 'right' as const,
  },
];

/** 操作处理 */
function onCreate() {
  router.push('/poetry/create');
}

function onEdit(row: Poetry) {
  router.push(`/poetry/${row.id}/edit`);
}

async function onPublish(row: Poetry) {
  try {
    await updatePoetryStatusApi(row.id, 'published');
    message.success('发布成功');
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onArchive(row: Poetry) {
  try {
    await updatePoetryStatusApi(row.id, 'archived');
    message.success('归档成功');
    refresh();
  } catch {
    // error handled by interceptor
  }
}

function onDelete(row: Poetry) {
  deletePoetryApi(row.id)
    .then(() => {
      message.success(`「${row.title}」已删除`);
      refresh();
    })
    .catch(() => {});
}

async function onBatchPublish() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要发布的诗歌');
    return;
  }
  try {
    await batchUpdatePoetryStatusApi(selectedRowKeys.value, 'published');
    message.success('批量发布成功');
    selectedRowKeys.value = [];
    selectedStatus.value = null;
    refresh();
  } catch {
    // error handled by interceptor
  }
}

async function onBatchArchive() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要归档的诗歌');
    return;
  }
  try {
    await batchUpdatePoetryStatusApi(selectedRowKeys.value, 'archived');
    message.success('批量归档成功');
    selectedRowKeys.value = [];
    selectedStatus.value = null;
    refresh();
  } catch {
    // error handled by interceptor
  }
}

function onBatchConvert() {
  router.push('/tools');
}
</script>

<template>
  <div>
    <PageHeader title="诗歌管理">
      <template #extra>
        <Space>
          <Button @click="onBatchConvert">
            <ToolOutlined />
            工具
          </Button>
          <Button type="primary" @click="onCreate">
            <PlusOutlined />
            录入诗歌
          </Button>
        </Space>
      </template>
    </PageHeader>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <Row :gutter="16" align="middle">
        <Col>
          <Input
            v-model:value="keyword"
            placeholder="搜索标题或作者"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
          />
        </Col>
        <Col>
          <Select
            v-model:value="dynasty"
            placeholder="朝代"
            allow-clear
            :options="dynastyOptions"
            style="width: 110px"
            @change="handleSearch"
          />
        </Col>
        <Col>
          <Select
            v-model:value="status"
            placeholder="状态"
            allow-clear
            :options="statusOptions"
            style="width: 110px"
            @change="handleSearch"
          />
        </Col>
        <Col>
          <Space>
            <Button @click="handleReset">重置</Button>
            <Button type="primary" @click="handleSearch">搜索</Button>
          </Space>
        </Col>
        <Col v-if="selectedRowKeys.length > 0">
          <Space>
            <Button
              v-if="selectedStatus === 'draft'"
              type="primary"
              @click="onBatchPublish"
            >
              批量发布({{ selectedRowKeys.length }})
            </Button>
            <Button
              v-if="selectedStatus === 'published'"
              @click="onBatchArchive"
            >
              批量归档({{ selectedRowKeys.length }})
            </Button>
          </Space>
        </Col>
      </Row>
    </div>

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: Poetry) => record.id"
      :row-selection="rowSelection"
      bordered
      size="middle"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'source'">
          {{ record.source || '-' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="statusColors[record.status]">
            {{ statusLabels[record.status] || record.status }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'operation'">
          <TableAction
            :actions="[
              {
                text: '编辑',
                icon: EditOutlined,
                onClick: () => onEdit(record as Poetry),
              },
              {
                text: '发布',
                ifShow: record.status === 'draft',
                onClick: () => onPublish(record as Poetry),
              },
              {
                text: '归档',
                ifShow: record.status === 'published',
                onClick: () => onArchive(record as Poetry),
              },
            ]"
            :dropdown-actions="[
              {
                text: '删除',
                icon: DeleteOutlined,
                danger: true,
                popConfirm: {
                  title: `确定删除「${record.title}」吗？`,
                  confirm: () => onDelete(record as Poetry),
                },
              },
            ]"
            align="center"
          />
        </template>
      </template>
    </Table>
  </div>
</template>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
</style>
