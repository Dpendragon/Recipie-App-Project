import type {
  NutritionCoverage,
  RecipeSource,
} from '../generated/prisma/enums';
import type { RatingSummary } from '../reviews/reviews.service';

// Hợp đồng chung cho mọi nguồn công thức (DB nội bộ, Spoonacular...).
// Giữ interface nhỏ: người làm tìm kiếm sẽ bổ sung search(...) sau.
export const RECIPE_PROVIDER = Symbol('RECIPE_PROVIDER');

export type RecipeIngredientDetail = {
  id: number;
  nameVi: string;
  nameEn: string | null;
  quantity: number | null;
  unit: string | null;
  sortOrder: number;
};

// Tác giả chỉ có ở nguồn nội bộ; Spoonacular luôn null.
export type RecipeAuthor = {
  id: number;
  name: string;
};

export type RecipeDetail = {
  // Chuỗi để khớp recipe_id (VARCHAR) ở favorites/recipe_reviews.
  id: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  servings: number;
  readyInMinutes: number | null;
  diets: string[] | null;
  dishTypes: string[] | null;
  steps: string[];
  videoUrl: string | null;
  ingredients: RecipeIngredientDetail[];
  // Trả nguyên khối JSON của cột nutrition, null khi chưa có.
  nutrition: unknown;
  nutritionCoverage: NutritionCoverage | null;
  // null khi nguồn không có tác giả hoặc tác giả đã bị xoá mềm.
  author: RecipeAuthor | null;
};

// Response của GET /recipes/:id: dữ liệu nguồn cộng phần phụ thuộc người dùng.
export type RecipeDetailResponse = RecipeDetail & {
  rating: RatingSummary;
  // id dòng favorites của chính người đang đăng nhập, null khi chưa lưu.
  favoriteId: number | null;
};

export interface RecipeProvider {
  getById(id: string): Promise<RecipeDetail>;
}
