import { isCancel } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { searchRecipes } from '@/services/api/recipeApi';
import type { SelectedIngredient } from '@/types/ingredient.types';
import type {
  RecipeListMeta,
  RecipeSummary,
  SearchFilters,
  SearchRecipesParams,
} from '@/types/recipe.types';
import { getApiErrorMessage } from '@/utils/helpers';

const PAGE_SIZE = 10;

// Tiêu chí tìm kiếm
export interface SearchCriteria {
  name: string;
  ingredients: SelectedIngredient[];
  filters: SearchFilters;
}

// idle: chưa có tên hoặc nguyên liệu nên không gọi API
export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

// Gọi GET /recipes/search theo tiêu chí
export function useRecipeSearch(criteria: SearchCriteria) {
  const name = criteria.name.trim();
  const { diet, maxReadyTime, type } = criteria.filters;
  const ingredientsKey = JSON.stringify(criteria.ingredients.map((i) => i.nameEn));

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [meta, setMeta] = useState<RecipeListMeta | null>(null);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Cờ chặn gọi trùng: onEndReached của FlatList có thể bắn 2 lần liên tiếp trên Android
  const loadingMoreRef = useRef(false);
  // Controller và tham số của "lượt tìm" hiện tại, để loadMore dùng chung
  const sessionRef = useRef<{ controller: AbortController; params: SearchRecipesParams } | null>(null);

  useEffect(() => {
    const ingredientNames: string[] = JSON.parse(ingredientsKey);

    if (!name && ingredientNames.length === 0) {
      sessionRef.current = null;
      setRecipes([]);
      setMeta(null);
      setError(null);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    const params: SearchRecipesParams = {
      name: name || undefined,
      ingredients: ingredientNames,
      diet,
      maxReadyTime,
      type,
      limit: PAGE_SIZE,
    };
    sessionRef.current = { controller, params };

    setRecipes([]);
    setMeta(null);
    setError(null);
    setStatus('loading');

    searchRecipes(params, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setRecipes(response.data);
        setMeta(response.meta);
        setStatus('success');
      })
      .catch((err) => {
        if (isCancel(err) || controller.signal.aborted) return;
        setError(getApiErrorMessage(err));
        setStatus('error');
      });

    return () => controller.abort(); 
  }, [name, ingredientsKey, diet, maxReadyTime, type, reloadKey]);

  // Tải trang sau (gọi từ onEndReached)
  const loadMore = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || loadingMoreRef.current || status !== 'success') return;
    if (!meta?.hasMore || meta.nextCursor === null) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const response = await searchRecipes(
        { ...session.params, cursor: meta.nextCursor },
        session.controller.signal,
      );
      if (session.controller.signal.aborted) return;
      setRecipes((current) => [...current, ...response.data]);
      setMeta(response.meta);
    } catch (err) {
      if (!isCancel(err) && !session.controller.signal.aborted) setError(getApiErrorMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [status, meta]);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    recipes,
    meta,
    status,
    error,
    loadingMore,
    hasMore: meta?.hasMore ?? false,
    loadMore,
    retry,
  };
}
