import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { FromRecipeQueryDto } from './dto/from-recipe-query.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { ShoppingItemsService } from './shopping-items.service';

// Kiểu tối thiểu của req.user (do JwtStrategy.validate() trả về).
type AuthUser = { id: number };

// Tất cả route ở đây đều cần JWT (JwtAuthGuard là guard toàn cục).
@Controller('shopping-items')
export class ShoppingItemsController {
  constructor(private readonly shoppingItemsService: ShoppingItemsService) {}

  // GET /shopping-items
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.shoppingItemsService.findAll(user.id);
  }

  // POST /shopping-items
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateShoppingItemDto) {
    return this.shoppingItemsService.create(user.id, dto);
  }

  // POST /shopping-items/from-recipe/:id?source=LOCAL|SPOONACULAR
  // id để dạng chuỗi vì công thức Spoonacular cũng có id riêng.
  @Post('from-recipe/:id')
  addFromRecipe(
    @CurrentUser() user: AuthUser,
    @Param('id') recipeId: string,
    @Query() query: FromRecipeQueryDto,
  ) {
    return this.shoppingItemsService.addFromRecipe(
      user.id,
      recipeId,
      query.source,
    );
  }

  // PATCH /shopping-items/:id — chỉ sửa checked, note
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShoppingItemDto,
  ) {
    return this.shoppingItemsService.update(user.id, id, dto);
  }

  // DELETE /shopping-items/:id — luôn trả 204, kể cả khi dòng không tồn tại
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.shoppingItemsService.remove(user.id, id);
  }
}
