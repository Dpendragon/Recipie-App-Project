import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

// PrismaModule là @Global nên không cần import ở đây.
// Export FavoritesService để màn chi tiết công thức lấy favoriteId sau này.
@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
