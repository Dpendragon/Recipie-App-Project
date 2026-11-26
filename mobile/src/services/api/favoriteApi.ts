import type {
  CreateFavoriteRequest,
  Favorite,
  FavoriteListResponse,
} from '@/types/favorite.types';
import { apiClient } from './apiClient';

// GET /favorites?cursor=&limit=. Bỏ trống cursor để lấy trang đầu;
// axios tự bỏ qua param undefined nên không gửi query rỗng.
export async function list(cursor?: number, limit?: number): Promise<FavoriteListResponse> {
  const { data } = await apiClient.get<FavoriteListResponse>('/favorites', {
    params: { cursor, limit },
  });
  return data;
}

// POST /favorites. Công thức đã có sẵn trong danh sách thì server giữ
// nguyên bản ghi cũ và vẫn trả về dòng đó, không báo lỗi.
export async function create(body: CreateFavoriteRequest): Promise<Favorite> {
  const { data } = await apiClient.post<Favorite>('/favorites', body);
  return data;
}

// DELETE /favorites/:id. id là id dòng favorites. Server luôn trả 204
// không kèm body, kể cả khi dòng đó đã bị bỏ lưu từ trước.
export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/favorites/${id}`);
}
