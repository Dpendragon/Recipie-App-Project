import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NutritionCoverage, RecipeSource } from '../../generated/prisma/enums';
import { SPOONACULAR_RESULT_COUNT } from '../recipes.constants';
import {
  RankedRecipe,
  RecipeDetail,
  RecipeIngredientDetail,
  RecipeProvider,
  SearchParams,
} from './recipe-provider.interface';

const BASE_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const INFORMATION_URL = 'https://api.spoonacular.com/recipes';
const TIMEOUT_MS = 5000;
const NOT_FOUND_MESSAGE = 'Không tìm thấy công thức';
const UNAVAILABLE_MESSAGE =
  'Nguồn công thức mở rộng tạm thời không khả dụng, vui lòng thử lại sau';
const PARSE_INGREDIENTS_ENDPOINT =
  'https://api.spoonacular.com/recipes/parseIngredients';

interface SpoonacularRecipe {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  usedIngredients?: unknown[];
  missedIngredients?: unknown[];
}

// Các trường dùng tới của GET /recipes/{id}/information.
interface SpoonacularInformation {
  id: number;
  title?: string;
  image?: string;
  servings?: number;
  readyInMinutes?: number;
  diets?: unknown;
  dishTypes?: unknown;
  instructions?: string | null;
  analyzedInstructions?: { steps?: { step?: unknown }[] }[];
  extendedIngredients?: {
    id?: number;
    name?: string;
    nameClean?: string | null;
    original?: string;
    amount?: number;
    unit?: string;
  }[];
  nutrition?: unknown;
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : null;
}

// Ưu tiên các bước đã tách sẵn; không có thì tách đoạn hướng dẫn (có thể là HTML).
function toSteps(info: SpoonacularInformation): string[] {
  const analyzed = (info.analyzedInstructions ?? [])
    .flatMap((block) => block.steps ?? [])
    .map((s) => (typeof s.step === 'string' ? s.step.trim() : ''))
    .filter(Boolean);
  if (analyzed.length > 0) return analyzed;

  return (info.instructions ?? '')
    .replace(/<\/(li|p)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toIngredients(info: SpoonacularInformation): RecipeIngredientDetail[] {
  return (info.extendedIngredients ?? []).map((item, index) => {
    const name = item.name?.trim() || `Nguyên liệu ${index + 1}`;
    return {
      id: item.id ?? index + 1,
      // Spoonacular chỉ có tiếng Anh: hiện nguyên dòng gốc cho dễ đọc.
      nameVi: item.original?.trim() || name,
      nameEn: item.nameClean?.trim() || name,
      quantity: typeof item.amount === 'number' ? Math.round(item.amount * 100) / 100 : null,
      unit: item.unit?.trim() || null,
      sortOrder: index,
    };
  });
}

// Đơn vị của Spoonacular trùng với ingredient_nutrition nên không
// phải quy đổi: kcal cho calories, g cho protein/fat/carbohydrates/fiber/sugar,
// mg cho sodium.
export type ParsedNutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
};

type Nutrient = { name?: unknown; amount?: unknown };

/**
 * Đọc mảng nutrition.nutrients của một dòng đã parse. Trả null khi thiếu bất kỳ
 * chỉ số chính nào — dòng đó coi như không có dữ liệu dinh dưỡng hợp lệ.
 */
function toParsedNutrition(item: unknown): ParsedNutrition | null {
  const nutrients = (item as { nutrition?: { nutrients?: unknown } } | null)
    ?.nutrition?.nutrients;
  if (!Array.isArray(nutrients)) return null;

  const amountByName = new Map<string, number>();
  for (const entry of nutrients as Nutrient[]) {
    const name = entry?.name;
    const amount = entry?.amount;
    if (typeof name === 'string' && typeof amount === 'number') {
      amountByName.set(name.trim().toLowerCase(), amount);
    }
  }

  const pick = (name: string): number | null => amountByName.get(name) ?? null;

  const calories = pick('calories');
  const protein = pick('protein');
  const fat = pick('fat');
  const carbohydrates = pick('carbohydrates');
  if (
    calories === null ||
    protein === null ||
    fat === null ||
    carbohydrates === null
  ) {
    return null;
  }

  return {
    calories,
    protein,
    fat,
    carbohydrates,
    fiber: pick('fiber'),
    sugar: pick('sugar'),
    sodium: pick('sodium'),
  };
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

  // Chi tiết một món Spoonacular, trả về cùng định dạng với món nội bộ.
  // Dinh dưỡng của Spoonacular đã tính sẵn theo một khẩu phần.
  async getById(id: string): Promise<RecipeDetail> {
    if (!/^\d+$/.test(id)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const apiKey = this.config.get<string>('SPOONACULAR_API_KEY');
    if (!apiKey) {
      this.logger.warn('Thiếu SPOONACULAR_API_KEY, không xem được món Spoonacular');
      throw new ServiceUnavailableException(UNAVAILABLE_MESSAGE);
    }

    let info: SpoonacularInformation;
    try {
      const url = new URL(`${INFORMATION_URL}/${id}/information`);
      url.searchParams.set('includeNutrition', 'true');
      const response = await fetch(url, {
        headers: { 'x-api-key': apiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status === 404) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      if (!response.ok) {
        throw new Error(`Spoonacular trả về HTTP ${response.status}`);
      }
      info = (await response.json()) as SpoonacularInformation;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.warn(`Không lấy được chi tiết món Spoonacular ${id}`, error);
      throw new ServiceUnavailableException(UNAVAILABLE_MESSAGE);
    }

    const parsed = toParsedNutrition(info);
    // Giống khối nutrition của món nội bộ: chỉ số phụ nào không có thì bỏ hẳn.
    const nutrition = parsed
      ? Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== null))
      : null;

    return {
      id: String(info.id),
      source: RecipeSource.SPOONACULAR,
      title: info.title?.trim() || 'Món không tên',
      imageUrl: info.image ?? null,
      servings: info.servings && info.servings > 0 ? info.servings : 1,
      readyInMinutes: info.readyInMinutes ?? null,
      diets: toStringArray(info.diets),
      dishTypes: toStringArray(info.dishTypes),
      steps: toSteps(info),
      videoUrl: null,
      ingredients: toIngredients(info),
      nutrition,
      nutritionCoverage: nutrition ? NutritionCoverage.FULL : NutritionCoverage.NONE,
      author: null,
    };
  }

  /**
   * Gọi POST /recipes/parseIngredients một lần cho cả công thức và
   * trả về dinh dưỡng của từng dòng theo đúng thứ tự đầu vào; phần tử null là
   * dòng Spoonacular không ước tính được.
   *
   * Đây chỉ là nguồn dự phòng: thiếu SPOONACULAR_API_KEY hoặc gọi lỗi thì ghi
   * log rồi trả về mảng rỗng, không ném lỗi, để việc đăng/sửa công thức
   * không bị ảnh hưởng.
   */
  async parseIngredients(lines: string[]): Promise<(ParsedNutrition | null)[]> {
    if (lines.length === 0) return [];

    const apiKey = this.config.get<string>('SPOONACULAR_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'Thiếu SPOONACULAR_API_KEY: bỏ qua nguồn dinh dưỡng dự phòng',
      );
      return [];
    }

    const url = `${PARSE_INGREDIENTS_ENDPOINT}?apiKey=${encodeURIComponent(apiKey)}`;
    const body = new URLSearchParams({
      ingredientList: lines.join('\n'),
      // servings = 1 để kết quả là tổng ứng với đúng lượng ghi ở mỗi dòng;
      // chia theo khẩu phần của công thức do NutritionService đảm nhiệm.
      servings: '1',
      includeNutrition: 'true',
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.warn(
          `Spoonacular parseIngredients trả ${response.status}: ${detail}`,
        );
        return [];
      }

      const items: unknown = await response.json();
      if (!Array.isArray(items)) {
        this.logger.warn(
          'Spoonacular parseIngredients trả body không phải mảng',
        );
        return [];
      }

      // Giữ đúng thứ tự đầu vào để người gọi map lại theo index.
      return lines.map((_, index) => toParsedNutrition(items[index]));
    } catch (error) {
      this.logger.warn('Không gọi được Spoonacular parseIngredients', error);
      return [];
    }
  }
}
