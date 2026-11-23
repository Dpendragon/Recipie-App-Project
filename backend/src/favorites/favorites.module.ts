import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

// PrismaModule là @Global và JwtAuthGuard đã đăng ký toàn cục ở AuthModule,
// nên module này không cần import thêm gì.
@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
