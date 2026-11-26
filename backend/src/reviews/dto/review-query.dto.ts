import { IsEnum } from 'class-validator';
import { RecipeSource } from '../../generated/prisma/enums';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

// source bắt buộc vì recipe_id có thể trùng giữa LOCAL và SPOONACULAR
// (ràng buộc UNIQUE(user_id, recipe_id, source) của recipe_reviews).
export class ReviewSourceQueryDto {
  @IsEnum(RecipeSource, {
    message: 'Nguồn công thức phải là LOCAL hoặc SPOONACULAR',
  })
  source!: RecipeSource;
}

// GET /recipes/:id/reviews?source=&cursor=&limit=
export class ListReviewsQueryDto extends PaginationQueryDto {
  @IsEnum(RecipeSource, {
    message: 'Nguồn công thức phải là LOCAL hoặc SPOONACULAR',
  })
  source!: RecipeSource;
}
