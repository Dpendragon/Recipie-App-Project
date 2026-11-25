import type {
  DietFilter,
  DishTypeFilter,
  MaxReadyTimeFilter,
  SearchFilters,
} from '@/types/recipe.types';

// Một lựa chọn trong bộ lọc
interface FilterOption<T> {
  label: string;
  value: T | null;
}

// Các lựa chọn trong sheet "Lọc món"
export const DIET_OPTIONS: FilterOption<DietFilter>[] = [
  { label: 'Không giới hạn', value: null },
  { label: 'Ăn chay', value: 'vegetarian' },
  { label: 'Thuần chay', value: 'vegan' },
  { label: 'Không gluten', value: 'gluten-free' },
];

export const TIME_OPTIONS: FilterOption<MaxReadyTimeFilter>[] = [
  { label: 'Bất kỳ', value: null },
  { label: '≤ 15 phút', value: 15 },
  { label: '≤ 30 phút', value: 30 },
  { label: '≤ 60 phút', value: 60 },
];

export const TYPE_OPTIONS: FilterOption<DishTypeFilter>[] = [
  { label: 'Tất cả', value: null },
  { label: 'Món chính', value: 'main course' },
  { label: 'Món phụ', value: 'side dish' },
  { label: 'Canh & súp', value: 'soup' },
  { label: 'Tráng miệng', value: 'dessert' },
];

// Bộ lọc mặc định.
export const EMPTY_FILTERS: SearchFilters = { diet: null, maxReadyTime: null, type: null };

// Nhãn của các bộ lọc đang bật
export function getActiveFilterChips(filters: SearchFilters): { key: keyof SearchFilters; label: string }[] {
  const chips: { key: keyof SearchFilters; label: string }[] = [];
  const diet = DIET_OPTIONS.find((o) => o.value === filters.diet);
  const time = TIME_OPTIONS.find((o) => o.value === filters.maxReadyTime);
  const type = TYPE_OPTIONS.find((o) => o.value === filters.type);
  if (filters.diet !== null && diet) chips.push({ key: 'diet', label: diet.label });
  if (filters.maxReadyTime !== null && time) chips.push({ key: 'maxReadyTime', label: time.label });
  if (filters.type !== null && type) chips.push({ key: 'type', label: type.label });
  return chips;
}

// Có bộ lọc nào đang bật không
export function hasActiveFilters(filters: SearchFilters): boolean {
  return getActiveFilterChips(filters).length > 0;
}
