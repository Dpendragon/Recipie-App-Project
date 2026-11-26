import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeAggregatorService } from './recipe-aggregator.service';
import { LocalDbProvider } from './providers/local-db.provider';
import { SpoonacularProvider } from './providers/spoonacular.provider';

// PrismaModule là @Global nên không cần import ở đây.
// ReviewsModule chỉ để dùng ReviewsService.getRatingSummary() (một chiều, không vòng).
// NutritionModule để tính dinh dưỡng sau khi tạo công thức.
@Module({
  imports: [ReviewsModule, NutritionModule],
  controllers: [RecipesController],
  providers: [
    RecipesService,
    RecipeAggregatorService,
    LocalDbProvider,
    SpoonacularProvider,
  ],
})
export class RecipesModule {}
