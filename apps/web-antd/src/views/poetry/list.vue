<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Poetry, PoetryListParams } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer, VbenTableAction } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchUpdatePoetryStatusApi,
  deletePoetryApi,
  getPoetryListApi,
  updatePoetryStatusApi,
} from '#/api';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const router = useRouter();

const selectedIds = ref<number[]>([]);
const selectedStatus = ref<'archived' | 'draft' | 'published' | null>(null);

const [FormDrawer] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

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
          const params: PoetryListParams = {
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          return await getPoetryListApi(params);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    checkboxConfig: {
      reserve: true,
      highlight: true,
      range: true,
      trigger: 'both',
      checkMethod({ row }: { row: Poetry }) {
        // 已有选中时，禁用不同状态的行的 checkbox
        if (selectedStatus.value && selectedStatus.value !== row.status) {
          return false;
        }
        return true;
      },
    },
    toolbarConfig: {
      custom: false,
      export: false,
      refresh: true,
      search: false,
      zoom: false,
    },
  } as VxeTableGridOptions<Poetry>,
  gridEvents: {
    checkboxChange: ({ checked, row }: { checked: boolean; row: Poetry }) =>
      onCheckboxChange({ checked, row }),
    checkboxAll: (params: { checked: boolean; rows?: Poetry[] }) => {
      const rows = params.rows ?? gridApi.grid.getTableData().tableData;
      onCheckboxAll({ checked: params.checked, rows });
    },
  },
});

function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

function onCreate() {
  router.push('/poetry/create');
}

function onEdit(row: Poetry) {
  router.push(`/poetry/${row.id}/edit`);
}

async function onPublish(row: Poetry) {
  try {
    await confirm(`确定发布「${row.title}」吗？`, '发布');
    await updatePoetryStatusApi(row.id, 'published');
    message.success('发布成功');
    onRefresh();
  } catch {
    // cancelled
  }
}

async function onArchive(row: Poetry) {
  try {
    await confirm(`确定归档「${row.title}」吗？`, '归档');
    await updatePoetryStatusApi(row.id, 'archived');
    message.success('归档成功');
    onRefresh();
  } catch {
    // cancelled
  }
}

function onDelete(row: Poetry) {
  const hideLoading = message.loading({
    content: `正在删除「${row.title}」...`,
    duration: 0,
    key: 'action_process_msg',
  });
  deletePoetryApi(row.id)
    .then(() => {
      message.success({
        content: `「${row.title}」已删除`,
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

function onRefresh() {
  gridApi.query();
}

function onCheckboxChange({ checked, row }: { checked: boolean; row: Poetry }) {
  if (checked) {
    selectedIds.value.push(row.id);
    if (!selectedStatus.value) {
      selectedStatus.value = row.status;
    }
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== row.id);
    if (selectedIds.value.length === 0) {
      selectedStatus.value = null;
    }
  }
}

function onCheckboxAll({
  checked,
  rows,
}: {
  checked: boolean;
  rows: Poetry[];
}) {
  if (checked) {
    // 过滤掉禁用的行（不同状态的）
    const selectableRows = rows.filter(
      (r) => !selectedStatus.value || selectedStatus.value === r.status,
    );
    selectedIds.value = selectableRows.map((r) => r.id);
    selectedStatus.value = selectableRows[0]?.status ?? null;
  } else {
    selectedIds.value = [];
    selectedStatus.value = null;
  }
}

async function onBatchPublish() {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择要发布的诗歌');
    return;
  }
  try {
    await confirm(
      `确定批量发布选中的 ${selectedIds.value.length} 首诗歌吗？`,
      '批量发布',
    );
    await batchUpdatePoetryStatusApi(selectedIds.value, 'published');
    message.success('批量发布成功');
    selectedIds.value = [];
    selectedStatus.value = null;
    onRefresh();
  } catch {
    // cancelled
  }
}

async function onBatchArchive() {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择要归档的诗歌');
    return;
  }
  try {
    await confirm(
      `确定批量归档选中的 ${selectedIds.value.length} 首诗歌吗？`,
      '批量归档',
    );
    await batchUpdatePoetryStatusApi(selectedIds.value, 'archived');
    message.success('批量归档成功');
    selectedIds.value = [];
    selectedStatus.value = null;
    onRefresh();
  } catch {
    // cancelled
  }
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-actions>
        <div class="flex items-center gap-2">
          <template v-if="selectedIds.length > 0">
            <Button
              v-if="selectedStatus === 'draft'"
              type="primary"
              @click="onBatchPublish"
            >
              批量发布({{ selectedIds.length }})
            </Button>
            <Button
              v-if="selectedStatus === 'published'"
              @click="onBatchArchive"
            >
              批量归档({{ selectedIds.length }})
            </Button>
          </template>
        </div>
      </template>
      <template #expand-after>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          录入诗歌
        </Button>
      </template>
      <template #action="{ row }">
        <VbenTableAction
          :actions="[
            {
              text: '编辑',
              icon: 'lucide:edit',
              onClick: () => onEdit(row),
            },
            {
              text: '发布',
              icon: 'lucide:upload',
              ifShow: row.status === 'draft',
              onClick: () => onPublish(row),
            },
            {
              text: '归档',
              icon: 'lucide:archive',
              ifShow: row.status === 'published',
              onClick: () => onArchive(row),
            },
          ]"
          :dropdown-actions="[
            {
              text: '删除',
              icon: 'lucide:trash-2',
              danger: true,
              popConfirm: {
                title: `确定删除「${row.title}」吗？`,
                confirm: () => onDelete(row),
              },
            },
          ]"
          align="center"
        />
      </template>
    </Grid>
  </Page>
</template>
