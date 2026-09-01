import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:users',
      order: 5,
      title: 'page.user.title',
    },
    name: 'User',
    path: '/user',
    redirect: 'list',
    children: [
      {
        name: 'UserList',
        path: 'list',
        component: () => import('#/views/user/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: 'page.user.list',
        },
      },
    ],
  },
];

export default routes;
