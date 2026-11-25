import { Injectable } from '@nestjs/common';
import { foldVietnamese } from '../../common/utils/text';
import { Prisma, RecipeSource } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LOCAL_MAX_CANDIDATES } from '../recipes.constants';
import { byRelevance } from '../recipe-relevance';
import {
  RankedRecipe,
  RecipeProvider,
  SearchParams,
} from './recipe-provider.interface';

// Các cột cần lấy của bảng recipes cho một thẻ món
const RECIPE_SELECT = {
  id: true,
  title: true,
  imageUrl: true,
  readyInMinutes: true,
  servings: true,
  _count: { select: { ingredients: true } },
} as const;

type RecipeRow = Prisma.RecipeGetPayload<{ select: typeof RECIPE_SELECT }>;

interface Rating {
  average: number | null;
  count: number;
}

@Injectable()
export class LocalDbProvider implements RecipeProvider {
  constructor(private readonly prisma: PrismaService) {}

  // Trả về danh sách món cộng đồng đã xếp hạng
  async search(params: SearchParams): Promise<RankedRecipe[]> {
    const recipeWhere = this.buildRecipeWhere(params);
    const hasIngredients = params.ingredients.length > 0;

    // matchedById: recipeId -> số nguyên liệu khớp (chỉ có khi tìm theo nguyên liệu)
    const matchedById = new Map<number, number>();
    let recipes: RecipeRow[];

    if (hasIngredients) {
      const groups = await this.countMatchedIngredients(params.ingredients, recipeWhere);
      groups.forEach((g) => matchedById.set(g.recipeId, g._count._all));
      recipes = await this.prisma.recipe.findMany({
        where: { id: { in: groups.map((g) => g.recipeId) } },
        select: RECIPE_SELECT,
      });
    } else {
      // Chỉ tìm theo tên (và/hoặc bộ lọc)
      recipes = await this.prisma.recipe.findMany({
        where: recipeWhere,
        orderBy: { createdAt: 'desc' },
        take: LOCAL_MAX_CANDIDATES,
        select: RECIPE_SELECT,
      });
    }

    const ratings = await this.loadRatings(recipes.map((r) => r.id));

    return recipes
      .map((r) =>
        this.toRanked(r, ratings.get(String(r.id)), {
          matchedCount: hasIngredients ? (matchedById.get(r.id) ?? 0) : null,
          totalIngredients: hasIngredients ? r._count.ingredients : null,
          nameTier: this.nameTier(r.title, params.name),
        }),
      )
      .sort(byRelevance);
  }

  // Món cộng đồng "nổi tiếng" cho Trang chủ.
  async popular(limit: number): Promise<RankedRecipe[]> {
    // Lượt yêu thích của mọi món LOCAL: recipeId (chuỗi) -> số lượt
    const favoriteRows = await this.prisma.favorite.groupBy({
      by: ['recipeId'],
      where: { source: RecipeSource.LOCAL },
      _count: { _all: true },
    });
    const favorites = new Map<string, number>(
      favoriteRows.map((f) => [f.recipeId, f._count._all]),
    );

    const ratings = await this.loadRatings();

    const signalIds = new Set([...favorites.keys(), ...ratings.keys()]);
    const rows = await this.prisma.recipe.findMany({
      where: { id: { in: [...signalIds].map(Number).filter(Number.isInteger) } },
      select: RECIPE_SELECT,
    });

    const score = (r: RecipeRow) => ({
      favorites: favorites.get(String(r.id)) ?? 0,
      average: ratings.get(String(r.id))?.average ?? 0,
      reviews: ratings.get(String(r.id))?.count ?? 0,
    });
    rows.sort((a, b) => {
      const x = score(a);
      const y = score(b);
      return y.favorites - x.favorites || y.average - x.average || y.reviews - x.reviews || b.id - a.id;
    });

    let top = rows.slice(0, limit);

    // Chưa đủ món (dữ liệu còn ít): bù bằng các món mới nhất chưa có trong danh sách.
    if (top.length < limit) {
      const filler = await this.prisma.recipe.findMany({
        where: { id: { notIn: top.map((r) => r.id) } },
        orderBy: { id: 'desc' },
        take: limit - top.length,
        select: RECIPE_SELECT,
      });
      top = [...top, ...filler];
    }

    return top.map((r) =>
      this.toRanked(r, ratings.get(String(r.id)), {
        matchedCount: null,
        totalIngredients: null,
      }),
    );
  }

  // Đổi một dòng recipes thành món dùng để xếp hạng / trả về.
  private toRanked(
    r: RecipeRow,
    rating: Rating | undefined,
    extra: Pick<RankedRecipe, 'matchedCount' | 'totalIngredients' | 'nameTier'>,
  ): RankedRecipe {
    return {
      id: String(r.id),
      source: 'LOCAL',
      title: r.title,
      imageUrl: r.imageUrl,
      readyInMinutes: r.readyInMinutes,
      servings: r.servings,
      averageRating: rating?.average ?? null,
      reviewCount: rating?.count ?? 0,
      ...extra,
    };
  }

  // Điều kiện lọc trên bảng recipes: tên, thời gian nấu, chế độ ăn, loại món.
  private buildRecipeWhere(p: SearchParams): Prisma.RecipeWhereInput {
    const where: Prisma.RecipeWhereInput = {};

    if (p.name) {
      const withD = p.name.replace(/d/gi, 'đ');
      where.OR = [{ title: { contains: p.name } }, { title: { contains: withD } }];
    }
    if (p.maxReadyTime) where.readyInMinutes = { lte: p.maxReadyTime };
    if (p.diet) where.diets = { array_contains: p.diet };
    if (p.type) where.dishTypes = { array_contains: p.type };

    return where;
  }

  // Đếm, với mỗi công thức, có bao nhiêu nguyên liệu khớp với nguyên liệu người dùng chọn.
  private async countMatchedIngredients(
    namesEn: string[],
    recipeWhere: Prisma.RecipeWhereInput,
  ) {
    const catalog = await this.prisma.ingredient.findMany({
      where: { nameEn: { in: namesEn } },
      select: { id: true, nameVi: true },
    });

    return this.prisma.recipeIngredient.groupBy({
      by: ['recipeId'],
      where: {
        recipe: recipeWhere,
        OR: [
          { ingredientId: { in: catalog.map((i) => i.id) } },
          { nameEn: { in: namesEn } },
          { nameVi: { in: catalog.map((i) => i.nameVi) } },
        ],
      },
      _count: { _all: true },
      orderBy: [{ _count: { recipeId: 'desc' } }, { recipeId: 'desc' }],
      take: LOCAL_MAX_CANDIDATES,
    });
  }

  // Điểm đánh giá trung bình và số đánh giá của các công thức LOCAL
  private async loadRatings(recipeIds?: number[]) {
    const rows = await this.prisma.recipeReview.groupBy({
      by: ['recipeId'],
      where: {
        source: RecipeSource.LOCAL,
        ...(recipeIds && { recipeId: { in: recipeIds.map(String) } }),
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const map = new Map<string, Rating>();
    for (const row of rows) {
      const avg = row._avg.rating;
      map.set(row.recipeId, {
        average: avg === null ? null : Math.round(avg * 10) / 10,
        count: row._count._all,
      });
    }
    return map;
  }

  // Mức khớp tên: 0 = trùng hẳn, 1 = bắt đầu bằng, 2 = có chứa (so sánh bỏ dấu).
  private nameTier(title: string, name?: string): 0 | 1 | 2 | undefined {
    if (!name) return undefined;
    const t = foldVietnamese(title);
    const n = foldVietnamese(name);
    if (t === n) return 0;
    if (t.startsWith(n)) return 1;
    return 2;
  }
}
