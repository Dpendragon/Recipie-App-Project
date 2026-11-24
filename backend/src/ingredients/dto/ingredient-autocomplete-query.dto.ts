import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export const AUTOCOMPLETE_MAX_LIMIT = 10;

export class IngredientAutocompleteQueryDto {
  // q rỗng/thiếu vẫn hợp lệ: service trả mảng rỗng thay vì báo lỗi.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'Từ khoá tìm kiếm không hợp lệ' })
  q?: string;

  // Query string luôn là chuỗi: ép về số trước khi validate.
  // Không chặn trần ở đây — service tự cắt về AUTOCOMPLETE_MAX_LIMIT.
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsOptional()
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit phải từ 1 trở lên' })
  limit?: number;
}
