import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpoonacularProvider } from '../recipes/providers/spoonacular.provider';
import { Prisma } from '../generated/prisma/client';
import { NutritionCoverage } from '../generated/prisma/enums';

// Bốn chỉ số bắt buộc của ingredient_nutrition: luôn có mặt trong kết
// quả khi coverage khác NONE.
const MAIN_KEYS = ['calories', 'protein', 'fat', 'carbohydrates'] as const;
// Ba chỉ số phụ: chỉ xuất hiện khi có ít nhất một nguyên liệu mang số liệu.
const EXTRA_KEYS = ['fiber', 'sugar', 'sodium'] as const;

type MainKey = (typeof MAIN_KEYS)[number];
type ExtraKey = (typeof EXTRA_KEYS)[number];

// Quy đổi theo tỷ lệ trong cùng nhóm đơn vị (khối lượng, thể tích).
const MASS_IN_GRAMS: Record<string, number> = { g: 1, kg: 1000 };
const VOLUME_IN_MILLILITRES: Record<string, number> = { ml: 1, l: 1000 };

// Khối JSON ghi vào recipes.nutrition: dinh dưỡng cho MỘT khẩu phần.
export type RecipeNutrition = Record<MainKey, number> &
  Partial<Record<ExtraKey, number>>;

// Một dòng ingredient_nutrition đã đổi Decimal sang number.
export type NutritionBasis = Record<MainKey, number> &
  Record<ExtraKey, number | null> & {
    basisQuantity: number;
    basisUnit: string;
  };

// Dữ liệu danh mục cần cho quy đổi của một ingredient đã đối chiếu được.
export type IngredientFacts = {
  commonUnit: string | null;
  gramsPerCommonUnit: number | null;
  mlPerCommonUnit: number | null;
  nutrition: NutritionBasis | null;
};

// Tổng dinh dưỡng của MỘT dòng nguyên liệu, đã ứng với đúng quantity/unit của
// dòng đó nên không cần quy đổi nữa.
export type LineNutrition = Record<MainKey, number> &
  Record<ExtraKey, number | null>;

// Một dòng recipe_ingredients ở dạng đã sẵn sàng để tính.
export type NutritionLine = {
  quantity: number | null;
  unit: string | null;
  // null khi dòng chưa đối chiếu được với danh mục ingredients.
  facts: IngredientFacts | null;
  // Số liệu dự phòng từ Spoonacular cho dòng chưa đối chiếu được;
  // chỉ dùng để tính, không ghi vào danh mục nội bộ.
  fallback?: LineNutrition | null;
};

export type NutritionResult = {
  nutrition: RecipeNutrition | null;
  coverage: NutritionCoverage;
};

// Chuẩn hoá chuỗi dùng để so khớp: lowercase, trim, gộp khoảng trắng thừa.
export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Làm tròn 2 chữ số thập phân để JSON không mang sai số dấu phẩy động.
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Prisma trả cột DECIMAL dưới dạng Decimal, không phải number.
function toNumber(value: unknown): number {
  return Number(value);
}

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Quy đổi quantity/unit của một dòng về đúng basis_unit của ingredient.
 * Trả về lượng tính theo basis_unit, hoặc null khi không quy
 * đổi được: thiếu dữ liệu dinh dưỡng, thiếu quantity/unit, hoặc đơn vị không
 * thuộc cùng nhóm và cũng không trùng common_unit.
 */
export function toBasisAmount(line: NutritionLine): number | null {
  const facts = line.facts;
  const basis = facts?.nutrition;
  if (!facts || !basis || basis.basisQuantity <= 0) return null;
  // Dòng không ghi số lượng (ví dụ "muối vừa đủ") thì không quy đổi được.
  if (line.quantity === null || line.quantity <= 0) return null;
  if (line.unit === null) return null;

  const unit = normalizeName(line.unit);
  const basisUnit = normalizeName(basis.basisUnit);

  // Cùng nhóm khối lượng (g, kg) hoặc thể tích (ml, l): quy đổi theo tỷ lệ.
  const ratio =
    basisUnit === 'g'
      ? MASS_IN_GRAMS[unit]
      : basisUnit === 'ml'
        ? VOLUME_IN_MILLILITRES[unit]
        : undefined;
  if (ratio !== undefined) return line.quantity * ratio;

  // Trùng common_unit: dùng grams_per_common_unit khi basis là g, còn
  // ml_per_common_unit khi basis là ml.
  const commonUnit = facts.commonUnit;
  if (commonUnit !== null && normalizeName(commonUnit) === unit) {
    const perUnit =
      basisUnit === 'g'
        ? facts.gramsPerCommonUnit
        : basisUnit === 'ml'
          ? facts.mlPerCommonUnit
          : null;
    if (perUnit !== null && perUnit > 0) return line.quantity * perUnit;
  }

  return null;
}

/**
 * Nhân một bộ chỉ số theo hệ số quy đổi của dòng. Chỉ số phụ để trống thì giữ
 * trống, không coi là 0.
 */
function scaleBasis(basis: NutritionBasis, factor: number): LineNutrition {
  const result = {} as LineNutrition;
  for (const key of MAIN_KEYS) {
    result[key] = basis[key] * factor;
  }
  for (const key of EXTRA_KEYS) {
    const value = basis[key];
    result[key] = value === null ? null : value * factor;
  }
  return result;
}

/**
 * Cộng tổng các chỉ số, chia theo servings và xác định coverage.
 * Dòng không quy đổi được bị bỏ qua, không làm sai tổng.
 */
export function computeRecipeNutrition(
  lines: NutritionLine[],
  servings: number,
): NutritionResult {
  const totals: Record<MainKey, number> = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
  };
  const extras: Record<ExtraKey, number | null> = {
    fiber: null,
    sugar: null,
    sodium: null,
  };
  let converted = 0;

  for (const line of lines) {
    const amount = toBasisAmount(line);
    const basis = line.facts?.nutrition;

    // Danh mục nội bộ là nguồn chính; số liệu dự phòng chỉ dùng cho dòng không
    // đối chiếu/quy đổi được.
    const contribution =
      amount !== null && basis
        ? scaleBasis(basis, amount / basis.basisQuantity)
        : (line.fallback ?? null);
    if (!contribution) continue;

    converted += 1;

    for (const key of MAIN_KEYS) {
      totals[key] += contribution[key];
    }
    // Chỉ số phụ có thể trống ở một số nguyên liệu: chỉ cộng phần có số liệu.
    for (const key of EXTRA_KEYS) {
      const value = contribution[key];
      if (value !== null) {
        extras[key] = (extras[key] ?? 0) + value;
      }
    }
  }

  // Không dòng nào quy đổi được: nutrition để trống, công thức vẫn được lưu.
  if (converted === 0) {
    return { nutrition: null, coverage: NutritionCoverage.NONE };
  }

  // servings là Int NOT NULL và form đã chặn giá trị không hợp lệ; chặn thêm ở
  // đây để dữ liệu cũ bất thường không gây chia cho 0.
  const perServing = servings > 0 ? servings : 1;

  const nutrition = {} as RecipeNutrition;
  for (const key of MAIN_KEYS) {
    nutrition[key] = round2(totals[key] / perServing);
  }
  for (const key of EXTRA_KEYS) {
    const value = extras[key];
    if (value !== null) {
      nutrition[key] = round2(value / perServing);
    }
  }

  return {
    nutrition,
    coverage:
      converted === lines.length
        ? NutritionCoverage.FULL
        : NutritionCoverage.PARTIAL,
  };
}

type RecipeIngredientRow = {
  id: number;
  ingredientId: number | null;
  nameEn: string | null;
  quantity: unknown;
  unit: string | null;
};

// Một dòng văn bản cho parseIngredients, ví dụ "500 g chicken breast" hoặc
// "2 chicken egg" khi dòng không ghi đơn vị.
function toIngredientText(
  quantity: number,
  unit: string | null,
  nameEn: string,
): string {
  const parts = [String(quantity), unit?.trim() ?? '', nameEn.trim()];
  return parts.filter((part) => part !== '').join(' ');
}

@Injectable()
export class NutritionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spoonacular: SpoonacularProvider,
  ) {}

  /**
   * Tính lại dinh dưỡng cho một công thức LOCAL và lưu vào recipes
   * (dùng khi đăng và sửa công thức). Dòng không đối chiếu được với danh mục
   * nội bộ sẽ thử nguồn dự phòng Spoonacular.
   */
  async calculate(recipeId: number): Promise<NutritionResult> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        servings: true,
        ingredients: {
          select: {
            id: true,
            ingredientId: true,
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

    const rows = await this.matchIngredients(recipe.ingredients);
    const [factsById, fallbackByRow] = await Promise.all([
      this.loadFacts(rows),
      this.loadFallback(rows),
    ]);

    const lines: NutritionLine[] = rows.map((row) => ({
      quantity: toNullableNumber(row.quantity),
      unit: row.unit,
      facts:
        row.ingredientId === null
          ? null
          : (factsById.get(row.ingredientId) ?? null),
      fallback: fallbackByRow.get(row.id) ?? null,
    }));

    const result = computeRecipeNutrition(lines, recipe.servings);

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        // Cột JSON nullable: phải dùng Prisma.DbNull để ghi NULL.
        nutrition: result.nutrition ?? Prisma.DbNull,
        nutritionCoverage: result.coverage,
        nutritionUpdatedAt: new Date(),
      },
    });

    return result;
  }

  /**
   * Gán ingredient_id cho các dòng chưa đối chiếu, bằng cách so khớp CHÍNH XÁC
   * name_en đã chuẩn hoá với ingredients.name_en — không fuzzy.
   */
  private async matchIngredients(
    rows: RecipeIngredientRow[],
  ): Promise<RecipeIngredientRow[]> {
    const pending = rows.filter(
      (row) => row.ingredientId === null && row.nameEn?.trim(),
    );
    if (pending.length === 0) return rows;

    const names = [
      ...new Set(pending.map((row) => normalizeName(row.nameEn ?? ''))),
    ];

    // Collation mặc định của MySQL (utf8mb4_*_ci) nên so khớp này không phân
    // biệt hoa thường; chuẩn hoá lại ở JS để map không phụ thuộc cách viết.
    const catalog = await this.prisma.ingredient.findMany({
      where: { nameEn: { in: names } },
      select: { id: true, nameEn: true },
    });
    const idByName = new Map(
      catalog.map((item) => [normalizeName(item.nameEn), item.id]),
    );

    const matched = new Map<number, number[]>();
    const result = rows.map((row) => {
      if (row.ingredientId !== null || !row.nameEn?.trim()) return row;

      const ingredientId = idByName.get(normalizeName(row.nameEn));
      if (ingredientId === undefined) return row;

      // Gom theo ingredient_id để ghi mỗi id một lệnh thay vì mỗi dòng một lệnh.
      matched.set(ingredientId, [...(matched.get(ingredientId) ?? []), row.id]);
      return { ...row, ingredientId };
    });

    await Promise.all(
      [...matched].map(([ingredientId, ids]) =>
        this.prisma.recipeIngredient.updateMany({
          where: { id: { in: ids } },
          data: { ingredientId },
        }),
      ),
    );

    return result;
  }

  /**
   * Nguồn dự phòng cho các dòng chưa đối chiếu được với danh mục nội bộ mà có
   * name_en: gộp toàn bộ các dòng đó của công thức vào một lần gọi
   * parseIngredients. Kết quả chỉ dùng để tính, KHÔNG ghi ngược vào ingredients
   * hay ingredient_nutrition. Trả về map theo recipe_ingredients.id.
   */
  private async loadFallback(
    rows: RecipeIngredientRow[],
  ): Promise<Map<number, LineNutrition>> {
    const pending = rows.filter((row) => {
      const quantity = toNullableNumber(row.quantity);
      // Dòng không ghi số lượng (ví dụ "muối vừa đủ") thì nguồn dự phòng cũng
      // không ước tính được đúng lượng, bỏ qua như nhánh nội bộ.
      return (
        row.ingredientId === null &&
        !!row.nameEn?.trim() &&
        quantity !== null &&
        quantity > 0
      );
    });
    if (pending.length === 0) return new Map();

    // Đơn vị được gửi đúng như người dùng ghi; Spoonacular tự bỏ qua đơn vị nó
    // không hiểu.
    const parsed = await this.spoonacular.parseIngredients(
      pending.map((row) =>
        toIngredientText(toNumber(row.quantity), row.unit, row.nameEn ?? ''),
      ),
    );

    return new Map(
      pending.flatMap((row, index): [number, LineNutrition][] => {
        const nutrition = parsed[index];
        return nutrition ? [[row.id, nutrition]] : [];
      }),
    );
  }

  // Tải danh mục và ingredient_nutrition cho các dòng đã có ingredient_id.
  private async loadFacts(
    rows: RecipeIngredientRow[],
  ): Promise<Map<number, IngredientFacts>> {
    const ids = [
      ...new Set(
        rows
          .map((row) => row.ingredientId)
          .filter((id): id is number => id !== null),
      ),
    ];
    if (ids.length === 0) return new Map();

    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        commonUnit: true,
        gramsPerCommonUnit: true,
        mlPerCommonUnit: true,
        nutrition: {
          select: {
            basisQuantity: true,
            basisUnit: true,
            calories: true,
            protein: true,
            fat: true,
            carbohydrates: true,
            fiber: true,
            sugar: true,
            sodium: true,
          },
        },
      },
    });

    return new Map(
      ingredients.map((item) => [
        item.id,
        {
          commonUnit: item.commonUnit,
          gramsPerCommonUnit: toNullableNumber(item.gramsPerCommonUnit),
          mlPerCommonUnit: toNullableNumber(item.mlPerCommonUnit),
          nutrition: item.nutrition
            ? {
                basisQuantity: toNumber(item.nutrition.basisQuantity),
                basisUnit: item.nutrition.basisUnit,
                calories: toNumber(item.nutrition.calories),
                protein: toNumber(item.nutrition.protein),
                fat: toNumber(item.nutrition.fat),
                carbohydrates: toNumber(item.nutrition.carbohydrates),
                fiber: toNullableNumber(item.nutrition.fiber),
                sugar: toNullableNumber(item.nutrition.sugar),
                sodium: toNullableNumber(item.nutrition.sodium),
              }
            : null,
        },
      ]),
    );
  }
}
