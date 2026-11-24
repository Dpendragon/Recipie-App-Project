import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Dùng chung cho các danh sách "Nhóm A" (favorites, reviews/mine, recipes/mine)
// theo ghi chú phân trang ở Mục 8: cursor-based, không dùng offset.
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export class PaginationQueryDto {
  // cursor = id của dòng cuối cùng ở trang trước (number | null khi trả về).
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'cursor phải là số nguyên' })
  @Min(1, { message: 'cursor phải từ 1 trở lên' })
  cursor?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải từ 1 trở lên' })
  @Max(MAX_PAGE_LIMIT, { message: `limit tối đa là ${MAX_PAGE_LIMIT}` })
  limit?: number = DEFAULT_PAGE_LIMIT;
}

// Service có thể được gọi trực tiếp (unit test) nên không dựa hoàn toàn vào
// giá trị mặc định của DTO.
export function resolveLimit(limit?: number): number {
  if (limit === undefined) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT);
}
