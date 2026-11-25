import type {
  CreateRecipeRequest,
  MyRecipeListResponse,
  RecipeDetail,
  RecipeSource,
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

// POST /recipes (UC-17). Server trả về chi tiết công thức vừa đăng theo đúng
// định dạng GET /recipes/:id, nên vào được màn hình chi tiết mà không gọi lại.
// Công thức vẫn lưu thành công khi không tính được dinh dưỡng (ngoại lệ 8a):
// khi đó nutrition là null và nutritionCoverage là 'NONE'.
export async function create(body: CreateRecipeRequest): Promise<RecipeDetail> {
  const { data } = await apiClient.post<RecipeDetail>('/recipes', body);
  return data;
}

// GET /recipes/mine?cursor=&limit= (UC-18). Bỏ trống cursor để lấy trang đầu;
// axios tự bỏ qua param undefined nên không gửi query rỗng.
export async function mine(cursor?: number, limit?: number): Promise<MyRecipeListResponse> {
  const { data } = await apiClient.get<MyRecipeListResponse>('/recipes/mine', {
    params: { cursor, limit },
  });
  return data;
}

// PATCH /recipes/:id (UC-19). id là id dòng recipes vì chỉ công thức nguồn LOCAL
// của chính mình mới sửa được (server trả 403 nếu không phải tác giả). Chỉ gửi
// những field thực sự đổi; server tự tính lại dinh dưỡng khi nguyên liệu hoặc
// số khẩu phần thay đổi và trả về chi tiết sau khi cập nhật.
export async function update(id: number, body: UpdateRecipeRequest): Promise<RecipeDetail> {
  const { data } = await apiClient.patch<RecipeDetail>(`/recipes/${id}`, body);
  return data;
}

// DELETE /recipes/:id (UC-20). Server trả 204 không kèm body.
export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/recipes/${id}`);
}
