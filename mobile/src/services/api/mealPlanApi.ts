import type {
  CreateMealPlanRequest,
  MealPlanEntry,
  MealRecipeRequest,
} from '@/types/mealPlan.types';
import { apiClient } from './apiClient';

// GET /meal-plan?from=&to= — các món trong khoảng ngày (UC-22)
export async function getMealPlan(from: string, to: string): Promise<MealPlanEntry[]> {
  const { data } = await apiClient.get<MealPlanEntry[]>('/meal-plan', {
    params: { from, to },
  });
  return data;
}

// POST /meal-plan — thêm 1 món vào 1 buổi (UC-21)
export async function addMealPlanEntry(
  body: CreateMealPlanRequest,
): Promise<MealPlanEntry> {
  const { data } = await apiClient.post<MealPlanEntry>('/meal-plan', body);
  return data;
}

// PATCH /meal-plan/:id — đổi món, ngày và buổi giữ nguyên (UC-23)
export async function changeMealPlanEntry(
  id: number,
  body: MealRecipeRequest,
): Promise<MealPlanEntry> {
  const { data } = await apiClient.patch<MealPlanEntry>(`/meal-plan/${id}`, body);
  return data;
}

// DELETE /meal-plan/:id — gỡ 1 món khỏi buổi (UC-24)
export async function removeMealPlanEntry(id: number): Promise<void> {
  await apiClient.delete(`/meal-plan/${id}`);
}
