import { Module } from '@nestjs/common';
import { MealPlanController } from './meal-plan.controller';
import { MealPlanService } from './meal-plan.service';

// PrismaModule là @Global và JwtAuthGuard đã đăng ký toàn cục ở AuthModule,
// nên module này không cần import thêm gì.
@Module({
  controllers: [MealPlanController],
  providers: [MealPlanService],
})
export class MealPlanModule {}
