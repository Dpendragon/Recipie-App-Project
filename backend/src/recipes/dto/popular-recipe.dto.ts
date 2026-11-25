import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// GET /recipes/popular?limit=5
export class PopularRecipeDto {
  // Số món trả về
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(20, { message: 'limit tối đa là 20' })
  limit: number = 5;
}
