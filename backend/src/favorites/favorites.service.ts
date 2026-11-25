import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecipeSource } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

const DEFAULT_LIMIT = 20;

// Cột đọc ra từ DB (không trả userId cho client).
const FAVORITE_SELECT = {
  id: true,
  recipeId: true,
  source: true,
  titleSnapshot: true,
  imageSnapshot: true,
  createdAt: true,
} as const;

type FavoriteRow = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  titleSnapshot: string;
  imageSnapshot: string | null;
  createdAt: Date;
};

type RecipeDisplay = { title: string; imageUrl: string | null };

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  // XEM DANH SÁCH YÊU THÍCH (UC-10) — mới lưu trước, phân trang keyset theo id.
  async findAll(userId: number, cursor?: number, limit = DEFAULT_LIMIT) {
    // Lấy dư 1 dòng để biết còn trang sau hay không.
    const rows = await this.prisma.favorite.findMany({
      where: { userId, ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { id: 'desc' },
      take: limit + 1,
      select: FAVORITE_SELECT,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    // LOCAL: ưu tiên dữ liệu sống trong bảng recipes, công thức đã bị xoá thì
    // rơi về snapshot (tương đương LEFT JOIN + COALESCE ở Mục 2).
    const localIds = [
      ...new Set(
        page
          .filter((f) => f.source === RecipeSource.LOCAL)
          .map((f) => parseLocalId(f.recipeId))
          .filter((id): id is number => id !== null),
      ),
    ];
    const liveRecipes = new Map<string, RecipeDisplay>();
    if (localIds.length > 0) {
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: localIds } },
        select: { id: true, title: true, imageUrl: true },
      });
      for (const r of recipes) {
        liveRecipes.set(String(r.id), { title: r.title, imageUrl: r.imageUrl });
      }
    }

    return {
      data: page.map((f) =>
        toResponse(
          f,
          f.source === RecipeSource.LOCAL
            ? liveRecipes.get(f.recipeId)
            : undefined,
        ),
      ),
      meta: {
        nextCursor: hasMore ? String(page[page.length - 1].id) : null,
        hasMore,
      },
    };
  }

  // LƯU YÊU THÍCH (UC-09) — đã lưu rồi thì trả lại dòng cũ (luồng 2a).
  async create(userId: number, dto: CreateFavoriteDto) {
    const key = {
      userId_recipeId_source: {
        userId,
        recipeId: dto.recipeId,
        source: dto.source,
      },
    };
    const existing = await this.prisma.favorite.findUnique({
      where: key,
      select: FAVORITE_SELECT,
    });
    if (existing) return toResponse(existing);

    const snapshot = await this.resolveSnapshot(dto);
    // upsert để 2 request lưu cùng lúc không vỡ ràng buộc UNIQUE.
    const favorite = await this.prisma.favorite.upsert({
      where: key,
      create: {
        userId,
        recipeId: dto.recipeId,
        source: dto.source,
        ...snapshot,
      },
      update: {},
      select: FAVORITE_SELECT,
    });
    return toResponse(favorite);
  }

  // BỎ LƯU (UC-11) — đã bỏ từ trước thì coi như xong (luồng 2a).
  async remove(userId: number, id: number) {
    const existing = await this.prisma.favorite.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return;
    if (existing.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi yêu thích của người khác',
      );
    }
    await this.prisma.favorite.deleteMany({ where: { id, userId } });
  }

  // Snapshot được ghi cho MỌI nguồn lúc lưu (Mục 2):
  // - LOCAL: lấy từ bảng recipes (bỏ qua giá trị client gửi).
  // - SPOONACULAR: dùng giá trị client gửi, bắt buộc có titleSnapshot.
  private async resolveSnapshot(dto: CreateFavoriteDto) {
    if (dto.source === RecipeSource.SPOONACULAR) {
      if (!dto.titleSnapshot) {
        throw new BadRequestException(
          'Vui lòng gửi titleSnapshot cho công thức Spoonacular',
        );
      }
      return {
        titleSnapshot: dto.titleSnapshot,
        imageSnapshot: dto.imageSnapshot ?? null,
      };
    }

    const localId = parseLocalId(dto.recipeId);
    const recipe =
      localId === null
        ? null
        : await this.prisma.recipe.findUnique({
            where: { id: localId },
            select: { title: true, imageUrl: true },
          });
    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }
    return { titleSnapshot: recipe.title, imageSnapshot: recipe.imageUrl };
  }
}

// Công thức LOCAL có id là số nguyên dương; sai định dạng trả null.
function parseLocalId(recipeId: string): number | null {
  const id = /^\d+$/.test(recipeId) ? Number(recipeId) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// live: dữ liệu sống của công thức LOCAL (nếu còn tồn tại).
function toResponse(row: FavoriteRow, live?: RecipeDisplay) {
  return {
    id: row.id,
    recipeId: row.recipeId,
    source: row.source,
    title: live ? live.title : row.titleSnapshot,
    imageUrl: live ? live.imageUrl : row.imageSnapshot,
    createdAt: row.createdAt,
  };
}
