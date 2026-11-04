import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RecipeSource } from '../../generated/prisma/enums';

// Bỏ khoảng trắng 2 đầu; chuỗi rỗng sau khi trim coi như "không gửi".
const trimOrUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

// ĐỔI MÓN (UC-23): chỉ thay công thức, ngày và buổi ăn giữ nguyên.
// Các trường khác (vd date, mealSlot) bị ValidationPipe (whitelist: true) loại bỏ.
export class UpdateMealPlanDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Mã công thức không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn công thức' })
  @MaxLength(50, { message: 'Mã công thức tối đa 50 ký tự' })
  recipeId!: string;

  @IsEnum(RecipeSource, {
    message: 'Nguồn công thức phải là LOCAL hoặc SPOONACULAR',
  })
  source!: RecipeSource;

  // Snapshot do client gửi, CHỈ dùng khi source = SPOONACULAR (bắt buộc có
  // titleSnapshot). Với LOCAL, server tự lấy từ bảng recipes và bỏ qua 2 trường này.
  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString({ message: 'Tên món không hợp lệ' })
  @MaxLength(255, { message: 'Tên món tối đa 255 ký tự' })
  titleSnapshot?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString({ message: 'Ảnh món không hợp lệ' })
  @MaxLength(500, { message: 'Đường dẫn ảnh tối đa 500 ký tự' })
  imageSnapshot?: string;
}
