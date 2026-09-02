/**
 * 工具函数集合
 *
 * 仅保留本项目实际使用的功能
 */

import type { RouteRecordName, RouteRecordRaw } from 'vue-router';
import type { ClassValue } from 'clsx';

import type NProgress from 'nprogress';
import { clsx } from 'clsx';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

// ==================== 样式工具 ====================

/**
 * cn() — 合并 Tailwind 类名（clsx + tailwind-merge）
 *
 * 用法：cn('px-4 py-2', isActive && 'bg-primary', className)
 */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ==================== 树形结构操作 ====================

interface TreeConfigOptions {
  childProps: string;
}

/**
 * 遍历树形结构，返回所有节点中指定的值
 */
function traverseTreeValues<T, V>(
  tree: T[],
  getValue: (node: T) => V,
  options?: TreeConfigOptions,
): V[] {
  const result: V[] = [];
  const { childProps } = options || { childProps: 'children' };

  const dfs = (treeNode: T) => {
    const value = getValue(treeNode);
    result.push(value);
    const children = (treeNode as Record<string, any>)?.[childProps];
    if (!children) {
      return;
    }
    if (children.length > 0) {
      for (const child of children) {
        dfs(child);
      }
    }
  };

  for (const treeNode of tree) {
    dfs(treeNode);
  }
  return result.filter(Boolean);
}

// ==================== 路由模块合并 ====================

interface RouteModuleType {
  default: RouteRecordRaw[];
}

/**
 * 合并动态路由模块的默认导出
 */
function mergeRouteModules(
  routeModules: Record<string, unknown>,
): RouteRecordRaw[] {
  const mergedRoutes: RouteRecordRaw[] = [];
  for (const routeModule of Object.values(routeModules)) {
    const moduleRoutes = (routeModule as RouteModuleType)?.default ?? [];
    mergedRoutes.push(...moduleRoutes);
  }
  return mergedRoutes;
}

// ==================== 路由重置 ====================

import type { Router } from 'vue-router';

/**
 * 重置所有动态路由（移除不在白名单中的路由）
 */
function resetStaticRoutes(router: Router, routes: RouteRecordRaw[]) {
  const staticRouteNames = traverseTreeValues<
    RouteRecordRaw,
    RouteRecordName | undefined
  >(routes, (route) => {
    if (!route.name) {
      console.warn(
        `The route with the path ${route.path} needs to have the field name specified.`,
      );
    }
    return route.name;
  });

  const { getRoutes, hasRoute, removeRoute } = router;
  const allRoutes = getRoutes();
  allRoutes.forEach(({ name }) => {
    if (name && !staticRouteNames.includes(name) && hasRoute(name)) {
      removeRoute(name);
    }
  });
}

// ==================== 进度条 ====================

let nProgressInstance: null | typeof NProgress = null;

async function loadNprogress() {
  if (nProgressInstance) {
    return nProgressInstance;
  }
  nProgressInstance = await import('nprogress');
  nProgressInstance.configure({
    showSpinner: true,
    speed: 300,
  });
  return nProgressInstance;
}

async function startProgress() {
  const nprogress = await loadNprogress();
  nprogress?.start();
}

async function stopProgress() {
  const nprogress = await loadNprogress();
  nprogress?.done();
}

// ==================== 窗口操作 ====================

interface OpenWindowOptions {
  noopener?: boolean;
  noreferrer?: boolean;
  target?: '_blank' | '_parent' | '_self' | '_top' | string;
}

function openWindow(url: string, options: OpenWindowOptions = {}): void {
  const { noopener = true, noreferrer = true, target = '_blank' } = options;
  const features = [noopener && 'noopener=yes', noreferrer && 'noreferrer=yes']
    .filter(Boolean)
    .join(',');
  window.open(url, target, features);
}

// ==================== 全局 Loading ====================

/**
 * 移除并销毁全局 loading 元素
 */
function unmountGlobalLoading() {
  const loadingElement = document.querySelector('#__app-loading__');
  if (loadingElement) {
    loadingElement.classList.add('hidden');
    const injectLoadingElements = document.querySelectorAll(
      '[data-app-loading^="inject"]',
    );
    loadingElement.addEventListener(
      'transitionend',
      () => {
        loadingElement.remove();
        injectLoadingElements.forEach((el) => el.remove());
      },
      { once: true },
    );
  }
}

// ==================== 时间格式化 ====================

/**
 * 格式化日期时间
 * @param value ISO 时间字符串
 * @param format 格式模板，默认 'YYYY-MM-DD HH:mm'
 */
function formatDateTime(
  value: string | undefined | null,
  format = 'YYYY-MM-DD HH:mm',
): string {
  if (!value) return '-';
  const d = dayjs(value);
  return d.isValid() ? d.format(format) : '-';
}

/**
 * 格式化日期（不含时间）
 * @param value ISO 时间字符串
 */
function formatDate(value: string | undefined | null): string {
  return formatDateTime(value, 'YYYY-MM-DD');
}

/**
 * 格式化相对时间（3 天前、刚刚等）
 * @param value ISO 时间字符串
 */
function formatRelativeTime(value: string | undefined | null): string {
  if (!value) return '-';
  const d = dayjs(value);
  if (!d.isValid()) return '-';
  const now = dayjs();
  const diffSec = now.diff(d, 'second');
  if (diffSec < 60) return '刚刚';
  const diffMin = now.diff(d, 'minute');
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = now.diff(d, 'hour');
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = now.diff(d, 'day');
  if (diffDay < 30) return `${diffDay} 天前`;
  return d.format('YYYY-MM-DD HH:mm');
}

// ==================== 通用判断 ====================

// ==================== 文件下载 ====================

/**
 * 下载 Blob 为文件
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 下载 CSV 字符串为文件（自动添加 BOM 以支持中文 Excel 打开）
 */
function downloadCsv(csv: string, filename: string): void {
  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

// ==================== 通用判断 ====================

/**
 * 判断值是否为空（null/undefined/空字符串/空数组）
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

export {
  cn,
  downloadBlob,
  downloadCsv,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  isEmpty,
  mergeRouteModules,
  openWindow,
  resetStaticRoutes,
  startProgress,
  stopProgress,
  traverseTreeValues,
  unmountGlobalLoading,
};
