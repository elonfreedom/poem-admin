<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FrontendUser, UserListParams } from '#/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenTableAction } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getFrontendUserDetailApi,
  getFrontendUserListApi,
  updateUserStatusApi,
} from '#/api';

// 当前选中的用户
const selectedUser = ref<FrontendUser | null>(null);

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

// 用户详情弹窗
const [UserDetailModal, modalApi] = useVbenModal({
  destroyOnClose: true,
  title: '用户详情',
  width: 600,
});

// 表格列定义
const useColumns = () => {
  return [
    { field: 'id', title: 'ID', width: 200 },
    { field: 'nickname', title: '昵称', minWidth: 120 },
    {
      field: 'email',
      title: '邮箱',
      minWidth: 180,
      formatter: ({ cellValue }: { cellValue: string }) => {
        if (!cellValue) return '-';
        // 脱敏显示：abc***@example.com
        const [local, domain] = cellValue.split('@');
        if (!domain) return cellValue;
        if (local.length <= 3) return `${local}***@${domain}`;
        return `${local.slice(0, 3)}***@${domain}`;
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      formatter: ({ cellValue }: { cellValue: string }) =>
        cellValue === 'active' ? '正常' : '已禁用',
    },
    { field: 'created_at', title: '创建时间', width: 180 },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 140,
    },
  ];
};

// 搜索表单
const useGridFormSchema = () => {
  return [
    {
      fieldName: 'keyword',
      component: 'Input',
      label: '搜索',
      componentProps: {
        placeholder: '请输入昵称或邮箱',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      component: 'Select',
      label: '状态',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '正常', value: 'active' },
          { label: '已禁用', value: 'disabled' },
        ],
      },
    },
  ];
};

// 表格
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
    showCollapseButton: false,
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params: UserListParams = {
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          return await getFrontendUserListApi(params);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: false,
      export: false,
      refresh: true,
      search: false,
      zoom: false,
    },
  } as VxeTableGridOptions<FrontendUser>,
});

function onRefresh() {
  gridApi.query();
}

async function onViewDetail(row: FrontendUser) {
  // 先显示基本信息
  selectedUser.value = row;
  modalApi.open();
  // 获取完整详情（包含 stats）
  try {
    const detail = await getFrontendUserDetailApi(row.id);
    selectedUser.value = detail;
  } catch {
    // 失败时保持使用列表数据
  }
}

async function onToggleStatus(row: FrontendUser) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'active' ? '启用' : '禁用';

  try {
    await updateUserStatusApi(row.id, { status: newStatus });
    message.success(`已${actionText}用户「${row.nickname}」`);
    onRefresh();
  } catch {
    // error handled by request interceptor
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #action="{ row }">
        <VbenTableAction
          :actions="[
            {
              text: '详情',
              icon: 'lucide:eye',
              onClick: () => onViewDetail(row),
            },
            {
              text: row.status === 'active' ? '禁用' : '启用',
              icon: row.status === 'active' ? 'lucide:ban' : 'lucide:check',
              danger: row.status === 'active',
              onClick: () => onToggleStatus(row),
            },
          ]"
          align="center"
        />
      </template>
    </Grid>

    <!-- 用户详情弹窗 -->
    <UserDetailModal>
      <div v-if="selectedUser" class="p-4">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div class="flex gap-2">
            <span class="text-muted-foreground">ID:</span>
            <span>{{ selectedUser.id }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">昵称:</span>
            <span>{{ selectedUser.nickname }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">邮箱:</span>
            <span>{{ selectedUser.email || '-' }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">状态:</span>
            <span>{{
              selectedUser.status === 'active' ? '正常' : '已禁用'
            }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-muted-foreground">注册时间:</span>
            <span>{{ selectedUser.created_at }}</span>
          </div>
        </div>

        <template v-if="getStats">
          <hr class="my-4" />
          <h4 class="mb-3 text-sm font-semibold">统计数据</h4>
          <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div class="rounded bg-muted p-3 text-center">
              <div class="text-lg font-semibold">
                {{ getStats.total_checkin_days }}
              </div>
              <div class="text-xs text-muted-foreground">累计打卡(天)</div>
            </div>
            <div class="rounded bg-muted p-3 text-center">
              <div class="text-lg font-semibold">
                {{ getStats.consecutive_days }}
              </div>
              <div class="text-xs text-muted-foreground">连续打卡(天)</div>
            </div>
            <div class="rounded bg-muted p-3 text-center">
              <div class="text-lg font-semibold">
                {{ getStats.favorites_count }}
              </div>
              <div class="text-xs text-muted-foreground">收藏数</div>
            </div>
            <div class="rounded bg-muted p-3 text-center">
              <div class="text-lg font-semibold">
                {{ getStats.reading_plans_count }}
              </div>
              <div class="text-xs text-muted-foreground">阅读计划</div>
            </div>
            <div class="rounded bg-muted p-3 text-center">
              <div class="text-lg font-semibold">
                {{ getStats.passkeys_count }}
              </div>
              <div class="text-xs text-muted-foreground">Passkey数</div>
            </div>
          </div>
        </template>
      </div>
    </UserDetailModal>
  </Page>
</template>
