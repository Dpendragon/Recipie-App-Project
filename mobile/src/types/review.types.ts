// Kiểu dữ liệu đánh giá, bám theo module reviews của backend.

import type { PageMeta, Paginated } from '@/types/pagination.types';
import type { RecipeSource } from '@/types/recipe.types';

// Điểm trung bình của một công thức. Công thức chưa có đánh giá (hoặc không tồn
// tại) trả { average: 0, count: 0 } chứ không phải 404.
export interface ReviewSummary {
  average: number;
  count: number;
}

// Server chỉ trả tên tác giả; tác giả đã xoá mềm hiển thị là "Người dùng".
export interface ReviewAuthor {
  name: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  // ISO datetime string.
  createdAt: string;
  updatedAt: string;
  author: ReviewAuthor;
}

// Một dòng trong "Đánh giá của tôi": gộp đánh giá với tên/ảnh công thức.
export interface MyReview {
  id: number;
  recipeId: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  rating: number;
  // Nhận xét đầy đủ, mobile tự rút gọn khi hiển thị.
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// Body của POST /recipes/:id/reviews (tạo mới và sửa dùng chung một endpoint
// upsert). Với SPOONACULAR phải gửi titleSnapshot (thiếu thì 400);
// với LOCAL server tự lấy snapshot từ bảng recipes.
export interface UpsertReviewRequest {
  rating: number;
  comment?: string;
  titleSnapshot?: string;
  imageSnapshot?: string;
}

export interface UpsertReviewResponse {
  review: Review;
  summary: ReviewSummary;
}

// GET /recipes/:id/reviews: điểm trung bình + đánh giá của mình +
// đánh giá của người khác (data đã loại đánh giá của chính mình).
export interface RecipeReviewsResponse {
  summary: ReviewSummary;
  mine: Review | null;
  data: Review[];
  meta: PageMeta;
}

export type MyReviewListResponse = Paginated<MyReview>;
