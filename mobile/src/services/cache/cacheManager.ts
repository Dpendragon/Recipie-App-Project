import { isAxiosError } from 'axios';
import type { Favorite, FavoriteListResponse } from '@/types/favorite.types';
import type { PageMeta } from '@/types/pagination.types';
import type { RecipeDetail, RecipeSource } from '@/types/recipe.types';
import * as favoriteApi from '../api/favoriteApi';
import * as recipeApi from '../api/recipeApi';
import type { CachedRecipe } from './recipeCache';
import * as recipeCache from './recipeCache';

// Nơi duy nhất quyết định KHI NÀO đọc cache, cập nhật cache, xoá cache — đúng 3
// quy tắc ghi ở Mục 7.12. Mọi hàm đều nhận userId vì cache phân vùng theo
// (user_id, recipe_id, source): không có userId thì không được đụng vào cache.

// Mất mạng và công thức chưa từng được yêu thích (UC-08, ngoại lệ 2c).
export class OfflineCacheMissError extends Error {
  constructor(message = 'Cần kết nối mạng để xem công thức này') {
    super(message);
    this.name = 'OfflineCacheMissError';
  }
}

// Mất mạng và chưa từng lưu công thức nào trên máy (UC-10, ngoại lệ 2c).
export class OfflineEmptyCacheError extends Error {
  constructor(message = 'Chưa có công thức nào để xem khi mất mạng') {
    super(message);
    this.name = 'OfflineEmptyCacheError';
  }
}

// Chi tiết công thức: lấy từ mạng thì đủ trường, lấy từ cache thì chỉ có phần
// đã lưu tạm, nên tách rõ hai nhánh để màn hình biết mình đang hiển thị cái gì.
export type RecipeDetailResult =
  | { origin: 'network'; recipe: RecipeDetail }
  | { origin: 'cache'; recipe: CachedRecipe };

// Dòng yêu thích dựng lại từ cache. favoriteId có thể null nếu dòng cache được
// ghi bởi bản app cũ; khi đó phải có mạng (UC-10) mới bỏ yêu thích được.
export interface CachedFavorite {
  favoriteId: number | null;
  recipeId: string;
  source: RecipeSource;
  title: string | null;
  imageUrl: string | null;
  cachedAt: string;
}

export type FavoriteListResult =
  | { origin: 'network'; data: Favorite[]; meta: PageMeta }
  | { origin: 'cache'; data: CachedFavorite[]; meta: PageMeta };

const OFFLINE_META: PageMeta = { nextCursor: null, hasMore: false };

// Lỗi ghi cache không được làm hỏng màn hình: dữ liệu từ server vẫn hiển thị
// được, cache chỉ là bản sao để dùng khi mất mạng.
async function ignoreCacheError(task: Promise<unknown>): Promise<void> {
  try {
    await task;
  } catch (error) {
    console.warn('[cacheManager] Ghi cache thất bại', error);
  }
}

// Axios không có response = không gọi tới được server (mất mạng, timeout, DNS).
// Khác hẳn lỗi có response như 404 "Không tìm thấy công thức", vốn phải nổi lên.
function isNetworkFailure(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

// UC-08. Có mạng: lấy dữ liệu sống rồi làm mới cache theo quy tắc ghi (2) — chỉ
// UPDATE dòng đã tồn tại, không tạo cache cho công thức chưa từng yêu thích.
// Mất mạng (hoặc gọi API thất bại vì mạng): rơi về cache theo luồng thay thế 2a.
export async function getRecipeDetail(params: {
  userId: number;
  recipeId: string;
  source: RecipeSource;
  isOnline: boolean;
}): Promise<RecipeDetailResult> {
  const { userId, recipeId, source, isOnline } = params;

  if (!isOnline) {
    return readDetailFromCache(userId, recipeId, source);
  }

  let recipe: RecipeDetail;
  try {
    recipe = await recipeApi.getById(recipeId, source);
  } catch (error) {
    if (isNetworkFailure(error)) {
      return readDetailFromCache(userId, recipeId, source);
    }
    throw error;
  }

  await ignoreCacheError(
    recipeCache.updateIfExists(userId, recipe.id, recipe.source, {
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      videoUrl: recipe.videoUrl,
      nutrition: recipe.nutrition,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      nutritionCoverage: recipe.nutritionCoverage,
      // Backend cũ chưa trả favoriteId; undefined thì giữ nguyên giá trị đã có.
      favoriteId: recipe.favoriteId,
    }),
  );

  return { origin: 'network', recipe };
}

async function readDetailFromCache(
  userId: number,
  recipeId: string,
  source: RecipeSource,
): Promise<RecipeDetailResult> {
  const cached = await recipeCache.get(userId, recipeId, source);
  if (!cached) {
    throw new OfflineCacheMissError();
  }
  return { origin: 'cache', recipe: cached };
}

// UC-09. Lưu yêu thích trên server trước, có id dòng favorites rồi mới ghi cache
// theo quy tắc ghi (1) — đây là use case DUY NHẤT được INSERT/REPLACE cả record.
// Cần RecipeDetail đầy đủ nên chỉ gọi được từ màn chi tiết công thức.
export async function saveFavorite(params: {
  userId: number;
  recipe: RecipeDetail;
}): Promise<Favorite> {
  const { userId, recipe } = params;

  // SPOONACULAR bắt buộc có titleSnapshot; LOCAL thì server tự lấy từ bảng
  // recipes và bỏ qua giá trị gửi lên, nên gửi kèm luôn cho cả hai nguồn.
  const favorite = await favoriteApi.create({
    recipeId: recipe.id,
    source: recipe.source,
    titleSnapshot: recipe.title,
    imageSnapshot: recipe.imageUrl ?? undefined,
  });

  await ignoreCacheError(
    recipeCache.upsertFull({
      userId,
      recipeId: favorite.recipeId,
      source: favorite.source,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      videoUrl: recipe.videoUrl,
      nutrition: recipe.nutrition,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      nutritionCoverage: recipe.nutritionCoverage,
      favoriteId: favorite.id,
    }),
  );

  return favorite;
}

// UC-10. Có mạng: lấy danh sách rồi làm mới cache theo quy tắc ghi (3) — CHỈ
// title/image của dòng đã tồn tại. Mất mạng: hiển thị từ cache (luồng 2a), và
// chỉ cho trang đầu vì cache không có cursor của server.
export async function listFavorites(params: {
  userId: number;
  isOnline: boolean;
  cursor?: number;
  limit?: number;
}): Promise<FavoriteListResult> {
  const { userId, isOnline, cursor, limit } = params;

  if (!isOnline) {
    return readFavoritesFromCache(userId, cursor);
  }

  let page: FavoriteListResponse;
  try {
    page = await favoriteApi.list(cursor, limit);
  } catch (error) {
    if (isNetworkFailure(error)) {
      return readFavoritesFromCache(userId, cursor);
    }
    throw error;
  }

  await ignoreCacheError(
    Promise.all(
      page.data.map((item) =>
        recipeCache.updateTitleImageIfExists(
          userId,
          item.recipeId,
          item.source,
          item.title,
          item.imageUrl,
          item.id,
        ),
      ),
    ),
  );

  return { origin: 'network', data: page.data, meta: page.meta };
}

async function readFavoritesFromCache(
  userId: number,
  cursor?: number,
): Promise<FavoriteListResult> {
  // Trang sau chỉ có ý nghĩa với cursor của server; ngoại tuyến coi như hết dữ liệu.
  if (cursor !== undefined) {
    return { origin: 'cache', data: [], meta: OFFLINE_META };
  }

  const rows = await recipeCache.listByUser(userId);
  if (rows.length === 0) {
    throw new OfflineEmptyCacheError();
  }

  return {
    origin: 'cache',
    data: rows.map((row) => ({
      favoriteId: row.favoriteId,
      recipeId: row.recipeId,
      source: row.source,
      title: row.title,
      imageUrl: row.imageUrl,
      cachedAt: row.cachedAt,
    })),
    meta: OFFLINE_META,
  };
}

// UC-11. Server trả 204 kể cả khi bản ghi đã bị bỏ lưu từ thiết bị khác
// (ngoại lệ 2a), nên cứ xoá dòng cache sau đó. Chỉ xoá cache khi server đã
// nhận, tránh trường hợp mất cache mà trên server vẫn còn yêu thích.
export async function removeFavorite(params: {
  userId: number;
  favoriteId: number;
  recipeId: string;
  source: RecipeSource;
}): Promise<void> {
  const { userId, favoriteId, recipeId, source } = params;
  await favoriteApi.remove(favoriteId);
  await ignoreCacheError(recipeCache.remove(userId, recipeId, source));
}

// Logout hoặc chuyển tài khoản: xoá cache của tài khoản hiện tại để tài khoản
// mới không đọc được dữ liệu cũ (ghi chú cuối Mục 7.12).
export async function clearCacheForUser(userId: number): Promise<void> {
  await recipeCache.clearForUser(userId);
}
