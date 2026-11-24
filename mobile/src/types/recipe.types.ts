// Kiểu dữ liệu công thức, bám theo response của GET /recipes/:id?source=

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
