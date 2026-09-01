import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:calendar-check',
      order: 6,
      title: 'page.checkin.title',
    },
    name: 'Checkin',
    path: '/checkin',
    redirect: 'list',
    children: [
      {
        name: 'CheckinList',
        path: 'list',
        component: () => import('#/views/checkin/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: 'page.checkin.list',
        },
      },
      {
        name: 'CheckinStats',
        path: 'stats',
        component: () => import('#/views/checkin/stats.vue'),
        meta: {
          icon: 'lucide:chart-bar',
          title: 'page.checkin.stats',
        },
      },
    ],
  },
];

export default routes;
