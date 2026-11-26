import { IsEnum } from 'class-validator';
import { RecipeSource } from '../../generated/prisma/enums';

export class RecipeDetailQueryDto {
  @IsEnum(RecipeSource, {
    message: 'Nguồn công thức phải là LOCAL hoặc SPOONACULAR',
  })
  source!: RecipeSource;
}
