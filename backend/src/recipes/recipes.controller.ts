import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipeDetailQueryDto } from './dto/recipe-detail-query.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // Quy ước: route tĩnh (/recipes/mine, /recipes/search) phải khai TRƯỚC @Get(':id').

  @Get(':id')
  getById(@Param('id') id: string, @Query() query: RecipeDetailQueryDto) {
    return this.recipesService.getById(id, query.source);
  }
}
