import type {
  RecipeIngredient,
  RecipeNutrition,
  RecipeSource,
} from '@/types/recipe.types';
import { CACHED_RECIPES_TABLE, getDatabase } from './database';

// CRUD thuần trên bảng cached_recipes. File này KHÔNG quyết định khi nào nên
// đọc/ghi cache — đó là việc của cacheManager.ts.

// Cache chỉ giữ đúng các cột ở Mục 7.12, không đủ để dựng lại RecipeDetail
// (thiếu servings, readyInMinutes, diets, dishTypes, nutritionCoverage), nên
// màn ngoại tuyến dùng kiểu riêng này.
export interface CachedRecipe {
  userId: number;
  recipeId: string;
  source: RecipeSource;
  title: string | null;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  videoUrl: string | null;
  nutrition: RecipeNutrition | null;
  favoriteId: number | null;
  // ISO datetime string, thời điểm ghi/ghi đè dòng này gần nhất.
  cachedAt: string;
}

// Dữ liệu đầy đủ để ghi mới một dòng cache (chỉ UC-09 có đủ).
export type CachedRecipeInput = Omit<CachedRecipe, 'cachedAt'>;

// Phần chi tiết mà UC-08 làm mới được khi có mạng.
export interface CachedRecipeDetailPatch {
  title: string | null;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  videoUrl: string | null;
  nutrition: RecipeNutrition | null;
  // Bỏ trống thì giữ nguyên favorite_id đang có.
  favoriteId?: number | null;
}

type CachedRecipeRow = {
  user_id: number;
  recipe_id: string;
  source: string;
  title: string | null;
  image_url: string | null;
  ingredients: string;
  steps: string;
  video_url: string | null;
  nutrition: string | null;
  favorite_id: number | null;
  cached_at: string;
};

// "7" và "007" phải trỏ tới cùng một dòng cache, giống cách backend chuẩn hoá
// recipe_id của nguồn LOCAL trước khi ghi vào MySQL.
function normalizeRecipeId(recipeId: string, source: RecipeSource): string {
  const trimmed = recipeId.trim();
  if (source !== 'LOCAL' || !/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return String(Number(trimmed));
}

// Cột steps là TEXT một chuỗi (Mục 7.12), nối theo dòng giống bảng recipes.
function serializeSteps(steps: string[]): string {
  return steps.join('\n');
}

function parseSteps(raw: string): string[] {
  return raw
    .split('\n')
    .map((step) => step.trim())
    .filter((step) => step.length > 0);
}

// Dữ liệu cache có thể do bản app cũ ghi, nên JSON hỏng không được làm vỡ màn hình.
function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toCachedRecipe(row: CachedRecipeRow): CachedRecipe {
  return {
    userId: row.user_id,
    recipeId: row.recipe_id,
    source: row.source as RecipeSource,
    title: row.title,
    imageUrl: row.image_url,
    ingredients: parseJson<RecipeIngredient[]>(row.ingredients, []),
    steps: parseSteps(row.steps),
    videoUrl: row.video_url,
    nutrition: parseJson<RecipeNutrition | null>(row.nutrition, null),
    favoriteId: row.favorite_id,
    cachedAt: row.cached_at,
  };
}

// Quy tắc ghi (1) — CHỈ UC-09 được dùng: tạo mới hoặc ghi đè toàn bộ record.
export async function upsertFull(input: CachedRecipeInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${CACHED_RECIPES_TABLE}
       (user_id, recipe_id, source, title, image_url, ingredients, steps,
        video_url, nutrition, favorite_id, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      normalizeRecipeId(input.recipeId, input.source),
      input.source,
      input.title,
      input.imageUrl,
      JSON.stringify(input.ingredients),
      serializeSteps(input.steps),
      input.videoUrl,
      input.nutrition === null ? null : JSON.stringify(input.nutrition),
      input.favoriteId,
      new Date().toISOString(),
    ],
  );
}

// Quy tắc ghi (2) — UC-08 khi có mạng: chỉ UPDATE dòng đã tồn tại của đúng
// user_id + recipe_id + source, không tạo cache cho công thức chưa yêu thích.
// favorite_id dùng COALESCE để không xoá mất giá trị cũ khi người gọi không biết.
export async function updateIfExists(
  userId: number,
  recipeId: string,
  source: RecipeSource,
  patch: CachedRecipeDetailPatch,
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE ${CACHED_RECIPES_TABLE}
        SET title = ?, image_url = ?, ingredients = ?, steps = ?,
            video_url = ?, nutrition = ?,
            favorite_id = COALESCE(?, favorite_id),
            cached_at = ?
      WHERE user_id = ? AND recipe_id = ? AND source = ?`,
    [
      patch.title,
      patch.imageUrl,
      JSON.stringify(patch.ingredients),
      serializeSteps(patch.steps),
      patch.videoUrl,
      patch.nutrition === null ? null : JSON.stringify(patch.nutrition),
      patch.favoriteId ?? null,
      new Date().toISOString(),
      userId,
      normalizeRecipeId(recipeId, source),
      source,
    ],
  );
  return result.changes > 0;
}

// Quy tắc ghi (3) — UC-10 khi có mạng: CHỈ title/image của dòng đã tồn tại.
// Tuyệt đối không đụng tới ingredients, steps, video_url, nutrition, vì danh
// sách yêu thích không mang những dữ liệu đó và sẽ làm mất chi tiết đã cache.
export async function updateTitleImageIfExists(
  userId: number,
  recipeId: string,
  source: RecipeSource,
  title: string | null,
  imageUrl: string | null,
  favoriteId?: number | null,
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE ${CACHED_RECIPES_TABLE}
        SET title = ?, image_url = ?,
            favorite_id = COALESCE(?, favorite_id),
            cached_at = ?
      WHERE user_id = ? AND recipe_id = ? AND source = ?`,
    [
      title,
      imageUrl,
      favoriteId ?? null,
      new Date().toISOString(),
      userId,
      normalizeRecipeId(recipeId, source),
      source,
    ],
  );
  return result.changes > 0;
}

// UC-11: bỏ yêu thích thì xoá luôn dòng cache tương ứng.
export async function remove(
  userId: number,
  recipeId: string,
  source: RecipeSource,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM ${CACHED_RECIPES_TABLE}
      WHERE user_id = ? AND recipe_id = ? AND source = ?`,
    [userId, normalizeRecipeId(recipeId, source), source],
  );
}

// UC-10 khi mất mạng: danh sách công thức đã cache của riêng tài khoản này,
// mới cache gần nhất lên trước.
export async function listByUser(userId: number): Promise<CachedRecipe[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CachedRecipeRow>(
    `SELECT * FROM ${CACHED_RECIPES_TABLE}
      WHERE user_id = ?
      ORDER BY cached_at DESC`,
    [userId],
  );
  return rows.map(toCachedRecipe);
}

// UC-08 khi mất mạng: đọc lại chi tiết đã lưu tạm.
export async function get(
  userId: number,
  recipeId: string,
  source: RecipeSource,
): Promise<CachedRecipe | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CachedRecipeRow>(
    `SELECT * FROM ${CACHED_RECIPES_TABLE}
      WHERE user_id = ? AND recipe_id = ? AND source = ?`,
    [userId, normalizeRecipeId(recipeId, source), source],
  );
  return row ? toCachedRecipe(row) : null;
}

// Logout hoặc chuyển tài khoản: xoá cache của tài khoản hiện tại.
export async function clearForUser(userId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${CACHED_RECIPES_TABLE} WHERE user_id = ?`, [userId]);
}
