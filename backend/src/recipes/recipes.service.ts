import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { normalizeRecipeId } from '../common/utils/recipe-id';
import { ReviewsService } from '../reviews/reviews.service';
import { LocalDbProvider } from './local-db.provider';
import type { RecipeDetailResponse } from './recipe-provider.interface';

@Injectable()
export class RecipesService {
  constructor(
    private readonly localDbProvider: LocalDbProvider,
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  async getById(
    id: string,
    source: RecipeSource,
    userId: number,
  ): Promise<RecipeDetailResponse> {
    // Điểm nối cho SpoonacularProvider: người làm tìm kiếm thay vào đây.
    if (source === RecipeSource.SPOONACULAR) {
      throw new NotImplementedException('Chưa hỗ trợ nguồn Spoonacular');
    }

    // Provider ném 404 trước, nên id sai định dạng không chạy hai truy vấn dưới.
    const detail = await this.localDbProvider.getById(id);

    // recipe_id ở favorites/recipe_reviews là VARCHAR: "007" phải tra cùng dòng với "7".
    const recipeId = normalizeRecipeId(id, source);

    const [rating, favoriteId] = await Promise.all([
      this.reviewsService.getRatingSummary(recipeId, source),
      this.findFavoriteId(userId, recipeId, source),
    ]);

    return { ...detail, rating, favoriteId };
  }

  // Đọc favorites bằng prisma trực tiếp để recipes không phụ thuộc FavoritesModule.
  private async findFavoriteId(
    userId: number,
    recipeId: string,
    source: RecipeSource,
  ): Promise<number | null> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_recipeId_source: { userId, recipeId, source } },
      select: { id: true },
    });

    return favorite?.id ?? null;
  }
}
