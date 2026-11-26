export type RecipeSource = 'LOCAL' | 'SPOONACULAR';

// 1 dòng trong danh sách mua sắm (bảng shopping_items).
export type ShoppingItem = {
  id: number;
  name: string;
  quantity: string | null;
  note: string | null;
  checked: boolean;
  // Cả 2 đều null nếu là dòng thêm tay (khu vực "Của tôi").
  sourceRecipeId: string | null;
  source: RecipeSource | null;
  recipeTitleSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
};

// POST /shopping-items
export type CreateShoppingItemRequest = {
  name: string;
  quantity?: string;
};

// PATCH /shopping-items/:id — chỉ sửa checked và note.
export type UpdateShoppingItemRequest = {
  checked?: boolean;
  note?: string | null;
};
