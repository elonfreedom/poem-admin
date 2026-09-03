import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wrench',
      order: 30,
      title: 'page.tools.title',
    },
    name: 'Tools',
    path: '/tools',
    component: () => import('#/views/tools/index.vue'),
  },
  {
    meta: {
      hideInMenu: true,
      title: 'page.tools.dedup',
    },
    name: 'ToolsDedup',
    path: '/tools/dedup',
    component: () => import('#/views/tools/dedup.vue'),
  },
];

export default routes;
