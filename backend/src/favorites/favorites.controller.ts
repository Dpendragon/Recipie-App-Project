import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesService } from './favorites.service';

// req.user do JwtStrategy.validate() gán (users trừ passwordHash).
type AuthUser = { id: number };

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // GET /favorites?cursor=&limit= (UC-10)
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.favoritesService.list(user.id, query);
  }

  // POST /favorites (UC-09)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(user.id, dto);
  }


}
