import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Bỏ khoảng trắng 2 đầu; chuỗi rỗng sau khi trim coi như "không gửi".
const trimOrUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class CreateShoppingItemDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tên nguyên liệu không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập tên nguyên liệu' })
  @MaxLength(255, { message: 'Tên nguyên liệu tối đa 255 ký tự' })
  name!: string;

  // Số lượng là chuỗi tự do, vd "400g", "1 chục".
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString({ message: 'Số lượng không hợp lệ' })
  @MaxLength(100, { message: 'Số lượng tối đa 100 ký tự' })
  quantity?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString({ message: 'Ghi chú không hợp lệ' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;
}
