/**
 * 作者模块共享数据 & 列定义
 */

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

/** 作者表格列定义 */
export const authorColumns = [
  { title: 'ID', dataIndex: 'id', width: 80, key: 'id' },
  { title: '姓名', dataIndex: 'name', width: 120, key: 'name' },
  {
    title: '繁体',
    dataIndex: 'name_traditional',
    width: 120,
    key: 'name_traditional',
  },
  { title: '朝代', dataIndex: 'dynasty', width: 100, key: 'dynasty' },
  {
    title: '简介',
    dataIndex: 'biography',
    minWidth: 200,
    key: 'biography',
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
    width: 150,
    fixed: 'right' as const,
  },
];
