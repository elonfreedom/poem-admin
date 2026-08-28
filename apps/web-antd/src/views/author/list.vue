<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Author, AuthorListParams } from '#/api';

import { ref, useTemplateRef } from 'vue';

import { Page, VbenTableAction } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAuthorApi, getAuthorListApi } from '#/api';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const formRef = useTemplateRef('formRef');

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
          const params: AuthorListParams = {
            page: page.currentPage,
            page_size: page.pageSize,
            ...formValues,
          };
          return await getAuthorListApi(params);
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
  } as VxeTableGridOptions<Author>,
});

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formRef.value?.openCreate();
}

function onEdit(row: Author) {
  formRef.value?.loadAuthor(row.id);
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
          onRefresh();
        })
        .catch(() => {
          hideLoading();
        });
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Form ref="formRef" @success="onRefresh" />
    <Grid>
      <template #toolbar-actions>
        <div class="flex items-center gap-2">
          <Button type="primary" @click="onCreate">
            <Plus class="size-5" />
            添加作者
          </Button>
        </div>
      </template>
      <template #action="{ row }">
        <VbenTableAction
          :actions="[
            {
              text: '编辑',
              icon: 'lucide:edit',
              onClick: () => onEdit(row),
            },
          ]"
          :dropdown-actions="[
            {
              text: '删除',
              icon: 'lucide:trash-2',
              danger: true,
              popConfirm: {
                title: `确定删除「${row.name}」吗？`,
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
