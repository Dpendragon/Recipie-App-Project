import { RecipeSource } from '../../generated/prisma/enums';

// recipes.id là Int nhưng recipe_id ở favorites/recipe_reviews là VARCHAR
// (dùng chung với Spoonacular), nên phải kiểm tra định dạng trước khi ép kiểu.
export function isLocalId(id: string): boolean {
  return /^\d+$/.test(id);
}

// "7" và "007" sẽ tạo hai dòng khác nhau qua UNIQUE nên LOCAL phải chuẩn hoá.
export function normalizeRecipeId(id: string, source: RecipeSource): string {
  if (source !== RecipeSource.LOCAL) return id;
  return isLocalId(id) ? String(Number(id)) : id;
}
