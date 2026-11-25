import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NutritionCoverage, RecipeSource } from '../generated/prisma/enums';
import { resolveLimit } from '../common/dto/pagination.dto';
import { normalizeRecipeId } from '../common/utils/recipe-id';
import { ReviewsService } from '../reviews/reviews.service';
import { NutritionService } from '../nutrition/nutrition.service';
import type { NutritionResult } from '../nutrition/nutrition.service';
import { LocalDbProvider, toRecipeDetail } from './local-db.provider';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import type { RecipeDetailResponse } from './recipe-provider.interface';

export type PageMeta = { nextCursor: number | null; hasMore: boolean };

// Mục "Response chỉ được thêm trường": mỗi phần tử của GET /recipes/mine gồm
// đúng 6 trường này. id là recipes.id (Int) và cũng là cursor của trang sau.
export type MyRecipeItem = {
  id: number;
  title: string;
  imageUrl: string | null;
  readyInMinutes: number | null;
  servings: number;
  createdAt: Date;
};

// take = limit + 1: dòng thừa chỉ dùng để biết còn trang sau, không trả ra.
function takePage<T extends { id: number }>(
  rows: T[],
  limit: number,
): { data: T[]; meta: PageMeta } {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;
  return { data, meta: { nextCursor, hasMore } };
}

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly localDbProvider: LocalDbProvider,
    private readonly reviewsService: ReviewsService,
    private readonly nutritionService: NutritionService,
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
          // Giá trị khởi tạo cho bước 8: nếu bước tính dinh dưỡng dưới đây
          // không chạy được thì công thức vẫn nằm đúng ở trạng thái NONE
          // (UC-17 ngoại lệ 8a), không phải NULL mập mờ.
          nutritionCoverage: NutritionCoverage.NONE,
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

    // UC-17 bước 8: tính dinh dưỡng NGOÀI transaction (Mục 7.6) vì bước này có
    // thể gọi nguồn ngoài. Lỗi ở đây không được làm mất công thức vừa lưu
    // (ngoại lệ 8a): chỉ ghi log và giữ coverage = NONE.
    let nutrition: NutritionResult = {
      nutrition: null,
      coverage: NutritionCoverage.NONE,
    };
    try {
      nutrition = await this.nutritionService.calculate(row.id);
    } catch (error) {
      this.logger.error(
        `Không tính được dinh dưỡng cho công thức ${row.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    // Công thức mới chưa thể có đánh giá hay yêu thích, khỏi tra DB thêm.
    return {
      ...toRecipeDetail(row),
      // row đọc trước khi tính nên nutrition của nó đã cũ.
      nutrition: nutrition.nutrition,
      nutritionCoverage: nutrition.coverage,
      rating: { average: 0, count: 0 },
      favoriteId: null,
    };
  }

  // GET /recipes/mine (UC-18). Chỉ công thức của chính người đang đăng nhập,
  // id giảm dần, cursor-based theo ghi chú phân trang ở Mục 8.
  async listMine(
    userId: number,
    query: { cursor?: number; limit?: number },
  ): Promise<{ data: MyRecipeItem[]; meta: PageMeta }> {
    const limit = resolveLimit(query.limit);

    const rows = await this.prisma.recipe.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        readyInMinutes: true,
        servings: true,
        createdAt: true,
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(query.cursor === undefined
        ? {}
        : { cursor: { id: query.cursor }, skip: 1 }),
    });

    return takePage<MyRecipeItem>(rows, limit);
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
