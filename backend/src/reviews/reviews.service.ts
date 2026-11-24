import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { resolveLimit } from '../common/dto/pagination.dto';
import { isLocalId, normalizeRecipeId } from '../common/utils/recipe-id';
import { CreateReviewDto } from './dto/create-review.dto';

// Tên hiển thị khi users.name NULL hoặc tác giả đã bị xoá mềm.
export const DELETED_AUTHOR_NAME = 'Người dùng';

export type RatingSummary = { average: number; count: number };

export type PageMeta = { nextCursor: number | null; hasMore: boolean };

export type ReviewItem = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string };
};

export type MyReviewItem = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ReviewRow = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { name: string | null; deletedAt: Date | null } | null;
};

type MyReviewRow = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  titleSnapshot: string;
  imageSnapshot: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function authorName(user: ReviewRow['user']): string {
  if (!user || user.deletedAt !== null) {
    return DELETED_AUTHOR_NAME;
  }
  return user.name?.trim() ? user.name.trim() : DELETED_AUTHOR_NAME;
}

function toReviewItem(row: ReviewRow): ReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: { name: authorName(row.user) },
  };
}

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
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-12 + UC-15: một endpoint duy nhất, upsert theo (userId, recipeId, source).
  async upsert(
    userId: number,
    id: string,
    source: RecipeSource,
    dto: CreateReviewDto,
  ): Promise<{ review: ReviewItem; summary: RatingSummary }> {
    const { recipeId, titleSnapshot, imageSnapshot } = await this.resolveRecipe(
      id,
      source,
      dto,
    );

    const review = await this.prisma.recipeReview.upsert({
      where: { userId_recipeId_source: { userId, recipeId, source } },
      create: {
        userId,
        recipeId,
        source,
        titleSnapshot,
        imageSnapshot,
        rating: dto.rating,
        comment: dto.comment ?? null,
      },
      // Nhánh sửa làm mới luôn snapshot. updated_at do @updatedAt trong
      // schema.prisma tự cập nhật nên không cần set tay.
      update: {
        titleSnapshot,
        imageSnapshot,
        rating: dto.rating,
        comment: dto.comment ?? null,
      },
      include: { user: { select: { name: true, deletedAt: true } } },
    });

    const summary = await this.getRatingSummary(recipeId, source);

    return { review: toReviewItem(review), summary };
  }

  // UC-13: điểm trung bình + đánh giá của mình + đánh giá của người khác.
  async listByRecipe(
    userId: number,
    id: string,
    source: RecipeSource,
    query: { cursor?: number; limit?: number },
  ): Promise<{
    summary: RatingSummary;
    mine: ReviewItem | null;
    data: ReviewItem[];
    meta: PageMeta;
  }> {
    const recipeId = normalizeRecipeId(id, source);
    const limit = resolveLimit(query.limit);

    const summary = await this.getRatingSummary(recipeId, source);

    const mine = await this.prisma.recipeReview.findUnique({
      where: { userId_recipeId_source: { userId, recipeId, source } },
      include: { user: { select: { name: true, deletedAt: true } } },
    });

    const rows = await this.prisma.recipeReview.findMany({
      where: {
        recipeId,
        source,
        userId: { not: userId },
        user: { deletedAt: null },
      },
      include: { user: { select: { name: true, deletedAt: true } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor === undefined
        ? {}
        : { cursor: { id: query.cursor }, skip: 1 }),
    });

    const page = takePage(rows, limit);

    return {
      summary,
      mine: mine ? toReviewItem(mine) : null,
      data: page.data.map(toReviewItem),
      meta: page.meta,
    };
  }

  // UC-14: toàn bộ đánh giá của chính mình, gộp từ mọi công thức.
  async listMine(
    userId: number,
    query: { cursor?: number; limit?: number },
  ): Promise<{ data: MyReviewItem[]; meta: PageMeta }> {
    const limit = resolveLimit(query.limit);

    const rows = await this.prisma.recipeReview.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor === undefined
        ? {}
        : { cursor: { id: query.cursor }, skip: 1 }),
    });

    const page = takePage<MyReviewRow>(rows, limit);
    const live = await this.loadLocalRecipes(page.data);

    return {
      data: page.data.map((row) => {
        const recipe =
          row.source === RecipeSource.LOCAL
            ? live.get(row.recipeId)
            : undefined;
        return {
          id: row.id,
          recipeId: row.recipeId,
          source: row.source,
          // Dữ liệu sống ưu tiên hơn snapshot; công thức đã xoá thì rơi về snapshot.
          title: recipe?.title ?? row.titleSnapshot,
          imageUrl: recipe?.imageUrl ?? row.imageSnapshot,
          rating: row.rating,
          // Trả nhận xét đầy đủ, phía mobile tự rút gọn.
          comment: row.comment,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
      meta: page.meta,
    };
  }

  // UC-16: chỉ xoá đúng đánh giá của chính mình.
  async remove(
    userId: number,
    id: string,
    source: RecipeSource,
  ): Promise<void> {
    const recipeId = normalizeRecipeId(id, source);

    const result = await this.prisma.recipeReview.deleteMany({
      where: { userId, recipeId, source },
    });

    if (result.count === 0) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }
  }

  // Export cho module khác (chi tiết công thức cần rating.average/count).
  // Không lưu cột riêng: tính bằng aggregate mỗi lần hỏi.
  async getRatingSummary(
    recipeId: string,
    source: RecipeSource,
  ): Promise<RatingSummary> {
    const result = await this.prisma.recipeReview.aggregate({
      where: {
        recipeId: normalizeRecipeId(recipeId, source),
        source,
        // Bỏ qua đánh giá của tác giả đã xoá mềm.
        user: { deletedAt: null },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const count = result._count?._all ?? 0;
    const average = result._avg?.rating ?? null;

    if (count === 0 || average === null) {
      return { average: 0, count: 0 };
    }

    return { average: Math.round(average * 10) / 10, count };
  }

  // LOCAL: kiểm tra công thức tồn tại và lấy snapshot từ bảng recipes;
  // SPOONACULAR: dùng dữ liệu client gửi, titleSnapshot là bắt buộc.
  private async resolveRecipe(
    id: string,
    source: RecipeSource,
    dto: CreateReviewDto,
  ): Promise<{
    recipeId: string;
    titleSnapshot: string;
    imageSnapshot: string | null;
  }> {
    if (source === RecipeSource.SPOONACULAR) {
      // source nằm ở query nên không ràng buộc được ở DTO body.
      if (!dto.titleSnapshot) {
        throw new BadRequestException(
          'Thiếu tên công thức (titleSnapshot) cho nguồn SPOONACULAR',
        );
      }
      return {
        recipeId: id,
        titleSnapshot: dto.titleSnapshot,
        imageSnapshot: dto.imageSnapshot ?? null,
      };
    }

    // Id sai định dạng cũng coi như không tồn tại, giống UC-08.
    if (!isLocalId(id)) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: Number(id) },
      select: { title: true, imageUrl: true },
    });

    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    return {
      recipeId: String(Number(id)),
      titleSnapshot: recipe.title,
      imageSnapshot: recipe.imageUrl,
    };
  }

  // Ghép dữ liệu sống cho các dòng LOCAL bằng một truy vấn gom id.
  // Không dùng include: recipe_reviews không có FK tới recipes.
  private async loadLocalRecipes(
    rows: MyReviewRow[],
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
