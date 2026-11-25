import { Module } from '@nestjs/common';
import { LocalDbProvider } from './providers/local-db.provider';
import { SpoonacularProvider } from './providers/spoonacular.provider';
import { RecipeAggregatorService } from './recipe-aggregator.service';
import { RecipesController } from './recipes.controller';

@Module({
  controllers: [RecipesController],
  providers: [LocalDbProvider, SpoonacularProvider, RecipeAggregatorService],
})
export class RecipesModule {}
