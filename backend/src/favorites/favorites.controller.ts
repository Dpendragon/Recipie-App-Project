import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import { FavoritesService } from './favorites.service';

// Kiểu tối thiểu của req.user (do JwtStrategy.validate() trả về).
type AuthUser = { id: number };

// Tất cả route ở đây đều cần JWT (JwtAuthGuard là guard toàn cục).
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // GET /favorites?cursor=&limit= (UC-10) — trả { data, meta: { nextCursor, hasMore } }
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: FavoritesQueryDto) {
    return this.favoritesService.findAll(user.id, query.cursor, query.limit);
  }

  // POST /favorites (UC-09)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(user.id, dto);
  }

  // DELETE /favorites/:id (UC-11) — luôn trả 204, kể cả khi đã bỏ lưu từ trước
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.favoritesService.remove(user.id, id);
  }
}
