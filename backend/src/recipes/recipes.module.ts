import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { LocalDbProvider } from './local-db.provider';

// PrismaModule là @Global nên không cần import ở đây.
// ReviewsModule chỉ để dùng ReviewsService.getRatingSummary() (một chiều, không vòng).
@Module({
  imports: [ReviewsModule],
  controllers: [RecipesController],
  providers: [RecipesService, LocalDbProvider],
})
export class RecipesModule {}
