import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { resolveLimit } from '../common/dto/pagination.dto';
import { isLocalId, normalizeRecipeId } from '../common/utils/recipe-id';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

export type PageMeta = { nextCursor: number | null; hasMore: boolean };

// Mục "Response chỉ được thêm trường": mỗi phần tử gồm đúng 6 trường này.
// id là id của dòng favorites (mobile cần nó để gọi DELETE /favorites/:id).
export type FavoriteItem = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  createdAt: Date;
};

type FavoriteRow = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  titleSnapshot: string;
  imageSnapshot: string | null;
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
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-09. Ngoại lệ 2a: đã có sẵn thì giữ nguyên, không báo lỗi.
  async create(userId: number, dto: CreateFavoriteDto): Promise<FavoriteItem> {
    const { recipeId, titleSnapshot, imageSnapshot } =
      await this.resolveRecipe(dto);

    // upsert thay cho findUnique + create: hai request song song cùng bấm tim
    // sẽ không làm request thua cuộc vỡ vì UNIQUE(user_id, recipe_id, source).
    // update rỗng vì UC-09 2a yêu cầu giữ nguyên bản ghi cũ.
    const favorite = await this.prisma.favorite.upsert({
      where: {
        userId_recipeId_source: { userId, recipeId, source: dto.source },
      },
      create: {
        userId,
        recipeId,
        source: dto.source,
        titleSnapshot,
        imageSnapshot,
      },
      update: {},
    });

    return toFavoriteItem(favorite);
  }

  // UC-10: danh sách yêu thích, cursor-based theo ghi chú phân trang ở Mục 8.
  async list(
    userId: number,
    query: { cursor?: number; limit?: number },
  ): Promise<{ data: FavoriteItem[]; meta: PageMeta }> {
    const limit = resolveLimit(query.limit);

    // orderBy id desc: id tăng dần theo thời gian lưu nên cùng nghĩa với
    // created_at desc, lại là cursor ổn định (duy nhất, không trùng mốc giờ).
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: limit + 1,
      ...(query.cursor === undefined
        ? {}
        : { cursor: { id: query.cursor }, skip: 1 }),
    });

    const page = takePage<FavoriteRow>(rows, limit);
    const live = await this.loadLocalRecipes(page.data);

    return {
      data: page.data.map((row) => {
        const recipe =
          row.source === RecipeSource.LOCAL
            ? live.get(row.recipeId)
            : undefined;
        return {
          ...toFavoriteItem(row),
          // Dữ liệu sống ưu tiên hơn snapshot; công thức đã xoá thì rơi về snapshot.
          title: recipe?.title ?? row.titleSnapshot,
          imageUrl: recipe?.imageUrl ?? row.imageSnapshot,
        };
      }),
      meta: page.meta,
    };
  }

  // UC-11. Ngoại lệ 2a: đã bỏ lưu từ trước thì coi như hoàn tất, không báo lỗi.
  // Lọc thêm userId nên favorite của người khác cũng không xoá được, và vì luôn
  // trả 204 nên người gọi không suy ra được bản ghi đó có tồn tại hay không.
  async remove(userId: number, id: number): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { id, userId } });
  }

  // LOCAL: kiểm tra công thức tồn tại và lấy snapshot từ bảng recipes;
  // SPOONACULAR: dùng dữ liệu client gửi, titleSnapshot là bắt buộc.
  private async resolveRecipe(dto: CreateFavoriteDto): Promise<{
    recipeId: string;
    titleSnapshot: string;
    imageSnapshot: string | null;
  }> {
    if (dto.source === RecipeSource.SPOONACULAR) {
      if (!dto.titleSnapshot) {
        throw new BadRequestException(
          'Thiếu tên công thức (titleSnapshot) cho nguồn SPOONACULAR',
        );
      }
      return {
        recipeId: dto.recipeId,
        titleSnapshot: dto.titleSnapshot,
        imageSnapshot: dto.imageSnapshot ?? null,
      };
    }

    // Id sai định dạng cũng coi như không tồn tại, giống UC-08.
    if (!isLocalId(dto.recipeId)) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    // "7" và "007" phải ra cùng một dòng qua UNIQUE nên LOCAL chuẩn hoá ngay từ
    // đầu: cùng một giá trị dùng cho findUnique, cho upsert và cho lúc ghi, nên
    // recipe_id đã lưu luôn khớp với String(recipes.id) khi đọc dữ liệu sống.
    const recipeId = normalizeRecipeId(dto.recipeId, dto.source);

    // Không qua RecipesService: ở đây chỉ cần tên và ảnh, không cần nguyên liệu,
    // dinh dưỡng hay rating của màn chi tiết.
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: Number(recipeId) },
      select: { title: true, imageUrl: true },
    });

    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    return {
      recipeId,
      titleSnapshot: recipe.title,
      imageSnapshot: recipe.imageUrl,
    };
  }

  // Ghép dữ liệu sống cho các dòng LOCAL bằng một truy vấn gom id.
  // Không dùng include: favorites không có FK tới recipes (Mục "Quy ước chung").
  private async loadLocalRecipes(
    rows: FavoriteRow[],
  ): Promise<Map<string, { title: string; imageUrl: string | null }>> {
    const ids = rows
      .filter((row) => row.source === RecipeSource.LOCAL)
      .map((row) => row.recipeId)
      .filter(isLocalId)
      .map(Number);

    if (ids.length === 0) {
      return new Map();
    }

    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: { id: true, title: true, imageUrl: true },
    });

    return new Map(
      recipes.map((recipe) => [
        String(recipe.id),
        { title: recipe.title, imageUrl: recipe.imageUrl },
      ]),
    );
  }
}

function toFavoriteItem(row: FavoriteRow): FavoriteItem {
  return {
    id: row.id,
    recipeId: row.recipeId,
    source: row.source,
    title: row.titleSnapshot,
    imageUrl: row.imageSnapshot,
    createdAt: row.createdAt,
  };
}
