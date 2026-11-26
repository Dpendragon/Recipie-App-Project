// Chế độ ăn và loại món của công thức: hai cột recipes.diets và
// recipes.dish_types (Mục 7.2) mà UC-07 dùng để lọc, nên value phải là chuỗi
// tiếng Anh đúng như dữ liệu seed (backend/prisma/seed.ts). Nhãn tiếng Việt
// lấy từ Figma frame 2003:10409, lớp Form/DietTags và Form/DishTypeTags.

export type RecipeTag = {
  // Giá trị gửi lên API và lưu xuống DB.
  value: string;
  label: string;
};

export const DIET_TAGS: readonly RecipeTag[] = [
  { value: 'vegetarian', label: 'Chay' },
  { value: 'vegan', label: 'Thuần chay' },
  { value: 'gluten-free', label: 'Không gluten' },
  { value: 'low-carb', label: 'Ít tinh bột' },
  { value: 'keto', label: 'Keto' },
];

export const DISH_TYPE_TAGS: readonly RecipeTag[] = [
  { value: 'main course', label: 'Món chính' },
  { value: 'soup', label: 'Món canh' },
  { value: 'appetizer', label: 'Khai vị' },
  { value: 'side dish', label: 'Món phụ' },
  { value: 'salad', label: 'Salad' },
  { value: 'dessert', label: 'Tráng miệng' },
];
