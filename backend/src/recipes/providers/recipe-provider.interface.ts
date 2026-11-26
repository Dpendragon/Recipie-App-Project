import type {
  NutritionCoverage,
  RecipeSource,
} from '../../generated/prisma/enums';
import type { RatingSummary } from '../../reviews/reviews.service';

// Một thẻ món trong kết quả tìm kiếm
export interface RecipeSummary {
  id: string; 
  source: 'LOCAL' | 'SPOONACULAR';
  title: string;
  imageUrl: string | null;
  readyInMinutes: number | null;
  servings: number | null;
  matchedCount: number | null; 
  totalIngredients: number | null; 
  averageRating: number | null;
  reviewCount: number;
  isFavorite: boolean;
}

// Món do provider trả về, dùng để xếp hạng
export type RankedRecipe = Omit<RecipeSummary, 'isFavorite'> & {
  nameTier?: 0 | 1 | 2; // mức khớp tên
};

// Tiêu chí tìm kiếm đã được kiểm tra
export interface SearchParams {
  name?: string;
  ingredients: string[];
  diet?: string;
  maxReadyTime?: number;
  type?: string;
  limit: number;
  cursor?: number;
}

export interface RecipeProvider {
  search(params: SearchParams): Promise<RankedRecipe[]>;
}

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
