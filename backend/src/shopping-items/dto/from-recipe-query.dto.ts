import { IsEnum } from 'class-validator';
import { RecipeSource } from '../../generated/prisma/enums';

// Query ?source=LOCAL | SPOONACULAR
export class FromRecipeQueryDto {
  @IsEnum(RecipeSource, {
    message: 'Nguồn công thức phải là LOCAL hoặc SPOONACULAR',
  })
  source!: RecipeSource;
}
