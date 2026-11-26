import type { ShoppingItem } from '@/types/shopping.types';

export type RecipeGroup = {
  key: string;
  title: string;
  // Dòng chưa mua, hiển thị trong khu vực công thức.
  pending: ShoppingItem[];
  // Tổng số dòng của công thức (kể cả đã mua) — để ghi "2 cần mua / 5 nguyên liệu".
  total: number;
};

export type GroupedShopping = {
  mine: ShoppingItem[];
  recipes: RecipeGroup[];
  bought: ShoppingItem[];
};

// Khoá nhóm hiển thị là cặp (source_recipe_id, source).
export function recipeGroupKey(item: ShoppingItem): string | null {
  if (!item.sourceRecipeId) return null;
  return `${item.source ?? ''}:${item.sourceRecipeId}`;
}

// Cùng thứ tự với backend: mới thêm trước. Nhờ thứ tự này cố định, bỏ tick
// một dòng thì nó quay về đúng vị trí cũ trong khu vực ban đầu.
export function sortShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => {
    const byTime = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return byTime !== 0 ? byTime : b.id - a.id;
  });
}

// Chia danh sách thành: "Của tôi" → từng khu vực công thức → "Đã mua".
export function groupShoppingItems(items: ShoppingItem[]): GroupedShopping {
  const mine: ShoppingItem[] = [];
  const bought: ShoppingItem[] = [];
  const recipeMap = new Map<string, RecipeGroup>();

  for (const item of sortShoppingItems(items)) {
    const key = recipeGroupKey(item);
    if (key) {
      let group = recipeMap.get(key);
      if (!group) {
        group = {
          key,
          title: item.recipeTitleSnapshot ?? 'Công thức',
          pending: [],
          total: 0,
        };
        recipeMap.set(key, group);
      }
      group.total += 1;
      if (!item.checked) group.pending.push(item);
    } else if (!item.checked) {
      mine.push(item);
    }
    if (item.checked) bought.push(item);
  }

  // Khu vực công thức mà mọi dòng đã mua hết thì không hiện nữa.
  const recipes = [...recipeMap.values()].filter((g) => g.pending.length > 0);
  return { mine, recipes, bought };
}
