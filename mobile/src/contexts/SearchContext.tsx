import { createContext, useCallback, useState, type PropsWithChildren } from 'react';
import { EMPTY_FILTERS } from '@/constants/searchFilters';
import type { SelectedIngredient } from '@/types/ingredient.types';
import type { SearchFilters } from '@/types/recipe.types';

export type SearchContextValue = {
  // Tiêu chí tìm kiếm hiện tại
  name: string;
  ingredients: SelectedIngredient[];
  filters: SearchFilters;

  setName: (name: string) => void;
  addIngredient: (ingredient: SelectedIngredient) => void;
  removeIngredient: (nameEn: string) => void;
  toggleIngredient: (ingredient: SelectedIngredient) => void;
  clearIngredients: () => void;
  setFilters: (filters: SearchFilters) => void;
  removeFilter: (key: keyof SearchFilters) => void;
  resetFilters: () => void;
  resetAll: () => void;
};

export const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: PropsWithChildren) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);

  // Thêm nguyên liệu; đã có (trùng nameEn) thì giữ nguyên.
  const addIngredient = useCallback((ingredient: SelectedIngredient) => {
    setIngredients((current) =>
      current.some((i) => i.nameEn === ingredient.nameEn) ? current : [...current, ingredient],
    );
  }, []);

  const removeIngredient = useCallback((nameEn: string) => {
    setIngredients((current) => current.filter((i) => i.nameEn !== nameEn));
  }, []);

  // Đã chọn thì bỏ, chưa chọn thì thêm.
  const toggleIngredient = useCallback((ingredient: SelectedIngredient) => {
    setIngredients((current) =>
      current.some((i) => i.nameEn === ingredient.nameEn)
        ? current.filter((i) => i.nameEn !== ingredient.nameEn)
        : [...current, ingredient],
    );
  }, []);

  const clearIngredients = useCallback(() => setIngredients([]), []);

  const removeFilter = useCallback((key: keyof SearchFilters) => {
    setFilters((current) => ({ ...current, [key]: null }));
  }, []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const resetAll = useCallback(() => {
    setName('');
    setIngredients([]);
    setFilters(EMPTY_FILTERS);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        name,
        ingredients,
        filters,
        setName,
        addIngredient,
        removeIngredient,
        toggleIngredient,
        clearIngredients,
        setFilters,
        removeFilter,
        resetFilters,
        resetAll,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
