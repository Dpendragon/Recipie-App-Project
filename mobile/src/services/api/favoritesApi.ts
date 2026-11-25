import type { FavoritesPage } from '@/types/favorite.types';
import { apiClient } from './apiClient';

// GET /favorites?cursor=&limit= — danh sách yêu thích, mới lưu trước (UC-10)
export async function getFavorites(params: {
  cursor?: string | null;
  limit?: number;
} = {}): Promise<FavoritesPage> {
  const { data } = await apiClient.get<FavoritesPage>('/favorites', {
    params: {
      cursor: params.cursor ?? undefined,
      limit: params.limit,
    },
  });
  return data;
}
