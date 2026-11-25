export type RecipeSource = 'LOCAL' | 'SPOONACULAR';

// Một thẻ món trong danh sách
export interface RecipeSummary {
  id: string; 
  source: RecipeSource;
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

// Thông tin kèm theo danh sách món.
export interface RecipeListMeta {
  count: number; 
  localCount: number; 
  spoonacularCount: number;
  hasMore: boolean; 
  nextCursor: number | null; 
}

// Response của GET /recipes/search và GET /recipes/popular.
export interface RecipeListResponse {
  data: RecipeSummary[];
  meta: RecipeListMeta;
}

// Các giá trị bộ lọc backend chấp nhận.
export type DietFilter = 'vegetarian' | 'vegan' | 'gluten-free';
export type MaxReadyTimeFilter = 15 | 30 | 60;
export type DishTypeFilter = 'main course' | 'side dish' | 'soup' | 'dessert';

// Trạng thái bộ lọc trong app..
export interface SearchFilters {
  diet: DietFilter | null;
  maxReadyTime: MaxReadyTimeFilter | null;
  type: DishTypeFilter | null;
}

// Tham số gọi GET /recipes/search.
export interface SearchRecipesParams {
  name?: string;
  ingredients?: string[];
  diet?: DietFilter | null;
  maxReadyTime?: MaxReadyTimeFilter | null;
  type?: DishTypeFilter | null;
  limit?: number;
  cursor?: number;
}
