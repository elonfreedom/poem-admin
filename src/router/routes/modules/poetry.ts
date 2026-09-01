import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:book-open-text',
      order: 10,
      title: 'page.poetry.title',
    },
    name: 'Poetry',
    path: '/poetry',
    redirect: 'list',
    children: [
      {
        name: 'PoetryList',
        path: 'list',
        component: () => import('#/views/poetry/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: 'page.poetry.list',
        },
      },
      {
        name: 'PoetryCreate',
        path: 'create',
        component: () => import('#/views/poetry/create.vue'),
        meta: {
          hideInMenu: true,
          title: 'page.poetry.create',
        },
      },
      {
        name: 'PoetryBatch',
        path: 'batch',
        component: () => import('#/views/poetry/batch.vue'),
        meta: {
          hideInMenu: true,
          title: 'page.poetry.batch',
        },
      },
      {
        name: 'PoetryEdit',
        path: ':id/edit',
        component: () => import('#/views/poetry/edit.vue'),
        meta: {
          hideInMenu: true,
          title: 'page.poetry.edit',
        },
      },
    ],
  },
];

export default routes;
