import { Module } from '@nestjs/common';
import { ShoppingItemsController } from './shopping-items.controller';
import { ShoppingItemsService } from './shopping-items.service';

// PrismaModule là @Global và JwtAuthGuard đã đăng ký toàn cục ở AuthModule,
// nên module này không cần import thêm gì.
@Module({
  controllers: [ShoppingItemsController],
  providers: [ShoppingItemsService],
})
export class ShoppingItemsModule {}
