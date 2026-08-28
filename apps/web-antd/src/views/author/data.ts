import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

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

export { dynastyOptions };

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        allowClear: true,
        placeholder: '搜索姓名或朝代',
        class: 'w-48',
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
      field: 'name',
      title: '姓名',
      width: 120,
    },
    {
      field: 'name_traditional',
      title: '繁体',
      width: 120,
      formatter({ row }: { row: { name_traditional?: string } }) {
        return row.name_traditional || '-';
      },
    },
    {
      field: 'dynasty',
      title: '朝代',
      width: 100,
    },
    {
      field: 'biography',
      title: '简介',
      minWidth: 200,
      formatter({ row }: { row: { biography?: string } }) {
        return row.biography || '-';
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
      width: 150,
    },
  ];
}

export function useAuthorFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '姓名',
      rules: 'required',
      componentProps: {
        placeholder: '请输入作者姓名（简体）',
      },
    },
    {
      component: 'Input',
      fieldName: 'name_traditional',
      label: '繁体姓名',
      componentProps: {
        placeholder: '繁体姓名（如与简体相同可留空）',
      },
    },
    {
      component: 'AutoComplete',
      fieldName: 'dynasty',
      label: '朝代',
      rules: 'required',
      componentProps: {
        placeholder: '选择或输入朝代',
        options: dynastyOptions,
        filterOption: (input: string, option: { value: string }) => {
          return option.value.includes(input);
        },
      },
    },
    {
      component: 'Textarea',
      fieldName: 'biography',
      label: '简介',
      componentProps: {
        rows: 4,
        placeholder: '作者简介（可选）',
      },
    },
  ];
}
