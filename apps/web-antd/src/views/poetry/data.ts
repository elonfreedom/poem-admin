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

export { dynastyOptions, statusColors, statusOptions };

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
      fieldName: 'dynasty',
      label: '朝代',
      componentProps: {
        allowClear: true,
        options: dynastyOptions,
        class: 'w-28',
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
      type: 'checkbox',
      width: 60,
      fixed: 'left',
    },
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
      field: 'source',
      title: '来源',
      minWidth: 120,
      formatter({ row }: { row: { source?: string } }) {
        return row.source || '-';
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
      },
      formatter({ row }: { row: { status: string } }) {
        const statusLabels: Record<string, string> = {
          draft: '草稿',
          published: '已发布',
          archived: '已归档',
        };
        return statusLabels[row.status] ?? row.status;
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
