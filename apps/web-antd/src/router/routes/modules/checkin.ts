import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:calendar-check',
      order: 6,
      title: '打卡管理',
    },
    name: 'Checkin',
    path: '/checkin',
    children: [
      {
        name: 'CheckinList',
        path: 'list',
        component: () => import('#/views/checkin/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '打卡记录',
        },
      },
      {
        name: 'CheckinStats',
        path: 'stats',
        component: () => import('#/views/checkin/stats.vue'),
        meta: {
          icon: 'lucide:chart-bar',
          title: '数据统计',
        },
      },
    ],
  },
];

export default routes;
