import { API_BASE_URL } from '@/constants/api';
import type { RecipeSummary } from '@/types/recipe.types';

// Thiếu phần nào thì bỏ phần đó
export function formatMeta(recipe: Pick<RecipeSummary, 'readyInMinutes' | 'servings'>): string | null {
  const parts: string[] = [];
  if (recipe.readyInMinutes !== null) parts.push(`${recipe.readyInMinutes} phút`);
  if (recipe.servings !== null) parts.push(`${recipe.servings} người`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// Điểm trung bình và số đánh giá.
export function formatRating(recipe: Pick<RecipeSummary, 'averageRating' | 'reviewCount'>): string | null {
  if (recipe.averageRating === null) return null;
  return `${recipe.averageRating.toFixed(1).replace('.', ',')} (${recipe.reviewCount})`;
}

// Chỉ tìm theo tên (không có số khớp) thì trả null để ẩn dòng này.
export function formatMatch(recipe: Pick<RecipeSummary, 'matchedCount' | 'totalIngredients'>): string | null {
  if (recipe.matchedCount === null || recipe.totalIngredients === null) return null;
  const missing = Math.max(recipe.totalIngredients - recipe.matchedCount, 0);
  return `Có ${recipe.matchedCount}/${recipe.totalIngredients} nguyên liệu · thiếu ${missing}`;
}

export function formatSource(source: RecipeSummary['source']): string {
  return source === 'LOCAL' ? 'Cộng đồng' : 'Spoonacular';
}

export function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}
