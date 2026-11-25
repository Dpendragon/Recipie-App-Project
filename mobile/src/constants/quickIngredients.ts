import type { SelectedIngredient } from '@/types/ingredient.types';

// Các chip chọn nhanh ở màn "Bếp bạn đang có gì?".
export const QUICK_INGREDIENT_GROUPS: { title: string; items: SelectedIngredient[] }[] = [
  {
    title: 'Thịt, cá & trứng',
    items: [
      { nameVi: 'Ức gà', nameEn: 'Chicken breast' },
      { nameVi: 'Thịt heo xay', nameEn: 'Ground pork' },
      { nameVi: 'Cá lóc', nameEn: 'Snakehead fish' },
      { nameVi: 'Trứng gà', nameEn: 'Chicken egg' },
    ],
  },
  {
    title: 'Rau củ & nấm',
    items: [
      { nameVi: 'Cà chua', nameEn: 'Tomato' },
      { nameVi: 'Cà rốt', nameEn: 'Carrot' },
      { nameVi: 'Rau muống', nameEn: 'Water spinach' },
      { nameVi: 'Nấm rơm', nameEn: 'Straw mushroom' },
    ],
  },
  {
    title: 'Gia vị quen thuộc',
    items: [
      { nameVi: 'Sả', nameEn: 'Lemongrass' },
      { nameVi: 'Ớt sừng', nameEn: 'Chili pepper' },
      { nameVi: 'Tỏi', nameEn: 'Garlic' },
      { nameVi: 'Nước mắm', nameEn: 'Fish sauce' },
      { nameVi: 'Đường trắng', nameEn: 'White sugar' },
      { nameVi: 'Dầu ăn', nameEn: 'Cooking oil' },
    ],
  },
];
