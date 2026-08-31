/**
 * 表格数据加载 Composable
 * 表格数据加载、分页、筛选、排序
 *
 * 提供分页、筛选、排序、刷新等表格常用功能
 */

import { reactive, toRefs } from 'vue';

/** 分页参数 */
interface Pagination {
  current: number;
  pageSize: number;
  total: number;
}

/** 表格加载状态 */
interface TableState<T> {
  /** 表格数据 */
  data: T[];
  /** 分页信息 */
  pagination: Pagination;
  /** 加载状态 */
  loading: boolean;
}

/** useTable 配置 */
interface UseTableOptions<T = any> {
  /** 数据加载函数 */
  fetchData: (params: {
    page: number;
    pageSize: number;
    [key: string]: any;
  }) => Promise<{ items: T[]; total: number }>;
  /** 默认分页大小 */
  defaultPageSize?: number;
  /** 是否立即加载 */
  immediate?: boolean;
  /** 错误回调 */
  onError?: (error: any) => void;
}

/**
 * 表格数据管理 composable
 *
 * @example
 * ```ts
 * const { data, pagination, loading, refresh, onTableChange, setFilters } = useTable({
 *   fetchData: async ({ page, pageSize, keyword }) => {
 *     return await getListApi({ page, pageSize, keyword });
 *   },
 * });
 * ```
 */
export function useTable<T = any>(options: UseTableOptions<T>) {
  const {
    fetchData,
    defaultPageSize = 20,
    immediate = true,
    onError,
  } = options;

  /** 筛选条件 */
  const filters = reactive<Record<string, any>>({});

  /** 表格状态 */
  const state = reactive<TableState<T>>({
    data: [],
    loading: false,
    pagination: {
      current: 1,
      pageSize: defaultPageSize,
      total: 0,
    },
  });

  /** 加载数据 */
  const loadData = async () => {
    state.loading = true;
    try {
      const result = await fetchData({
        page: state.pagination.current,
        pageSize: state.pagination.pageSize,
        ...filters,
      });
      state.data = result.items as any;
      state.pagination.total = result.total;
    } catch (error) {
      onError?.(error);
    } finally {
      state.loading = false;
    }
  };

  /** 刷新当前页 */
  const refresh = () => {
    loadData();
  };

  /** 重置到第一页并刷新 */
  const reload = () => {
    state.pagination.current = 1;
    loadData();
  };

  /** 设置筛选条件并刷新 */
  const setFilters = (newFilters: Record<string, any>, resetPage = true) => {
    Object.assign(filters, newFilters);
    if (resetPage) {
      state.pagination.current = 1;
    }
    loadData();
  };

  /** 重置筛选条件 */
  const resetFilters = () => {
    Object.keys(filters).forEach((key) => {
      delete filters[key];
    });
    state.pagination.current = 1;
    loadData();
  };

  /** 分页/排序变化处理 */
  const onTableChange = (pagination: any, _filters: any, sorter: any) => {
    state.pagination.current = pagination.current;
    state.pagination.pageSize = pagination.pageSize;
    // 排序处理
    if (sorter?.field) {
      filters.sortField = sorter.field;
      filters.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    }
    loadData();
  };

  /** 删除成功后刷新（智能处理最后一页） */
  const refreshAfterDelete = (deletedCount = 1) => {
    const { current, pageSize, total } = state.pagination;
    const remaining = total - deletedCount;
    // 如果当前页删完了且不是第一页，回退一页
    if (
      remaining <= (current - 1) * pageSize &&
      current > 1 &&
      state.data.length <= deletedCount
    ) {
      state.pagination.current = current - 1;
    }
    loadData();
  };

  // 立即加载
  if (immediate) {
    loadData();
  }

  return {
    ...toRefs(state),
    filters,
    loadData,
    onTableChange,
    refresh,
    refreshAfterDelete,
    reload,
    resetFilters,
    setFilters,
  };
}

/** 导出类型 */
export type { Pagination, TableState, UseTableOptions };
