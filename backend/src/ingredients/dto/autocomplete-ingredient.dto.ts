import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Query của GET /ingredients/autocomplete?q=ca&limit=10
export class AutocompleteIngredientDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Từ khoá không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập từ khoá' })
  @MaxLength(50, { message: 'Từ khoá tối đa 50 ký tự' })
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(20, { message: 'limit tối đa là 20' })
  limit: number = 10;
}
