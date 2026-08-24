import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/overview',
    children: [
      {
        name: 'DashboardOverview',
        path: 'overview',
        component: () => import('#/views/dashboard/overview.vue'),
        meta: {
          icon: 'lucide:chart-area',
          title: '数据总览',
        },
      },
    ],
  },
];

export default routes;
