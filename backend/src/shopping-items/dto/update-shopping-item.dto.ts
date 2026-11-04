import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Chỉ cho sửa 2 trường: đã mua (checked) và ghi chú (note).
// Các trường khác (vd name) bị ValidationPipe (whitelist: true) loại bỏ.
export class UpdateShoppingItemDto {
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái đã mua phải là true hoặc false' })
  checked?: boolean;

  // Gửi null hoặc chuỗi rỗng = xoá ghi chú.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @ValidateIf((_obj, value) => value !== null && value !== undefined)
  @IsString({ message: 'Ghi chú không hợp lệ' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string | null;
}
