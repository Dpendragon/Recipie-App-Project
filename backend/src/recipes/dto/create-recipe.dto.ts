import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Bước thực hiện lưu vào cột TEXT, mỗi bước một dòng: bỏ dòng trắng ngay tại DTO
// để ["", " "] cũng bị ArrayMinSize chặn, và để splitSteps đọc lại đúng số bước.
const trimLines = ({ value }: { value: unknown }): unknown => {
  if (!Array.isArray(value)) return value;
  return value
    .map((line) => (typeof line === 'string' ? line.trim() : line))
    .filter((line) => line !== '');
};

export class CreateRecipeIngredientDto {
  @Transform(trim)
  @IsString({ message: 'Tên nguyên liệu không hợp lệ' })
  @IsNotEmpty({ message: 'Tên nguyên liệu tiếng Việt là bắt buộc' })
  @MaxLength(255, { message: 'Tên nguyên liệu tối đa 255 ký tự' })
  nameVi!: string;

  // Tuỳ chọn, dùng để đối chiếu danh mục dinh dưỡng.
  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'Tên nguyên liệu tiếng Anh không hợp lệ' })
  @MaxLength(255, { message: 'Tên nguyên liệu tiếng Anh tối đa 255 ký tự' })
  nameEn?: string;

  // quantity là DECIMAL(10,2), NULL khi không định lượng được.
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0, { message: 'Số lượng không được âm' })
  quantity?: number;

  @Transform(trim)
  @IsOptional()
  @IsString({ message: 'Đơn vị không hợp lệ' })
  @MaxLength(50, { message: 'Đơn vị tối đa 50 ký tự' })
  unit?: string;
}

// Dữ liệu đăng công thức cá nhân. Không có description vì bảng recipes
// không có cột này.
export class CreateRecipeDto {
  @Transform(trim)
  @IsString({ message: 'Tên món không hợp lệ' })
  @IsNotEmpty({ message: 'Tên món là bắt buộc' })
  @MaxLength(255, { message: 'Tên món tối đa 255 ký tự' })
  title!: string;

  @Type(() => Number)
  @IsInt({ message: 'Số khẩu phần phải là số nguyên' })
  @Min(1, { message: 'Số khẩu phần phải từ 1 trở lên' })
  servings!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'Thời gian nấu phải là số nguyên' })
  @Min(1, { message: 'Thời gian nấu phải từ 1 phút trở lên' })
  readyInMinutes?: number;

  @IsOptional()
  @IsArray({ message: 'Chế độ ăn phải là danh sách' })
  @IsString({ each: true, message: 'Chế độ ăn không hợp lệ' })
  diets?: string[];

  @IsOptional()
  @IsArray({ message: 'Loại món phải là danh sách' })
  @IsString({ each: true, message: 'Loại món không hợp lệ' })
  dishTypes?: string[];

  @Transform(trimLines)
  @IsArray({ message: 'Các bước thực hiện phải là danh sách' })
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 bước thực hiện' })
  @IsString({ each: true, message: 'Bước thực hiện không hợp lệ' })
  steps!: string[];

  @Transform(trim)
  @IsOptional()
  @IsUrl({}, { message: 'Ảnh món ăn phải là đường dẫn hợp lệ' })
  @MaxLength(500, { message: 'Ảnh món ăn tối đa 500 ký tự' })
  imageUrl?: string;

  @Transform(trim)
  @IsOptional()
  @IsUrl({}, { message: 'Video hướng dẫn phải là đường dẫn hợp lệ' })
  @MaxLength(500, { message: 'Video hướng dẫn tối đa 500 ký tự' })
  videoUrl?: string;

  @IsArray({ message: 'Nguyên liệu phải là danh sách' })
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 nguyên liệu' })
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients!: CreateRecipeIngredientDto[];
}
