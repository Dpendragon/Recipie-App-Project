import type { RecipeDetail, RecipeSource } from '@/types/recipe.types';
import { apiClient } from './apiClient';

// GET /recipes/:id?source= — source là tham số bắt buộc của API.
// id là chuỗi vì Spoonacular dùng id riêng, không phải số tự tăng như DB nội bộ.
export async function getById(id: string, source: RecipeSource): Promise<RecipeDetail> {
  const { data } = await apiClient.get<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`, {
    params: { source },
  });
  return data;
}
