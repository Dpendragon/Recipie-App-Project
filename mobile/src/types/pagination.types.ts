// Phân trang cursor-based dùng chung cho các danh sách một nguồn của backend
// (favorites, reviews/mine, recipes/mine): server trả { data, meta }.

export interface PageMeta {
  // id của dòng cuối trang hiện tại; null khi đã hết dữ liệu.
  nextCursor: number | null;
  hasMore: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
