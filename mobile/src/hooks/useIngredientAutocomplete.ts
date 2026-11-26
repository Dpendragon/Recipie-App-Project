import { isCancel } from 'axios';
import { useEffect, useState } from 'react';
import { autocompleteIngredients } from '@/services/api/ingredientApi';
import type { Ingredient } from '@/types/ingredient.types';
import { useDebouncedValue } from './useDebouncedValue';

const DEBOUNCE_MS = 250;
const MAX_QUERY_LENGTH = 50;

// Gợi ý nguyên liệu theo chữ đang gõ trong ô tìm kiếm.
export function useIngredientAutocomplete(query: string) {
  const typed = query.trim().slice(0, MAX_QUERY_LENGTH);
  const debounced = useDebouncedValue(typed, DEBOUNCE_MS);

  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debounced) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    autocompleteIngredients(debounced, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSuggestions(result);
      })
      .catch((error) => {
        if (!isCancel(error)) setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  // Xoá hết chữ thì ẩn gợi ý ngay
  return { suggestions: typed ? suggestions : [], loading };
}
