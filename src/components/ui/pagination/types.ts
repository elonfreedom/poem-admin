/** 分页组件 Props */
export interface PaginationProps {
  /** 当前页码 */
  current?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 总条数 */
  total?: number;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 是否显示总数 */
  showTotal?: boolean;
  /** 是否显示页码跳转 */
  showJumper?: boolean;
  /** 是否显示 pageSize 选择器 */
  showSizeChanger?: boolean;
}
