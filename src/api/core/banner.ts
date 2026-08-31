import { requestClient } from '#/api/request';

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_type: 'poem' | 'url';
  link_value: string;
  sort: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export async function getBannerListApi() {
  return requestClient.get<Banner[]>('/banners');
}

export async function createBannerApi(data: Omit<Banner, 'created_at' | 'id'>) {
  return requestClient.post<Banner>('/banners', data);
}

export async function updateBannerApi(
  id: number,
  data: Partial<Omit<Banner, 'created_at' | 'id'>>,
) {
  return requestClient.put<Banner>(`/banners/${id}`, data);
}

export async function deleteBannerApi(id: number) {
  return requestClient.delete(`/banners/${id}`);
}
