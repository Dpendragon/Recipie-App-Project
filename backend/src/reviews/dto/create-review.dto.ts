import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Dùng chung cho tạo mới và sửa vì endpoint là một upsert.
export class CreateReviewDto {
  // Prisma không khai báo CHECK nên 1-5 chỉ chặn được ở đây.
  @IsInt({ message: 'Số sao phải là số nguyên' })
  @Min(1, { message: 'Số sao phải từ 1 đến 5' })
  @Max(5, { message: 'Số sao phải từ 1 đến 5' })
  rating!: number;

  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'Nhận xét không hợp lệ' })
  @MaxLength(1000, { message: 'Nhận xét tối đa 1000 ký tự' })
  comment?: string;

  // Snapshot chỉ được dùng khi source = SPOONACULAR; với LOCAL server tự lấy
  // từ bảng recipes và bỏ qua dữ liệu client gửi.
  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'Tên công thức không hợp lệ' })
  @MaxLength(255, { message: 'Tên công thức tối đa 255 ký tự' })
  titleSnapshot?: string;

  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'Ảnh công thức không hợp lệ' })
  @MaxLength(500, { message: 'Ảnh công thức tối đa 500 ký tự' })
  imageSnapshot?: string;
}
