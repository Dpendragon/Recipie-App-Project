import {
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
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeDetailQueryDto } from './dto/recipe-detail-query.dto';

// req.user do JwtStrategy.validate() gán (users trừ passwordHash).
type AuthUser = { id: number };

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // Quy ước: route tĩnh (/recipes/mine, /recipes/search) phải khai TRƯỚC @Get(':id').

  // POST /recipes (UC-17)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.recipesService.listMine(user.id, query);
  }

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
