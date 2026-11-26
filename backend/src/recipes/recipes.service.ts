import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NutritionCoverage, RecipeSource } from '../generated/prisma/enums';
import { resolveLimit } from '../common/dto/pagination.dto';
import { isLocalId, normalizeRecipeId } from '../common/utils/recipe-id';
import { ReviewsService } from '../reviews/reviews.service';
import { NutritionService } from '../nutrition/nutrition.service';
import type { NutritionResult } from '../nutrition/nutrition.service';
import { LocalDbProvider, toRecipeDetail } from './providers/local-db.provider';
import { SpoonacularProvider } from './providers/spoonacular.provider';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import type { CreateRecipeIngredientDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import type { RecipeDetailResponse } from './providers/recipe-provider.interface';

export type PageMeta = { nextCursor: number | null; hasMore: boolean };

// Mỗi phần tử của GET /recipes/mine gồm đúng 6 trường này (chỉ thêm, không bớt).
// id là recipes.id (Int) và cũng là cursor của trang sau.
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

// Chữ ký của một danh sách nguyên liệu, dùng để so sánh trước và sau khi sửa.
// quantity từ DB là Decimal nên phải ép về number để "200" và "200.00" bằng nhau.
function ingredientsKey(
  items: {
    nameVi: string;
    nameEn?: string | null;
    quantity?: unknown;
    unit?: string | null;
  }[],
): string {
  return JSON.stringify(
    items.map((item) => [
      item.nameVi,
      item.nameEn ?? null,
      item.quantity === null || item.quantity === undefined
        ? null
        : Number(item.quantity),
      item.unit ?? null,
    ]),
  );
}


@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly localDbProvider: LocalDbProvider,
    private readonly spoonacularProvider: SpoonacularProvider,
    private readonly reviewsService: ReviewsService,
    private readonly nutritionService: NutritionService,
    private readonly prisma: PrismaService,
  ) {}

  async getById(
    id: string,
    source: RecipeSource,
    userId: number,
  ): Promise<RecipeDetailResponse> {
    // Provider ném 404 trước, nên id sai định dạng không chạy hai truy vấn dưới.
    const detail =
      source === RecipeSource.SPOONACULAR
        ? await this.spoonacularProvider.getById(id)
        : await this.localDbProvider.getById(id);

    // recipe_id ở favorites/recipe_reviews là VARCHAR: "007" phải tra cùng dòng với "7".
    const recipeId = normalizeRecipeId(id, source);

    const [rating, favoriteId] = await Promise.all([
      this.reviewsService.getRatingSummary(recipeId, source),
      this.findFavoriteId(userId, recipeId, source),
    ]);

    return { ...detail, rating, favoriteId };
  }

  // POST /recipes. Công thức mới luôn là nguồn LOCAL.
  async create(
    userId: number,
    dto: CreateRecipeDto,
  ): Promise<RecipeDetailResponse> {
    // Chỉ bọc phần ghi DB: nutrition có thể gọi API ngoài nên phải nằm ngoài
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
          // Giá trị khởi tạo: nếu bước tính dinh dưỡng dưới đây không chạy
          // được thì công thức vẫn nằm đúng ở trạng thái NONE, không phải
          // NULL mập mờ.
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

    // Tính dinh dưỡng ngoài transaction vì bước này có thể gọi nguồn ngoài.
    // Lỗi ở đây không được làm mất công thức vừa lưu: chỉ ghi log và giữ
    // coverage = NONE.
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

  // GET /recipes/mine. Chỉ công thức của chính người đang đăng nhập,
  // id giảm dần, phân trang theo cursor.
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

  // PATCH /recipes/:id. Chỉ tác giả sửa được công thức của mình.
  async update(
    userId: number,
    id: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeDetailResponse> {
    const current = await this.findOwnRecipe(userId, id);

    // Chỉ ghi lại nguyên liệu khi danh sách gửi lên thực sự khác danh sách đang
    // lưu: form sửa luôn gửi cả danh sách, mà xoá rồi tạo lại sẽ mất
    // ingredient_id đã đối chiếu được.
    const sent = Array.isArray(dto.ingredients) ? dto.ingredients : null;
    const nextIngredients: CreateRecipeIngredientDto[] | null =
      sent !== null &&
      ingredientsKey(sent) !== ingredientsKey(current.ingredients)
        ? sent
        : null;

    const servingsChanged =
      dto.servings !== undefined &&
      dto.servings !== null &&
      dto.servings !== current.servings;

    // recipes và recipe_ingredients đi cùng một transaction.
    // Field vắng mặt để undefined cho Prisma bỏ qua, tức là "không sửa phần đó".
    await this.prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: current.id },
        data: {
          // Ba cột NOT NULL: client gửi null thì coi như không sửa, không ghi
          // NULL xuống DB.
          title: dto.title ?? undefined,
          servings: dto.servings ?? undefined,
          steps: dto.steps?.join('\n'),
          // Cột JSON nullable cần Prisma.DbNull mới ghi được NULL, nên ở đây
          // chỉ nhận giá trị mới chứ không nhận lệnh xoá.
          diets: dto.diets ?? undefined,
          dishTypes: dto.dishTypes ?? undefined,
          // Cột nullable thường: gửi null là xoá giá trị cũ.
          readyInMinutes: dto.readyInMinutes,
          imageUrl: dto.imageUrl,
          videoUrl: dto.videoUrl,
        },
      });

      if (nextIngredients !== null) {
        // Đồng bộ lại: xoá hết rồi tạo lại để sort_order khớp thứ tự mới.
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: current.id },
        });
        await tx.recipeIngredient.createMany({
          data: nextIngredients.map((item, index) => ({
            recipeId: current.id,
            nameVi: item.nameVi,
            nameEn: item.nameEn ?? null,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            sortOrder: index + 1,
          })),
        });
      }
    });

    // Chỉ tính lại dinh dưỡng khi nguyên liệu, quantity, unit hoặc servings đổi.
    // Đổi tên món, ảnh, video hay các bước thì giữ nguyên dinh dưỡng cũ.
    // Giống lúc đăng, bước này nằm ngoài transaction và lỗi ở đây không được làm
    // mất phần đã sửa.
    if (nextIngredients !== null || servingsChanged) {
      try {
        await this.nutritionService.calculate(current.id);
      } catch (error) {
        this.logger.error(
          `Không tính lại được dinh dưỡng cho công thức ${current.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // Đọc lại để trả về đúng định dạng GET /recipes/:id (kèm rating, favoriteId).
    return this.getById(id, RecipeSource.LOCAL, userId);
  }

  // DELETE /recipes/:id. Chỉ tác giả xoá được công thức của mình.
  async remove(userId: number, id: string): Promise<void> {
    const current = await this.findOwnRecipe(userId, id);

    // Chỉ xoá dòng recipes: recipe_ingredients tự xoá theo ON DELETE CASCADE
    // favorites, recipe_reviews và meal_plan_entries không có FK
    // cứng tới recipes nên vừa không bị xoá theo, vừa không chặn lệnh xoá này —
    // các FK RESTRICT trong schema đều trỏ tới users, không phải recipes. Nội
    // dung người khác tạo (đánh giá, yêu thích, kế hoạch) vẫn được giữ lại.
    await this.prisma.recipe.delete({ where: { id: current.id } });
  }

  // Dùng chung cho sửa và xoá: không tồn tại thì 404, không phải của mình
  // thì 403.
  private async findOwnRecipe(
    userId: number,
    id: string,
  ): Promise<{
    id: number;
    servings: number;
    ingredients: {
      nameVi: string;
      nameEn: string | null;
      quantity: unknown;
      unit: string | null;
    }[];
  }> {
    // Id sai định dạng cũng coi như không tồn tại, giống màn chi tiết công thức.
    if (!isLocalId(id)) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        authorId: true,
        servings: true,
        ingredients: {
          select: {
            nameVi: true,
            nameEn: true,
            quantity: true,
            unit: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    if (recipe.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền với công thức này');
    }

    return recipe;
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
