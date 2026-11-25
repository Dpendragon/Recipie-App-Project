import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PopularRecipeDto } from './dto/popular-recipe.dto';
import { SearchRecipeDto } from './dto/search-recipe.dto';
import { RecipeAggregatorService } from './recipe-aggregator.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly aggregator: RecipeAggregatorService) {}

  // GET /recipes/search?name=&ingredients=&diet=&maxReadyTime=&type=&limit=&cursor=
  @Get('search')
  search(@Query() query: SearchRecipeDto, @CurrentUser() user: { id: number }) {
    if (!query.name && query.ingredients.length === 0) {
      throw new BadRequestException('Vui lòng nhập tên món hoặc chọn ít nhất 1 nguyên liệu');
    }
    return this.aggregator.search(query, user.id);
  }

  // GET /recipes/popular?limit=5
  @Get('popular')
  popular(@Query() query: PopularRecipeDto, @CurrentUser() user: { id: number }) {
    return this.aggregator.popular(query.limit, user.id);
  }
}
