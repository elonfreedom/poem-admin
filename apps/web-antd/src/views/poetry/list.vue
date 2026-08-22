<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Poetry, PoetryListParams } from '#/api';

import { useRouter } from 'vue-router';

import { Page, useVbenDrawer, VbenTableAction } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePoetryApi,
  getPoetryListApi,
  updatePoetryStatusApi,
} from '#/api';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const router = useRouter();

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
    toolbarConfig: {
      custom: false,
      export: false,
      refresh: true,
      search: false,
      zoom: false,
    },
  } as VxeTableGridOptions<Poetry>,
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
  router.push(`/${row.id}/edit`);
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
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
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
