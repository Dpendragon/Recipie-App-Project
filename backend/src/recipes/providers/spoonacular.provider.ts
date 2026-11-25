import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SPOONACULAR_RESULT_COUNT } from '../recipes.constants';
import {
  RankedRecipe,
  RecipeProvider,
  SearchParams,
} from './recipe-provider.interface';

const BASE_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const TIMEOUT_MS = 5000;

interface SpoonacularRecipe {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  usedIngredients?: unknown[];
  missedIngredients?: unknown[];
}

// Nguồn SPOONACULAR: công thức bên ngoài, chỉ dùng bổ sung khi kho cộng đồng ít món.
@Injectable()
export class SpoonacularProvider implements RecipeProvider {
  private readonly logger = new Logger(SpoonacularProvider.name);

  constructor(private readonly config: ConfigService) {}

  async search(params: SearchParams): Promise<RankedRecipe[]> {
    const apiKey = this.config.get<string>('SPOONACULAR_API_KEY');
    if (!apiKey) {
      this.logger.warn('Thiếu SPOONACULAR_API_KEY, bỏ qua nguồn Spoonacular');
      return [];
    }

    const hasIngredients = params.ingredients.length > 0;

    const url = new URL(BASE_URL);
    const query = url.searchParams;
    query.set('number', String(SPOONACULAR_RESULT_COUNT));
    query.set('addRecipeInformation', 'true'); 
    query.set('fillIngredients', 'true');
    if (params.name) query.set('query', params.name);
    if (hasIngredients) {
      query.set('includeIngredients', params.ingredients.join(','));
      query.set('sort', 'max-used-ingredients');
    }
    if (params.diet) query.set('diet', params.diet);
    if (params.type) query.set('type', params.type);
    if (params.maxReadyTime) query.set('maxReadyTime', String(params.maxReadyTime));

    const response = await fetch(url, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Spoonacular trả về HTTP ${response.status}`);
    }

    const body = (await response.json()) as { results?: SpoonacularRecipe[] };

    return (body.results ?? []).map((r): RankedRecipe => {
      const used = r.usedIngredients?.length ?? 0;
      const missed = r.missedIngredients?.length ?? 0;
      return {
        id: String(r.id),
        source: 'SPOONACULAR',
        title: r.title,
        imageUrl: r.image ?? null,
        readyInMinutes: r.readyInMinutes ?? null,
        servings: r.servings ?? null,
        matchedCount: hasIngredients ? used : null,
        totalIngredients: hasIngredients ? used + missed : null,
        averageRating: null,
        reviewCount: 0,
      };
    });
  }
}
