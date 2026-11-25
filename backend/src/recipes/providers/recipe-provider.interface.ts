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
