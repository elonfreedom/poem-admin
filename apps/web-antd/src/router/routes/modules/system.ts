import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 30,
      title: '系统配置',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'BannerList',
        path: 'banner',
        component: () => import('#/views/system/banner.vue'),
        meta: {
          icon: 'lucide:image',
          title: 'Banner 管理',
        },
      },
      {
        name: 'AnnouncementList',
        path: 'announcement',
        component: () => import('#/views/system/announcement.vue'),
        meta: {
          icon: 'lucide:megaphone',
          title: '公告管理',
        },
      },
    ],
  },
];

export default routes;
