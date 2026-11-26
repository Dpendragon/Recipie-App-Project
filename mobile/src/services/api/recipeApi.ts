import type {
  CreateRecipeRequest,
  MyRecipeListResponse,
  RecipeDetail,
  RecipeListResponse,
  RecipeSource,
  SearchRecipesParams,
  UpdateRecipeRequest,
} from '@/types/recipe.types';
import { apiClient } from './apiClient';

// GET /recipes/:id?source= — source là tham số bắt buộc của API.
// id là chuỗi vì Spoonacular dùng id riêng, không phải số tự tăng như DB nội bộ.
export async function getById(id: string, source: RecipeSource): Promise<RecipeDetail> {
  const { data } = await apiClient.get<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`, {
    params: { source },
  });
  return data;
}

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

// POST /recipes. Server trả về chi tiết công thức vừa đăng theo đúng
// định dạng GET /recipes/:id, nên vào được màn hình chi tiết mà không gọi lại.
// Công thức vẫn lưu thành công khi không tính được dinh dưỡng:
// khi đó nutrition là null và nutritionCoverage là 'NONE'.
export async function create(body: CreateRecipeRequest): Promise<RecipeDetail> {
  const { data } = await apiClient.post<RecipeDetail>('/recipes', body);
  return data;
}

// GET /recipes/mine?cursor=&limit=. Bỏ trống cursor để lấy trang đầu;
// axios tự bỏ qua param undefined nên không gửi query rỗng.
export async function mine(cursor?: number, limit?: number): Promise<MyRecipeListResponse> {
  const { data } = await apiClient.get<MyRecipeListResponse>('/recipes/mine', {
    params: { cursor, limit },
  });
  return data;
}

// PATCH /recipes/:id. id là id dòng recipes vì chỉ công thức nguồn LOCAL
// của chính mình mới sửa được (server trả 403 nếu không phải tác giả). Chỉ gửi
// những field thực sự đổi; server tự tính lại dinh dưỡng khi nguyên liệu hoặc
// số khẩu phần thay đổi và trả về chi tiết sau khi cập nhật.
export async function update(id: number, body: UpdateRecipeRequest): Promise<RecipeDetail> {
  const { data } = await apiClient.patch<RecipeDetail>(`/recipes/${id}`, body);
  return data;
}

// DELETE /recipes/:id. Server trả 204 không kèm body.
export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/recipes/${id}`);
}

// GET /recipes/popular — món cộng đồng nổi tiếng cho Trang chủ.
export async function getPopularRecipes(limit = 5, signal?: AbortSignal): Promise<RecipeListResponse> {
  const { data } = await apiClient.get<RecipeListResponse>('/recipes/popular', {
    params: { limit },
    signal,
  });
  return data;
}
