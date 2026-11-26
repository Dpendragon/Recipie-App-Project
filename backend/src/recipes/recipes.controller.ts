import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RecipesService } from './recipes.service';
import { RecipeAggregatorService } from './recipe-aggregator.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeDetailQueryDto } from './dto/recipe-detail-query.dto';
import { PopularRecipeDto } from './dto/popular-recipe.dto';
import { SearchRecipeDto } from './dto/search-recipe.dto';

// req.user do JwtStrategy.validate() gán (users trừ passwordHash).
type AuthUser = { id: number };

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly aggregator: RecipeAggregatorService,
  ) {}

  // Quy ước: route tĩnh (/recipes/search, /recipes/popular, /recipes/mine)
  // phải khai TRƯỚC @Get(':id').

  // POST /recipes (UC-17)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, dto);
  }

  // GET /recipes/search?name=&ingredients=&diet=&maxReadyTime=&type=&limit=&cursor=
  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query() query: SearchRecipeDto) {
    if (!query.name && query.ingredients.length === 0) {
      throw new BadRequestException(
        'Vui lòng nhập tên món hoặc chọn ít nhất 1 nguyên liệu',
      );
    }
    return this.aggregator.search(query, user.id);
  }

  // GET /recipes/popular?limit=5
  @Get('popular')
  popular(@CurrentUser() user: AuthUser, @Query() query: PopularRecipeDto) {
    return this.aggregator.popular(query.limit, user.id);
  }

  // GET /recipes/mine?cursor=&limit= (UC-18)
  @Get('mine')
  listMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.recipesService.listMine(user.id, query);
  }

  // GET /recipes/:id?source= (UC-08)
  @Get(':id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: RecipeDetailQueryDto,
  ) {
    return this.recipesService.getById(id, query.source, user.id);
  }

  // PATCH /recipes/:id (UC-19). Chỉ nguồn LOCAL mới sửa được nên không có ?source=.
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(user.id, id, dto);
  }

  // DELETE /recipes/:id (UC-20)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.recipesService.remove(user.id, id);
  }
}
