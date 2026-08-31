/**
 * 路由访问权限生成
 *
 * 简化版说明：
 * - 本项目不使用角色过滤，且 accessMenus 设置后未被消费（Layout 使用硬编码菜单）
 * - 因此简化为：将动态路由注册到路由器，返回空菜单
 */

import type { Router, RouteRecordRaw } from 'vue-router';

interface GenerateAccessibleOptions {
  roles?: string[];
  router: Router;
  routes: RouteRecordRaw[];
}

/**
 * 生成可访问的路由和菜单
 * 将动态路由注册到路由器（作为 Root 路由的子路由）
 */
async function generateAccessible(
  options: GenerateAccessibleOptions,
): Promise<{
  accessibleMenus: any[];
  accessibleRoutes: RouteRecordRaw[];
}> {
  const { router, routes } = options;

  // 使用 router.addRoute 正确注册子路由到 Root
  for (const route of routes) {
    router.addRoute('Root', route);
  }

  // 菜单未被消费，返回空数组
  return { accessibleMenus: [], accessibleRoutes: routes };
}

export { generateAccessible };
