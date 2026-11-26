import { isCancel } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { getPopularRecipes } from '@/services/api/recipeApi';
import type { RecipeSummary } from '@/types/recipe.types';
import { getApiErrorMessage } from '@/utils/helpers';

const POPULAR_LIMIT = 5; 

export type HomeFeedStatus = 'loading' | 'success' | 'error';

// Dữ liệu cho Trang chủ
export function useHomeFeed() {
  const [popular, setPopular] = useState<RecipeSummary[]>([]);
  const [status, setStatus] = useState<HomeFeedStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0); 

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    getPopularRecipes(POPULAR_LIMIT, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setPopular(response.data);
        setStatus('success');
      })
      .catch((err) => {
        if (isCancel(err) || controller.signal.aborted) return;
        setError(getApiErrorMessage(err));
        setStatus('error');
      });

    return () => controller.abort(); // rời Trang chủ thì huỷ request đang chạy
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { popular, status, error, reload };
}
