// Kiểu dữ liệu danh mục nguyên liệu chuẩn, bám theo response của
// GET /ingredients/autocomplete.

export interface IngredientSuggestion {
  // id dòng ingredients; server tự đối chiếu khi lưu công thức nên mobile chỉ
  // dùng gợi ý này để điền form, không gửi id lên khi đăng công thức.
  id: number;
  nameVi: string;
  nameEn: string;
  // Đơn vị thường dùng, gợi ý sẵn cho ô "đơn vị"; null khi danh mục chưa có.
  commonUnit: string | null;
}

// Một nguyên liệu người dùng đã chọn để tìm công thức.
export interface SelectedIngredient {
  nameVi: string;
  nameEn: string;
}

// Một dòng gợi ý dùng ở màn tìm kiếm: cùng response với IngredientSuggestion.
export type Ingredient = IngredientSuggestion;
