import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocalDbProvider } from './providers/local-db.provider';
import {
  RankedRecipe,
  RecipeSummary,
  SearchParams,
} from './providers/recipe-provider.interface';
import { SpoonacularProvider } from './providers/spoonacular.provider';
import { byRelevance } from './recipe-relevance';
import { LOCAL_MIN_RESULTS } from './recipes.constants';

// Kết quả trả về cho app
export interface SearchResponse {
  data: RecipeSummary[];
  meta: {
    count: number;
    localCount: number;
    spoonacularCount: number; 
    hasMore: boolean;
    nextCursor: number | null;
  };
}

// Service trung gian duy nhất quyết định lấy công thức từ nguồn nào.
@Injectable()
export class RecipeAggregatorService {
  private readonly logger = new Logger(RecipeAggregatorService.name);

  constructor(
    private readonly local: LocalDbProvider,
    private readonly spoonacular: SpoonacularProvider,
    private readonly prisma: PrismaService,
  ) {}

  async search(params: SearchParams, userId: number): Promise<SearchResponse> {
    // Danh sách món cộng đồng đã xếp hạng
    const localAll = await this.local.search(params);
    const offset = params.cursor ?? 0;

    if (offset > 0) {
      const page = localAll.slice(offset, offset + params.limit);
      return this.pack(page, userId, this.nextCursor(offset + page.length, localAll.length));
    }

    if (localAll.length >= LOCAL_MIN_RESULTS) {
      const page = localAll.slice(0, params.limit);
      return this.pack(page, userId, this.nextCursor(page.length, localAll.length));
    }

    const external = await this.spoonacular.search(params).catch((error: Error) => {
      this.logger.warn(`Bỏ qua Spoonacular: ${error.message}`);
      return [] as RankedRecipe[];
    });

    const merged = [...localAll, ...external].sort(byRelevance);
    return this.pack(merged, userId, null);
  }

  // Món cộng đồng nổi tiếng cho Trang chủ
  async popular(limit: number, userId: number): Promise<SearchResponse> {
    const page = await this.local.popular(limit);
    return this.pack(page, userId, null);
  }

  // Còn món cộng đồng chưa dùng thì trả vị trí bắt đầu của trang sau
  private nextCursor(used: number, total: number): number | null {
    return used < total ? used : null;
  }

  private async pack(
    page: RankedRecipe[],
    userId: number,
    nextCursor: number | null,
  ): Promise<SearchResponse> {
    const favoriteKeys = await this.loadFavoriteKeys(userId, page);

    const data = page.map(
      (r): RecipeSummary => ({
        id: r.id,
        source: r.source,
        title: r.title,
        imageUrl: r.imageUrl,
        readyInMinutes: r.readyInMinutes,
        servings: r.servings,
        matchedCount: r.matchedCount,
        totalIngredients: r.totalIngredients,
        averageRating: r.averageRating,
        reviewCount: r.reviewCount,
        isFavorite: favoriteKeys.has(`${r.source}:${r.id}`),
      }),
    );

    const localCount = data.filter((r) => r.source === 'LOCAL').length;
    return {
      data,
      meta: {
        count: data.length,
        localCount,
        spoonacularCount: data.length - localCount,
        hasMore: nextCursor !== null,
        nextCursor,
      },
    };
  }

  private async loadFavoriteKeys(userId: number, page: RankedRecipe[]) {
    if (page.length === 0) return new Set<string>();

    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        OR: page.map((r) => ({ recipeId: r.id, source: r.source })),
      },
      select: { recipeId: true, source: true },
    });
    return new Set(favorites.map((f) => `${f.source}:${f.recipeId}`));
  }
}
