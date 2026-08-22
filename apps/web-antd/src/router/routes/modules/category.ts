import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:tags',
      order: 20,
      title: '分类管理',
    },
    name: 'Category',
    path: '/category',
    children: [
      {
        name: 'CategoryList',
        path: 'list',
        component: () => import('#/views/category/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '分类列表',
        },
      },
    ],
  },
];

export default routes;
