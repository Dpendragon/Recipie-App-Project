import type {
  MyReviewListResponse,
  RecipeReviewsResponse,
  UpsertReviewRequest,
  UpsertReviewResponse,
} from '@/types/review.types';
import type { RecipeSource } from '@/types/recipe.types';
import { apiClient } from './apiClient';

// source là tham số query bắt buộc của mọi endpoint theo công thức, vì recipe_id
// có thể trùng nhau giữa LOCAL và SPOONACULAR.

// POST /recipes/:id/reviews?source= (UC-12 tạo mới, UC-15 sửa — một upsert).
// Trả 200 kèm { review, summary } cho cả hai nhánh.
export async function upsert(
  recipeId: string,
  source: RecipeSource,
  body: UpsertReviewRequest,
): Promise<UpsertReviewResponse> {
  const { data } = await apiClient.post<UpsertReviewResponse>(
    `/recipes/${encodeURIComponent(recipeId)}/reviews`,
    body,
    { params: { source } },
  );
  return data;
}

// GET /recipes/:id/reviews?source=&cursor=&limit= (UC-13).
// Công thức không tồn tại vẫn trả 200 với summary rỗng và data rỗng.
export async function listByRecipe(
  recipeId: string,
  source: RecipeSource,
  cursor?: number,
  limit?: number,
): Promise<RecipeReviewsResponse> {
  const { data } = await apiClient.get<RecipeReviewsResponse>(
    `/recipes/${encodeURIComponent(recipeId)}/reviews`,
    { params: { source, cursor, limit } },
  );
  return data;
}

// GET /reviews/mine?cursor=&limit= (UC-14), sắp xếp theo lần sửa gần nhất.
export async function listMine(cursor?: number, limit?: number): Promise<MyReviewListResponse> {
  const { data } = await apiClient.get<MyReviewListResponse>('/reviews/mine', {
    params: { cursor, limit },
  });
  return data;
}

// DELETE /recipes/:id/reviews?source= (UC-16). Trả 204; chưa từng đánh giá công
// thức này thì server trả 404 (khác DELETE /favorites/:id vốn luôn 204).
export async function remove(recipeId: string, source: RecipeSource): Promise<void> {
  await apiClient.delete(`/recipes/${encodeURIComponent(recipeId)}/reviews`, {
    params: { source },
  });
}
