import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesService } from './favorites.service';

// req.user do JwtStrategy.validate() gán (users trừ passwordHash).
type AuthUser = { id: number };

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // POST /favorites (UC-09)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(user.id, dto);
  }
}
