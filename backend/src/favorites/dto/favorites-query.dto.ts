import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Query ?cursor=<id dòng cuối đã thấy>&limit=20 (phân trang keyset, xem ghi chú
// phân trang Nhóm A trong tài liệu).
export class FavoritesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'cursor phải là số nguyên' })
  @Min(1, { message: 'cursor phải lớn hơn 0' })
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(50, { message: 'limit tối đa là 50' })
  limit?: number;
}
