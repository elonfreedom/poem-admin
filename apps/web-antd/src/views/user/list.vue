<script lang="ts" setup>
import type { FrontendUser, UserListParams } from '#/api';

import { computed, ref } from 'vue';

import { CheckOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Col,
  Descriptions,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import PageHeader from '#/components/PageHeader.vue';
import TableAction from '#/components/TableAction.vue';
import { useTable } from '#/composables/useTable';
import {
  getFrontendUserDetailApi,
  getFrontendUserListApi,
  updateUserStatusApi,
} from '#/api';

// 当前选中的用户
const selectedUser = ref<FrontendUser | null>(null);
const detailLoading = ref(false);
const modalVisible = ref(false);

// 获取统计数据（兼容两种数据格式）
const getStats = computed(() => {
  const u = selectedUser.value;
  if (!u) return null;
  // 新格式：直接返回在用户对象上
  if (u.total_checkin_days !== undefined) {
    return {
      total_checkin_days: u.total_checkin_days || 0,
      consecutive_days: u.consecutive_days || 0,
      favorites_count: u.favorite_count || 0,
      reading_plans_count: u.reading_plan_count || 0,
      passkeys_count: u.passkey_count || 0,
    };
  }
  // 旧格式：stats 对象
  return u.stats || null;
});

/** 搜索筛选 */
const keyword = ref('');
const status = ref<string | undefined>(undefined);

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '已禁用', value: 'disabled' },
];

/** 表格列定义 */
const columns = [
  { title: 'ID', dataIndex: 'id', width: 200, key: 'id' },
  { title: '昵称', dataIndex: 'nickname', minWidth: 120, key: 'nickname' },
  {
    title: '邮箱',
    dataIndex: 'email',
    minWidth: 180,
    key: 'email',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    key: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
    key: 'created_at',
  },
  {
    title: '操作',
    key: 'operation',
    fixed: 'right' as const,
    width: 140,
  },
];

/** 表格数据 */
const { data, pagination, loading, refresh, setFilters, onTableChange } =
  useTable<FrontendUser>({
    fetchData: async ({ page, pageSize }) => {
      const params: UserListParams = {
        page,
        pageSize,
        keyword: keyword.value || undefined,
        status: (status.value || undefined) as UserListParams['status'],
      };
      const result = await getFrontendUserListApi(params);
      return { items: result.list, total: result.total };
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
  status.value = undefined;
  setFilters({});
}

async function onViewDetail(row: FrontendUser) {
  // 先显示基本信息
  selectedUser.value = row;
  detailLoading.value = false;
  modalVisible.value = true;
  // 获取完整详情（包含 stats）
  detailLoading.value = true;
  try {
    const detail = await getFrontendUserDetailApi(row.id);
    selectedUser.value = detail;
  } catch {
    // 失败时保持使用列表数据
  } finally {
    detailLoading.value = false;
  }
}

async function onToggleStatus(row: FrontendUser) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '禁用';

  try {
    await updateUserStatusApi(row.id, { status: newStatus });
    message.success(`已${actionText}用户「${row.nickname}」`);
    refresh();
  } catch {
    // error handled by request interceptor
  }
}

/** 邮箱脱敏 */
function maskEmail(email?: null | string): string {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!domain || !local) return email;
  if (local.length <= 3) return `${local}***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}
</script>

<template>
  <div>
    <PageHeader title="用户管理" />

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <Row :gutter="16" align="middle">
        <Col>
          <Input
            v-model:value="keyword"
            placeholder="请输入昵称或邮箱"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
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
      </Row>
    </div>

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: FrontendUser) => record.id"
      bordered
      size="middle"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'email'">
          {{ maskEmail(record.email) }}
        </template>
        <template v-else-if="column.key === 'status'">
          {{ record.status === 'active' ? '正常' : '已禁用' }}
        </template>
        <template v-else-if="column.key === 'operation'">
          <TableAction
            :actions="[
              {
                text: '详情',
                icon: EyeOutlined,
                onClick: () => onViewDetail(record as FrontendUser),
              },
              {
                text: record.status === 'active' ? '禁用' : '启用',
                icon: record.status === 'active' ? StopOutlined : CheckOutlined,
                danger: record.status === 'active',
                onClick: () => onToggleStatus(record as FrontendUser),
              },
            ]"
            align="center"
          />
        </template>
      </template>
    </Table>

    <!-- 用户详情弹窗 -->
    <Modal
      v-model:open="modalVisible"
      title="用户详情"
      :width="600"
      :footer="null"
      destroy-on-close
    >
      <div v-if="selectedUser">
        <Descriptions :column="2" bordered size="small" class="mb-4">
          <Descriptions.Item label="ID">{{ selectedUser.id }}</Descriptions.Item>
          <Descriptions.Item label="昵称">
            {{ selectedUser.nickname }}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {{ selectedUser.email || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {{ selectedUser.status === 'active' ? '正常' : '已禁用' }}
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {{ selectedUser.created_at }}
          </Descriptions.Item>
        </Descriptions>

        <template v-if="getStats">
          <h4 class="mb-3 text-sm font-semibold">统计数据</h4>
          <Row :gutter="[16, 16]">
            <Col :span="8">
              <div class="rounded bg-gray-50 p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.total_checkin_days }}
                </div>
                <div class="text-xs text-gray-500">累计打卡(天)</div>
              </div>
            </Col>
            <Col :span="8">
              <div class="rounded bg-gray-50 p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.consecutive_days }}
                </div>
                <div class="text-xs text-gray-500">连续打卡(天)</div>
              </div>
            </Col>
            <Col :span="8">
              <div class="rounded bg-gray-50 p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.favorites_count }}
                </div>
                <div class="text-xs text-gray-500">收藏数</div>
              </div>
            </Col>
            <Col :span="8">
              <div class="rounded bg-gray-50 p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.reading_plans_count }}
                </div>
                <div class="text-xs text-gray-500">阅读计划</div>
              </div>
            </Col>
            <Col :span="8">
              <div class="rounded bg-gray-50 p-3 text-center">
                <div class="text-lg font-semibold">
                  {{ getStats.passkeys_count }}
                </div>
                <div class="text-xs text-gray-500">Passkey数</div>
              </div>
            </Col>
          </Row>
        </template>
      </div>
      <div v-else-if="detailLoading" class="py-10 text-center">
        <a-spin />
      </div>
    </Modal>
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
