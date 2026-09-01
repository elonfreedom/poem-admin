import type { RouteRecordRaw } from 'vue-router';

const NestedLayout = () => import('#/layouts/NestedLayout.vue');

const routes: RouteRecordRaw[] = [
  {
    component: NestedLayout,
    meta: {
      icon: 'lucide:settings',
      order: 30,
      title: 'page.system.title',
    },
    name: 'System',
    path: '/system',
    redirect: 'banner',
    children: [
      {
        name: 'BannerList',
        path: 'banner',
        component: () => import('#/views/system/banner.vue'),
        meta: {
          icon: 'lucide:image',
          title: 'page.system.banner',
        },
      },
      {
        name: 'AnnouncementList',
        path: 'announcement',
        component: () => import('#/views/system/announcement.vue'),
        meta: {
          icon: 'lucide:megaphone',
          title: 'page.system.announcement',
        },
      },
    ],
  },
];

export default routes;
