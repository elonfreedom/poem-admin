import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:book-open-text',
      order: 10,
      title: '诗歌管理',
    },
    name: 'Poetry',
    path: '/poetry',
    children: [
      {
        name: 'PoetryList',
        path: 'list',
        component: () => import('#/views/poetry/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '诗歌列表',
        },
      },
      {
        name: 'PoetryCreate',
        path: 'create',
        component: () => import('#/views/poetry/create.vue'),
        meta: {
          hideInMenu: true,
          title: '录入诗歌',
        },
      },
      {
        name: 'PoetryBatch',
        path: 'batch',
        component: () => import('#/views/poetry/batch.vue'),
        meta: {
          hideInMenu: true,
          title: '批量导入',
        },
      },
      {
        name: 'PoetryEdit',
        path: ':id/edit',
        component: () => import('#/views/poetry/edit.vue'),
        meta: {
          hideInMenu: true,
          title: '编辑诗歌',
        },
      },
    ],
  },
];

export default routes;
