import { useContext } from 'react';
import { SearchContext } from '@/contexts/SearchContext';

// Truy cập tiêu chí tìm kiếm dùng chung
export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch phải được gọi bên trong <SearchProvider>');
  }
  return ctx;
}
