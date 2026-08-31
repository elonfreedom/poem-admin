import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:user-pen',
      order: 20,
      title: '作者管理',
    },
    name: 'Author',
    path: '/author',
    children: [
      {
        name: 'AuthorList',
        path: 'list',
        component: () => import('#/views/author/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '作者列表',
        },
      },
      {
        name: 'AuthorCreate',
        path: 'create',
        component: () => import('#/views/author/create.vue'),
        meta: {
          hideInMenu: true,
          title: '添加作者',
        },
      },
      {
        name: 'AuthorEdit',
        path: ':id/edit',
        component: () => import('#/views/author/edit.vue'),
        meta: {
          hideInMenu: true,
          title: '编辑作者',
        },
      },
    ],
  },
];

export default routes;
