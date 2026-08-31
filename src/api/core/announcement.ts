import { requestClient } from '#/api/request';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
}

export async function getAnnouncementListApi() {
  return requestClient.get<Announcement[]>('/announcements');
}

export async function createAnnouncementApi(
  data: Omit<Announcement, 'created_at' | 'id' | 'updated_at'>,
) {
  return requestClient.post<Announcement>('/announcements', data);
}

export async function updateAnnouncementApi(
  id: number,
  data: Partial<Omit<Announcement, 'created_at' | 'id' | 'updated_at'>>,
) {
  return requestClient.put<Announcement>(`/announcements/${id}`, data);
}

export async function deleteAnnouncementApi(id: number) {
  return requestClient.delete(`/announcements/${id}`);
}
