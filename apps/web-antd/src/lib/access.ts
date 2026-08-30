/**
 * 路由访问权限生成
 * 替代 @vben/access 中的 generateAccessible
 *
 * 简化版说明：
 * - 原 Vben 版本支持前端/后端/后端混合三种模式，支持角色过滤、菜单生成等
 * - 本项目不使用角色过滤，且 accessMenus 设置后未被消费（Layout 使用硬编码菜单）
 * - 因此简化为：将动态路由注册到路由器，返回空菜单
 */

import type { Router, RouteRecordRaw } from 'vue-router';

import { cloneDeep } from 'lodash-es';

interface GenerateAccessibleOptions {
  roles?: string[];
  router: Router;
  routes: RouteRecordRaw[];
}

/**
 * 生成可访问的路由和菜单
 * 将动态路由注册到路由器（添加到 Root 路由的 children 中）
 */
async function generateAccessible(
  options: GenerateAccessibleOptions,
): Promise<{
  accessibleMenus: any[];
  accessibleRoutes: RouteRecordRaw[];
}> {
  const { router, routes } = options;

  const accessibleRoutes = cloneDeep(routes);

  // 处理路由树：为有子路由但没有 redirect 的路由添加 redirect
  const processRoutes = (routeList: RouteRecordRaw[], parent?: RouteRecordRaw) => {
    for (const route of routeList) {
      if (route.children && route.children.length > 0) {
        processRoutes(route.children, route);

        if (!route.redirect) {
          const firstChild = route.children[0];
          if (firstChild?.path && !firstChild.path.startsWith(':')) {
            if (parent && typeof parent.redirect === 'string') {
              const parentSplit = parent.redirect.split('/');
              parentSplit.splice(-1, 2, route.path, firstChild.path);
              route.redirect = parentSplit.join('/');
            } else if (parent) {
              route.redirect = `${parent.path}/${route.path}/${firstChild.path}`;
            } else {
              route.redirect = `${route.path}/${firstChild.path}`;
            }
          }
        }
      }
    }
  };

  processRoutes(accessibleRoutes);

  // 查找 Root 路由
  const root = router.getRoutes().find((item) => item.path === '/');
  const names = root?.children?.map((item) => item.name) ?? [];

  // 动态添加到 router 实例内
  for (const route of accessibleRoutes) {
    if (root) {
      // 有子路由时移除 component，避免多层 Layout 嵌套
      if (route.children && route.children.length > 0) {
        delete route.component;
      }
      if (names?.includes(route.name)) {
        // 已存在则更新
        const index = root.children?.findIndex(
          (item) => item.name === route.name,
        );
        if (index !== undefined && index !== -1 && root.children) {
          root.children[index] = route;
        }
      } else {
        root.children?.push(route);
      }
    } else {
      router.addRoute(route);
    }
  }

  // 刷新 Root 路由
  if (root) {
    if (root.name) {
      router.removeRoute(root.name);
    }
    router.addRoute(root);
  }

  // 菜单未被消费，返回空数组
  return { accessibleMenus: [], accessibleRoutes };
}

export { generateAccessible };
