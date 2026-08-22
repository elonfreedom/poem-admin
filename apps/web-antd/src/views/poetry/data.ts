import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

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

export { statusColors, statusOptions };

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        allowClear: true,
        placeholder: '搜索标题或作者',
        class: 'w-48',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        allowClear: true,
        options: statusOptions,
        class: 'w-28',
      },
    },
  ];
}

export function useColumns(): VxeTableGridColumns {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'title',
      title: '标题',
      minWidth: 150,
    },
    {
      field: 'author',
      title: '作者',
      width: 100,
    },
    {
      field: 'dynasty',
      title: '朝代',
      width: 80,
    },
    {
      field: 'category_name',
      title: '分类',
      width: 100,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
      },
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 200,
    },
  ];
}
