import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wrench',
      order: 30,
      title: '工具',
    },
    name: 'Tools',
    path: '/tools',
    component: () => import('#/views/tools/index.vue'),
  },
];

export default routes;
