import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RecipesService } from './recipes.service';
import { RecipeDetailQueryDto } from './dto/recipe-detail-query.dto';

// req.user do JwtStrategy.validate() gán (users trừ passwordHash).
type AuthUser = { id: number };

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // Quy ước: route tĩnh (/recipes/mine, /recipes/search) phải khai TRƯỚC @Get(':id').

  @Get(':id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: RecipeDetailQueryDto,
  ) {
    return this.recipesService.getById(id, query.source, user.id);
  }
}
