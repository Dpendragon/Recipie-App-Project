import type { Ingredient, IngredientSuggestion } from '@/types/ingredient.types';
import { apiClient } from './apiClient';

// Trần của server (AUTOCOMPLETE_MAX_LIMIT): gửi lớn hơn thì server tự cắt về 10.
export const AUTOCOMPLETE_MAX_LIMIT = 10;

// GET /ingredients/autocomplete?q=&limit= — gợi ý nguyên liệu cho form đăng/sửa
// công thức. Từ khoá rỗng server trả mảng rỗng chứ không báo lỗi,
// nên không cần chặn trước ở màn hình.
export async function autocomplete(q: string, limit?: number): Promise<IngredientSuggestion[]> {
  const { data } = await apiClient.get<IngredientSuggestion[]>('/ingredients/autocomplete', {
    params: { q, limit },
  });
  return data;
}

// GET /ingredients/autocomplete?q= — gợi ý nguyên liệu tiếng Việt khi người dùng
// gõ ở màn tìm kiếm. signal để huỷ request cũ khi từ khoá đổi.
export async function autocompleteIngredients(q: string, signal?: AbortSignal): Promise<Ingredient[]> {
  const { data } = await apiClient.get<Ingredient[]>('/ingredients/autocomplete', {
    params: { q },
    signal,
  });
  return data;
}
