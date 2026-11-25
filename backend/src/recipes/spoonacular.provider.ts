import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Chỉ có parseIngredients: đây là nguồn dự phòng cho NutritionService
// (Mục 7.6), chưa phải RecipeProvider đầy đủ cho tìm kiếm/chi tiết.
const PARSE_INGREDIENTS_ENDPOINT =
  'https://api.spoonacular.com/recipes/parseIngredients';

// Đơn vị của Spoonacular trùng với ingredient_nutrition (Mục 7.5) nên không
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
 * chỉ số chính nào — dòng đó coi như không có dữ liệu dinh dưỡng hợp lệ
 * (Mục 7.5).
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

@Injectable()
export class SpoonacularProvider {
  private readonly logger = new Logger(SpoonacularProvider.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Gọi POST /recipes/parseIngredients MỘT lần cho cả công thức (Mục 7.6) và
   * trả về dinh dưỡng của từng dòng theo đúng thứ tự đầu vào; phần tử null là
   * dòng Spoonacular không ước tính được.
   *
   * Đây chỉ là nguồn dự phòng: thiếu SPOONACULAR_API_KEY hoặc gọi lỗi thì ghi
   * log rồi trả về mảng rỗng, không ném lỗi, để việc lưu công thức (UC-17,
   * UC-19) không bị ảnh hưởng.
   */
  async parseIngredients(lines: string[]): Promise<(ParsedNutrition | null)[]> {
    if (lines.length === 0) return [];

    const apiKey = this.configService.get<string>('SPOONACULAR_API_KEY');
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
