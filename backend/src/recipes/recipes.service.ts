import { Injectable, NotImplementedException } from '@nestjs/common';
import { RecipeSource } from '../generated/prisma/enums';
import { LocalDbProvider } from './local-db.provider';
import type { RecipeDetail } from './recipe-provider.interface';

@Injectable()
export class RecipesService {
  constructor(private readonly localDbProvider: LocalDbProvider) {}

  async getById(id: string, source: RecipeSource): Promise<RecipeDetail> {
    // Điểm nối cho SpoonacularProvider: người làm tìm kiếm thay vào đây.
    if (source === RecipeSource.SPOONACULAR) {
      throw new NotImplementedException('Chưa hỗ trợ nguồn Spoonacular');
    }
    return this.localDbProvider.getById(id);
  }
}
