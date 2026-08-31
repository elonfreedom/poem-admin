import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:users',
      order: 5,
      title: '用户管理',
    },
    name: 'User',
    path: '/user',
    children: [
      {
        name: 'UserList',
        path: 'list',
        component: () => import('#/views/user/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '用户列表',
        },
      },
    ],
  },
];

export default routes;
