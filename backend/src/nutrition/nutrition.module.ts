import { Module } from '@nestjs/common';
import { SpoonacularProvider } from '../recipes/providers/spoonacular.provider';
import { NutritionService } from './nutrition.service';

// PrismaModule là @Global nên không cần import ở đây.
// Chưa có controller: nutrition được tính ngay trong POST/PATCH /recipes,
// không có endpoint riêng.
// SpoonacularProvider khai báo trực tiếp (không import RecipesModule) để tránh
// phụ thuộc vòng với RecipesModule — module đó đã import NutritionModule.
@Module({
  providers: [NutritionService, SpoonacularProvider],
  exports: [NutritionService],
})
export class NutritionModule {}
