import type { RecipeListResponse, SearchRecipesParams } from '@/types/recipe.types';
import { apiClient } from './apiClient';

// GET /recipes/search — tìm theo tên và/hoặc nguyên liệu, kèm bộ lọc.
export async function searchRecipes(
  params: SearchRecipesParams,
  signal?: AbortSignal,
): Promise<RecipeListResponse> {
  const { data } = await apiClient.get<RecipeListResponse>('/recipes/search', {
    params: {
      name: params.name,
      ingredients: params.ingredients?.length ? params.ingredients.join(',') : undefined,
      diet: params.diet,
      maxReadyTime: params.maxReadyTime,
      type: params.type,
      limit: params.limit,
      cursor: params.cursor,
    },
    signal,
  });
  return data;
}

// GET /recipes/popular — món cộng đồng nổi tiếng cho Trang chủ.
export async function getPopularRecipes(limit = 5, signal?: AbortSignal): Promise<RecipeListResponse> {
  const { data } = await apiClient.get<RecipeListResponse>('/recipes/popular', {
    params: { limit },
    signal,
  });
  return data;
}
