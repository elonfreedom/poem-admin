<script lang="ts" setup>
import type { Author, AuthorListParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import TableAction from '#/components/TableAction.vue';
import { useTable } from '#/composables/useTable';
import { deleteAuthorApi, getAuthorListApi } from '#/api';

import { authorColumns } from './data';

const router = useRouter();

/** 搜索筛选 */
const keyword = ref('');

/** 表格数据 */
const { data, pagination, loading, refresh, setFilters, onTableChange } =
  useTable<Author>({
    fetchData: async ({ page, pageSize }) => {
      const params: AuthorListParams = {
        page,
        page_size: pageSize,
        keyword: keyword.value || undefined,
      };
      return await getAuthorListApi(params);
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
  setFilters({});
}

function onCreate() {
  router.push('/author/create');
}

function onEdit(row: Author) {
  router.push(`/author/${row.id}/edit`);
}

function onDelete(row: Author) {
  Modal.confirm({
    content: `确定删除作者「${row.name}」吗？${
      row.dynasty ? `（${row.dynasty}）` : ''
    }`,
    okType: 'danger',
    title: '删除确认',
    onOk() {
      const hideLoading = message.loading({
        content: `正在删除「${row.name}」...`,
        duration: 0,
        key: 'delete_msg',
      });
      deleteAuthorApi(row.id)
        .then(() => {
          message.success({
            content: `「${row.name}」已删除`,
            key: 'delete_msg',
          });
          refresh();
        })
        .catch(() => {
          hideLoading();
        });
    },
  });
}
</script>

<template>
  <div>
    <PageHeader title="作者管理">
      <template #extra>
        <Button type="primary" @click="onCreate">
          <PlusOutlined />
          添加作者
        </Button>
      </template>
    </PageHeader>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <Row :gutter="16" align="middle">
        <Col>
          <Input
            v-model:value="keyword"
            placeholder="搜索姓名或朝代"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
          />
        </Col>
        <Col>
          <Space>
            <Button @click="handleReset">重置</Button>
            <Button type="primary" @click="handleSearch">搜索</Button>
          </Space>
        </Col>
      </Row>
    </div>

    <!-- 表格 -->
    <Table
      :columns="authorColumns"
      :data-source="data"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: Author) => record.id"
      bordered
      size="middle"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name_traditional'">
          {{ record.name_traditional || '-' }}
        </template>
        <template v-else-if="column.key === 'biography'">
          {{ record.biography || '-' }}
        </template>
        <template v-else-if="column.key === 'operation'">
          <TableAction
            :actions="[
              {
                text: '编辑',
                icon: EditOutlined,
                onClick: () => onEdit(record as Author),
              },
            ]"
            :dropdown-actions="[
              {
                text: '删除',
                icon: DeleteOutlined,
                danger: true,
                popConfirm: {
                  title: `确定删除「${record.name}」吗？`,
                  confirm: () => onDelete(record as Author),
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
