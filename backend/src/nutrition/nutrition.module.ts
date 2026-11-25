import { Module } from '@nestjs/common';
import { NutritionService } from './nutrition.service';

// PrismaModule là @Global nên không cần import ở đây.
// Chưa có controller: nutrition được tính trong luồng POST/PATCH /recipes
// (Mục 7.6), không có endpoint riêng.
@Module({
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}
