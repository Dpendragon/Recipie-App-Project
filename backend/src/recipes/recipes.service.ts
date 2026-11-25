import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { normalizeRecipeId } from '../common/utils/recipe-id';
import { ReviewsService } from '../reviews/reviews.service';
import { LocalDbProvider, toRecipeDetail } from './local-db.provider';
import { CreateRecipeDto } from './dto/create-recipe.dto';
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

  // POST /recipes (UC-17). Công thức mới luôn là nguồn LOCAL.
  async create(
    userId: number,
    dto: CreateRecipeDto,
  ): Promise<RecipeDetailResponse> {
    // Chỉ bọc phần ghi DB: nutrition (Mục 7.6) gọi API ngoài nên phải nằm ngoài
    // transaction, thêm sau ở bước tính dinh dưỡng.
    const row = await this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          authorId: userId,
          title: dto.title,
          servings: dto.servings,
          readyInMinutes: dto.readyInMinutes ?? null,
          // Cột JSON: bỏ qua field khi client không gửi để DB giữ NULL.
          diets: dto.diets ?? undefined,
          dishTypes: dto.dishTypes ?? undefined,
          // Cột steps là TEXT một chuỗi, mỗi bước một dòng (xem splitSteps).
          steps: dto.steps.join('\n'),
          imageUrl: dto.imageUrl ?? null,
          videoUrl: dto.videoUrl ?? null,
        },
        include: {
          author: { select: { id: true, name: true, deletedAt: true } },
        },
      });

      await tx.recipeIngredient.createMany({
        data: dto.ingredients.map((item, index) => ({
          recipeId: recipe.id,
          nameVi: item.nameVi,
          nameEn: item.nameEn ?? null,
          quantity: item.quantity ?? null,
          unit: item.unit ?? null,
          // sort_order theo đúng thứ tự người dùng nhập.
          sortOrder: index + 1,
        })),
      });

      // createMany không trả về dòng vừa ghi (MySQL) nên phải đọc lại để có id.
      const ingredients = await tx.recipeIngredient.findMany({
        where: { recipeId: recipe.id },
        orderBy: { sortOrder: 'asc' },
      });

      return { ...recipe, ingredients };
    });

    // Công thức mới chưa thể có đánh giá hay yêu thích, khỏi tra DB thêm.
    return {
      ...toRecipeDetail(row),
      rating: { average: 0, count: 0 },
      favoriteId: null,
    };
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
