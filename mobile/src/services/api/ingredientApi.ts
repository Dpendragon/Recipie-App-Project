import type { Ingredient } from '@/types/ingredient.types';
import { apiClient } from './apiClient';

// GET /ingredients/autocomplete?q= — gợi ý nguyên liệu tiếng Việt khi người dùng gõ.
export async function autocompleteIngredients(q: string, signal?: AbortSignal): Promise<Ingredient[]> {
  const { data } = await apiClient.get<Ingredient[]>('/ingredients/autocomplete', {
    params: { q },
    signal,
  });
  return data;
}
