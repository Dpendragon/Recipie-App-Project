import type { IngredientSuggestion } from '@/types/ingredient.types';
import { apiClient } from './apiClient';

// Trần của server (AUTOCOMPLETE_MAX_LIMIT): gửi lớn hơn thì server tự cắt về 10.
export const AUTOCOMPLETE_MAX_LIMIT = 10;

// GET /ingredients/autocomplete?q=&limit= — gợi ý nguyên liệu cho form đăng/sửa
// công thức (UC-17, UC-19). Từ khoá rỗng server trả mảng rỗng chứ không báo lỗi,
// nên không cần chặn trước ở màn hình.
export async function autocomplete(q: string, limit?: number): Promise<IngredientSuggestion[]> {
  const { data } = await apiClient.get<IngredientSuggestion[]>('/ingredients/autocomplete', {
    params: { q, limit },
  });
  return data;
}
