import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:tags',
      order: 21,
      title: 'page.tag.title',
    },
    name: 'TagList',
    path: '/tag',
    component: () => import('#/views/tag/list.vue'),
  },
];

export default routes;
