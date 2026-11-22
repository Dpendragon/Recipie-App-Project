import type { RecipeSource } from './shopping.types';

export type Favorite = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  createdAt: string;
};

// GET /favorites trả về theo kiểu phân trang con trỏ.
export type FavoritesPage = {
  data: Favorite[];
  meta: { nextCursor: string | null; hasMore: boolean };
};
