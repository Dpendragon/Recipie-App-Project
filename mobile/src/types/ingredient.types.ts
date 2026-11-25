// Một nguyên liệu người dùng đã chọn để tìm công thức.
export interface SelectedIngredient {
  nameVi: string;
  nameEn: string;
}

// Một dòng gợi ý từ GET /ingredients/autocomplete.
export interface Ingredient extends SelectedIngredient {
  id: number;
}
