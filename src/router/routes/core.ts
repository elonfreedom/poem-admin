import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '#/constants';
import { usePreferencesStore } from '#/stores/preferences';

import { $t } from '#/locales';

const BasicLayout = () => import('#/layouts/Layout.vue');
const AuthPageLayout = () => import('#/layouts/AuthLayout.vue');
/** 全局404页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/_core/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
function getCoreRoutes(): RouteRecordRaw[] {
  const preferencesStore = usePreferencesStore();
  return [
    /**
     * 根路由
     * 使用基础布局，作为所有页面的父级容器，子级就不必配置BasicLayout。
     * 此路由必须存在，且不应修改
     */
    {
      component: BasicLayout,
      meta: {
        hideInBreadcrumb: true,
        title: 'Root',
      },
      name: 'Root',
      path: '/',
      redirect: preferencesStore.app.defaultHomePath,
      children: [],
    },
    {
      component: AuthPageLayout,
      meta: {
        hideInTab: true,
        title: 'Authentication',
      },
      name: 'Authentication',
      path: '/auth',
      redirect: LOGIN_PATH,
      children: [
        {
          name: 'Login',
          path: 'login',
          component: () => import('#/views/_core/authentication/login.vue'),
          meta: {
            title: $t('page.auth.login'),
          },
        },
        {
          name: 'ForgotPassword',
          path: 'forgot-password',
          component: () =>
            import('#/views/_core/authentication/forgot-password.vue'),
          meta: {
            title: $t('page.auth.forgetPassword'),
          },
        },
      ],
    },
  ];
}

export { getCoreRoutes, fallbackNotFoundRoute };
