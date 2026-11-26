// Kiểu dữ liệu yêu thích, bám theo response của module favorites.

import type { Paginated } from '@/types/pagination.types';
import type { RecipeSource } from '@/types/recipe.types';

export interface Favorite {
  // id của DÒNG favorites, không phải id công thức. Mobile cần nó để gọi
  // DELETE /favorites/:id khi bỏ lưu.
  id: number;
  // Chuỗi để khớp recipe_id (VARCHAR) dùng chung cho LOCAL và Spoonacular.
  recipeId: string;
  source: RecipeSource;
  // Server ưu tiên dữ liệu sống của recipe LOCAL, chỉ rơi về snapshot khi công
  // thức gốc đã bị xoá, nên hai trường này luôn có giá trị hiển thị được.
  title: string;
  imageUrl: string | null;
  // ISO datetime string (server trả Date, JSON hoá thành chuỗi).
  createdAt: string;
}

// Body của POST /favorites. Với SPOONACULAR phải gửi titleSnapshot (thiếu thì
// 400); với LOCAL server tự lấy snapshot từ bảng recipes và bỏ qua giá trị gửi lên.
export interface CreateFavoriteRequest {
  recipeId: string;
  source: RecipeSource;
  titleSnapshot?: string;
  imageSnapshot?: string;
}

export type FavoriteListResponse = Paginated<Favorite>;
