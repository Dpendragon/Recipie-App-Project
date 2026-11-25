import type { RecipeSource } from './shopping.types';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

// 1 món đã gán vào 1 buổi (bảng meal_plan_entries). title/imageUrl đã được
// backend chọn sẵn giữa dữ liệu sống và snapshot.
export type MealPlanEntry = {
  id: number;
  date: string; // YYYY-MM-DD
  mealSlot: MealSlot;
  recipeId: string;
  source: RecipeSource;
  title: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

// Thông tin công thức gửi lên khi thêm (UC-21) hoặc đổi món (UC-23).
// Snapshot chỉ bắt buộc với SPOONACULAR; LOCAL thì server tự lấy.
export type MealRecipeRequest = {
  recipeId: string;
  source: RecipeSource;
  titleSnapshot?: string;
  imageSnapshot?: string;
};

export type CreateMealPlanRequest = MealRecipeRequest & {
  date: string;
  mealSlot: MealSlot;
};
