import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:tags',
      order: 20,
      title: 'page.category.title',
    },
    name: 'Category',
    path: '/category',
    redirect: 'list',
    children: [
      {
        name: 'CategoryList',
        path: 'list',
        component: () => import('#/views/category/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: 'page.category.list',
        },
      },
    ],
  },
];

export default routes;
