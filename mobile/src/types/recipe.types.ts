// Kiểu dữ liệu công thức, bám theo response của GET /recipes/:id?source=

import type { Paginated } from '@/types/pagination.types';

// Nguồn công thức: DB nội bộ hoặc nguồn mở rộng Spoonacular.
export type RecipeSource = 'LOCAL' | 'SPOONACULAR';

// Mức độ đầy đủ của thông tin dinh dưỡng.
export type NutritionCoverage = 'FULL' | 'PARTIAL' | 'NONE';

export interface RecipeIngredient {
  id: number;
  nameVi: string;
  nameEn: string | null;
  quantity: number | null;
  unit: string | null;
  sortOrder: number;
}

// Khối JSON ở cột nutrition. Các trường đều có thể thiếu khi coverage là PARTIAL.
export interface RecipeNutrition {
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbohydrates?: number | null;
}

export interface RecipeAuthor {
  id: number;
  name: string | null;
}

export interface RecipeRating {
  average: number;
  count: number;
}

export interface RecipeDetail {
  // Chuỗi để khớp recipe_id (VARCHAR) ở favorites/recipe_reviews.
  id: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  servings: number;
  readyInMinutes: number | null;
  diets: string[] | null;
  dishTypes: string[] | null;
  // Cột steps là TEXT một chuỗi, server đã tách sẵn thành mảng theo dòng.
  steps: string[];
  videoUrl: string | null;
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutrition | null;
  nutritionCoverage: NutritionCoverage | null;

  // Ba trường dưới đây được bổ sung ở Bước 6 (B2). Backend hiện tại chưa trả,
  // nên để optional: màn hình phải chạy được với cả response cũ lẫn mới.
  author?: RecipeAuthor | null;
  rating?: RecipeRating;
  favoriteId?: number | null;
}

// Một nguyên liệu trong form đăng/sửa công thức (CreateRecipeIngredientDto):
// chỉ nameVi là bắt buộc, nameEn dùng để đối chiếu dinh dưỡng, quantity và unit
// bỏ trống khi không định lượng được.
export interface RecipeIngredientInput {
  nameVi: string;
  nameEn?: string;
  quantity?: number;
  unit?: string;
}

// Body của POST /recipes (UC-17), khớp CreateRecipeDto. Không có description và
// không có source: công thức tự đăng luôn là nguồn LOCAL.
export interface CreateRecipeRequest {
  title: string;
  servings: number;
  readyInMinutes?: number;
  diets?: string[];
  dishTypes?: string[];
  // Server nối lại thành TEXT, mỗi bước một dòng; cần ít nhất 1 bước.
  steps: string[];
  imageUrl?: string;
  videoUrl?: string;
  // Cần ít nhất 1 nguyên liệu.
  ingredients: RecipeIngredientInput[];
}

// Body của PATCH /recipes/:id (UC-19), khớp UpdateRecipeDto (PartialType):
// field nào bỏ khỏi body thì server không sửa phần đó. Riêng ba cột nullable
// dưới đây nhận null để xoá giá trị cũ; title, servings, steps và ingredients
// gửi lên thì phải hợp lệ (steps/ingredients không được rỗng).
export type UpdateRecipeRequest = Partial<
  Omit<CreateRecipeRequest, 'readyInMinutes' | 'imageUrl' | 'videoUrl'>
> & {
  readyInMinutes?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
};

// Một dòng của GET /recipes/mine (UC-18): chỉ 6 trường để hiển thị dạng lưới,
// muốn xem đầy đủ thì gọi tiếp GET /recipes/:id.
export interface MyRecipe {
  // id dòng recipes (Int) và cũng là cursor của trang sau.
  id: number;
  title: string;
  imageUrl: string | null;
  readyInMinutes: number | null;
  servings: number;
  // ISO datetime string (server trả Date, JSON hoá thành chuỗi).
  createdAt: string;
}

export type MyRecipeListResponse = Paginated<MyRecipe>;
