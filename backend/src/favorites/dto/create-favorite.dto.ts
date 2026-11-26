import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RecipeSource } from '../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

// POST /favorites. Khác reviews: source nằm trong body chứ không ở query,
// vì endpoint không mang :id của công thức.
export class CreateFavoriteDto {
  // recipe_id là VARCHAR(50) vì dùng chung cho LOCAL và Spoonacular.
  @Transform(trim)
  @IsString({ message: 'Mã công thức không hợp lệ' })
  @IsNotEmpty({ message: 'Thiếu mã công thức' })
  @MaxLength(50, { message: 'Mã công thức tối đa 50 ký tự' })
  recipeId!: string;

  @IsEnum(RecipeSource, {
    message: 'Nguồn công thức phải là LOCAL hoặc SPOONACULAR',
  })
  source!: RecipeSource;

  // Bắt buộc với SPOONACULAR nhưng không thể đánh @IsNotEmpty ở đây: với LOCAL
  // server tự lấy snapshot từ bảng recipes. Việc kiểm tra nằm trong service.
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
