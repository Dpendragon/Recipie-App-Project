import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { LocalDbProvider } from './local-db.provider';

// PrismaModule là @Global nên không cần import ở đây.
@Module({
  controllers: [RecipesController],
  providers: [RecipesService, LocalDbProvider],
})
export class RecipesModule {}
