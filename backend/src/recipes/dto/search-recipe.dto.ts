import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LOCAL_MAX_CANDIDATES } from '../recipes.constants';

// Query của GET /recipes/search
export class SearchRecipeDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString({ message: 'Tên món không hợp lệ' })
  @MaxLength(100, { message: 'Tên món tối đa 100 ký tự' })
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? [
          ...new Set(
            value
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean),
          ),
        ]
      : value,
  )
  @IsArray({ message: 'Danh sách nguyên liệu không hợp lệ' })
  @ArrayMaxSize(20, { message: 'Tối đa 20 nguyên liệu' })
  @IsString({ each: true, message: 'Nguyên liệu không hợp lệ' })
  @MaxLength(100, { each: true, message: 'Tên nguyên liệu tối đa 100 ký tự' })
  ingredients: string[] = [];

  @IsOptional()
  @IsIn(['vegetarian', 'vegan', 'gluten-free'], {
    message: 'Chế độ ăn không hợp lệ',
  })
  diet?: string;

  @IsOptional()
  @Type(() => Number)
  @IsIn([15, 30, 60], { message: 'Thời gian nấu chỉ nhận 15, 30 hoặc 60 phút' })
  maxReadyTime?: number;

  @IsOptional()
  @IsIn(['main course', 'side dish', 'soup', 'dessert'], {
    message: 'Loại món không hợp lệ',
  })
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(20, { message: 'limit tối đa là 20' })
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'cursor phải là số nguyên' })
  @Min(0, { message: 'cursor không được âm' })
  @Max(LOCAL_MAX_CANDIDATES, { message: `cursor tối đa ${LOCAL_MAX_CANDIDATES}` })
  cursor?: number;
}
