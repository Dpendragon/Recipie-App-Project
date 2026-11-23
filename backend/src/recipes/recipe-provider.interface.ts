import type {
  NutritionCoverage,
  RecipeSource,
} from '../generated/prisma/enums';

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
};

export interface RecipeProvider {
  getById(id: string): Promise<RecipeDetail>;
}
