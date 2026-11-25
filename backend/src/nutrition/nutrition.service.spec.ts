import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SpoonacularProvider } from '../recipes/spoonacular.provider';
import { Prisma } from '../generated/prisma/client';
import { NutritionCoverage } from '../generated/prisma/enums';
import {
  computeRecipeNutrition,
  NutritionService,
  toBasisAmount,
  type IngredientFacts,
  type LineNutrition,
  type NutritionLine,
} from './nutrition.service';

// Số liệu lấy đúng theo seed hiện có (prisma/seed.ts: 64 ingredients,
// 52 ingredient_nutrition) để test phản ánh dữ liệu thật của đồ án.
const WHITE_RICE: IngredientFacts = {
  commonUnit: null,
  gramsPerCommonUnit: null,
  mlPerCommonUnit: null,
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'g',
    calories: 365,
    protein: 7.1,
    fat: 0.7,
    carbohydrates: 80,
    fiber: 1.3,
    sugar: 0.1,
    sodium: 5,
  },
};

const CHICKEN_BREAST: IngredientFacts = {
  commonUnit: null,
  gramsPerCommonUnit: null,
  mlPerCommonUnit: null,
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'g',
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 74,
  },
};

// commonUnit 'quả' = 50 g, basis theo g.
const CHICKEN_EGG: IngredientFacts = {
  commonUnit: 'quả',
  gramsPerCommonUnit: 50,
  mlPerCommonUnit: null,
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'g',
    calories: 155,
    protein: 13,
    fat: 11,
    carbohydrates: 1.1,
    fiber: 0,
    sugar: 1.1,
    sodium: 124,
  },
};

// commonUnit 'quả' = 120 g, basis theo g.
const TOMATO: IngredientFacts = {
  commonUnit: 'quả',
  gramsPerCommonUnit: 120,
  mlPerCommonUnit: null,
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'g',
    calories: 18,
    protein: 0.9,
    fat: 0.2,
    carbohydrates: 3.9,
    fiber: 1.2,
    sugar: 2.6,
    sodium: 5,
  },
};

// commonUnit 'muỗng canh' = 15 ml, basis theo ml.
const COOKING_OIL: IngredientFacts = {
  commonUnit: 'muỗng canh',
  gramsPerCommonUnit: null,
  mlPerCommonUnit: 15,
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'ml',
    calories: 884,
    protein: 0,
    fat: 100,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  },
};

// Muối ăn: sodium rất lớn, dùng để thấy rõ dòng thiếu quantity bị bỏ qua.
const SALT: IngredientFacts = {
  commonUnit: null,
  gramsPerCommonUnit: null,
  mlPerCommonUnit: null,
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'g',
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    sodium: 38700,
  },
};

// Bột năng (id 14 trong seed) nằm trong ingredients nhưng không có
// ingredient_nutrition.
const TAPIOCA_STARCH: IngredientFacts = {
  commonUnit: null,
  gramsPerCommonUnit: null,
  mlPerCommonUnit: null,
  nutrition: null,
};

// Số liệu Spoonacular trả cho một dòng: tổng ứng với đúng lượng của dòng đó.
const PARSED_DRAGON_FRUIT: LineNutrition = {
  calories: 60,
  protein: 1.2,
  fat: 0.4,
  carbohydrates: 13,
  fiber: 3,
  sugar: 8,
  sodium: 0,
};

function line(
  quantity: number | null,
  unit: string | null,
  facts: IngredientFacts | null,
  fallback: LineNutrition | null = null,
): NutritionLine {
  return { quantity, unit, facts, fallback };
}

describe('toBasisAmount', () => {
  it('quy đổi g và kg về basis_unit g theo tỷ lệ', () => {
    expect(toBasisAmount(line(500, 'g', CHICKEN_BREAST))).toBe(500);
    expect(toBasisAmount(line(1, 'kg', WHITE_RICE))).toBe(1000);
    expect(toBasisAmount(line(0.5, 'kg', WHITE_RICE))).toBe(500);
  });

  it('quy đổi ml và l về basis_unit ml theo tỷ lệ', () => {
    expect(toBasisAmount(line(250, 'ml', COOKING_OIL))).toBe(250);
    expect(toBasisAmount(line(0.5, 'l', COOKING_OIL))).toBe(500);
  });

  it('quy đổi common_unit sang g bằng grams_per_common_unit', () => {
    expect(toBasisAmount(line(2, 'quả', TOMATO))).toBe(240);
    expect(toBasisAmount(line(4, 'quả', CHICKEN_EGG))).toBe(200);
  });

  it('quy đổi common_unit sang ml bằng ml_per_common_unit', () => {
    expect(toBasisAmount(line(2, 'muỗng canh', COOKING_OIL))).toBe(30);
  });

  it('so khớp common_unit sau khi chuẩn hoá hoa thường và khoảng trắng', () => {
    expect(toBasisAmount(line(1, '  Muỗng   Canh ', COOKING_OIL))).toBe(15);
    expect(toBasisAmount(line(100, ' G ', WHITE_RICE))).toBe(100);
  });

  it('không quy đổi khi đơn vị khác nhóm với basis_unit', () => {
    // basis theo g nhưng dòng ghi ml: không có khối lượng riêng để quy đổi.
    expect(toBasisAmount(line(100, 'ml', WHITE_RICE))).toBeNull();
    // basis theo ml nhưng dòng ghi g.
    expect(toBasisAmount(line(100, 'g', COOKING_OIL))).toBeNull();
  });

  it('không quy đổi khi đơn vị lạ hoặc không trùng common_unit', () => {
    expect(toBasisAmount(line(2, 'muỗng', TOMATO))).toBeNull();
    expect(toBasisAmount(line(2, 'lát', TOMATO))).toBeNull();
  });

  it('không quy đổi khi thiếu quantity, thiếu unit hoặc không có dữ liệu dinh dưỡng', () => {
    expect(toBasisAmount(line(null, 'g', SALT))).toBeNull();
    expect(toBasisAmount(line(100, null, SALT))).toBeNull();
    expect(toBasisAmount(line(100, 'g', TAPIOCA_STARCH))).toBeNull();
    expect(toBasisAmount(line(100, 'g', null))).toBeNull();
  });
});

describe('computeRecipeNutrition', () => {
  it('cộng tổng theo g/kg và trả coverage FULL', () => {
    const result = computeRecipeNutrition(
      [line(500, 'g', CHICKEN_BREAST), line(1, 'kg', WHITE_RICE)],
      1,
    );

    expect(result.coverage).toBe(NutritionCoverage.FULL);
    expect(result.nutrition).toEqual({
      // 165*5 + 365*10
      calories: 4475,
      // 31*5 + 7.1*10
      protein: 226,
      // 3.6*5 + 0.7*10
      fat: 25,
      // 0 + 80*10
      carbohydrates: 800,
      fiber: 13,
      sugar: 1,
      sodium: 420,
    });
  });

  it('cộng tổng theo ml/l và trả coverage FULL', () => {
    const result = computeRecipeNutrition(
      [line(250, 'ml', COOKING_OIL), line(0.5, 'l', COOKING_OIL)],
      1,
    );

    expect(result.coverage).toBe(NutritionCoverage.FULL);
    expect(result.nutrition).toEqual({
      // 884 * (250 + 500)/100
      calories: 6630,
      protein: 0,
      fat: 750,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    });
  });

  it('cộng tổng theo common_unit cho cả basis g và basis ml', () => {
    const result = computeRecipeNutrition(
      [line(2, 'quả', TOMATO), line(2, 'muỗng canh', COOKING_OIL)],
      1,
    );

    expect(result.coverage).toBe(NutritionCoverage.FULL);
    expect(result.nutrition).toEqual({
      // 18*2.4 + 884*0.3
      calories: 308.4,
      protein: 2.16,
      // 0.2*2.4 + 100*0.3
      fat: 30.48,
      carbohydrates: 9.36,
      fiber: 2.88,
      sugar: 6.24,
      sodium: 12,
    });
  });

  it('chia tổng theo servings', () => {
    const lines = [line(500, 'g', CHICKEN_BREAST)];

    expect(computeRecipeNutrition(lines, 1).nutrition).toEqual({
      calories: 825,
      protein: 155,
      fat: 18,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 370,
    });
    expect(computeRecipeNutrition(lines, 4).nutrition).toEqual({
      calories: 206.25,
      protein: 38.75,
      fat: 4.5,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      sodium: 92.5,
    });
  });

  it('dòng thiếu quantity không làm sai tổng, chỉ hạ coverage xuống PARTIAL', () => {
    const withSalt = computeRecipeNutrition(
      [line(500, 'g', CHICKEN_BREAST), line(null, null, SALT)],
      1,
    );
    const withoutSalt = computeRecipeNutrition(
      [line(500, 'g', CHICKEN_BREAST)],
      1,
    );

    expect(withSalt.nutrition).toEqual(withoutSalt.nutrition);
    // sodium của muối (38700mg/100g) không được cộng vào.
    expect(withSalt.nutrition?.sodium).toBe(370);
    expect(withSalt.coverage).toBe(NutritionCoverage.PARTIAL);
  });

  it('PARTIAL khi có dòng chưa đối chiếu hoặc thiếu dữ liệu dinh dưỡng', () => {
    const result = computeRecipeNutrition(
      [
        line(2, 'quả', TOMATO),
        // Bột năng: có trong danh mục nhưng không có ingredient_nutrition.
        line(50, 'g', TAPIOCA_STARCH),
        // Chưa đối chiếu được với danh mục.
        line(100, 'g', null),
      ],
      1,
    );

    expect(result.coverage).toBe(NutritionCoverage.PARTIAL);
    expect(result.nutrition).toEqual({
      calories: 43.2,
      protein: 2.16,
      fat: 0.48,
      carbohydrates: 9.36,
      fiber: 2.88,
      sugar: 6.24,
      sodium: 12,
    });
  });

  it('cộng số liệu dự phòng cho dòng chưa đối chiếu và vẫn đạt FULL', () => {
    const result = computeRecipeNutrition(
      [
        line(2, 'quả', TOMATO),
        // Không có trong danh mục nội bộ, lấy được từ nguồn dự phòng.
        line(100, 'g', null, PARSED_DRAGON_FRUIT),
      ],
      1,
    );

    expect(result.coverage).toBe(NutritionCoverage.FULL);
    expect(result.nutrition).toEqual({
      // 18*2.4 + 60
      calories: 103.2,
      protein: 3.36,
      fat: 0.88,
      carbohydrates: 22.36,
      fiber: 5.88,
      sugar: 14.24,
      sodium: 12,
    });
  });

  it('ưu tiên danh mục nội bộ, bỏ qua số liệu dự phòng khi đã quy đổi được', () => {
    const withFallback = computeRecipeNutrition(
      [line(2, 'quả', TOMATO, PARSED_DRAGON_FRUIT)],
      1,
    );

    expect(withFallback).toEqual(
      computeRecipeNutrition([line(2, 'quả', TOMATO)], 1),
    );
  });

  it('NONE và nutrition null khi không dòng nào quy đổi được', () => {
    const result = computeRecipeNutrition(
      [line(50, 'g', TAPIOCA_STARCH), line(2, 'muỗng', TOMATO)],
      2,
    );

    expect(result).toEqual({
      nutrition: null,
      coverage: NutritionCoverage.NONE,
    });
  });

  it('NONE khi công thức không có dòng nguyên liệu nào', () => {
    expect(computeRecipeNutrition([], 2)).toEqual({
      nutrition: null,
      coverage: NutritionCoverage.NONE,
    });
  });

  it('bỏ qua chỉ số phụ khi mọi nguyên liệu đóng góp đều để trống', () => {
    const noExtras: IngredientFacts = {
      ...WHITE_RICE,
      nutrition: {
        ...WHITE_RICE.nutrition!,
        fiber: null,
        sugar: null,
        sodium: null,
      },
    };

    const result = computeRecipeNutrition([line(100, 'g', noExtras)], 1);

    expect(result.nutrition).toEqual({
      calories: 365,
      protein: 7.1,
      fat: 0.7,
      carbohydrates: 80,
    });
  });
});

describe('NutritionService.calculate', () => {
  const prismaMock = {
    recipe: { findUnique: jest.fn(), update: jest.fn() },
    ingredient: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn() },
    ingredientNutrition: { create: jest.fn(), upsert: jest.fn() },
    recipeIngredient: { updateMany: jest.fn() },
  };
  const spoonacularMock = { parseIngredients: jest.fn() };

  let service: NutritionService;

  // ingredient.findMany được gọi hai lần với mục đích khác nhau: lần đối chiếu
  // chỉ chọn nameEn, lần tải dữ liệu dinh dưỡng chọn nutrition.
  function mockIngredientQueries(
    catalog: { id: number; nameEn: string }[],
    facts: unknown[],
  ): void {
    prismaMock.ingredient.findMany.mockImplementation(
      (args: { select: Record<string, unknown> }) =>
        Promise.resolve(args.select.nutrition ? facts : catalog),
    );
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.recipe.update.mockResolvedValue({});
    prismaMock.recipeIngredient.updateMany.mockResolvedValue({ count: 1 });
    // Mặc định nguồn dự phòng không trả gì (thiếu key hoặc lỗi mạng).
    spoonacularMock.parseIngredients.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        NutritionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SpoonacularProvider, useValue: spoonacularMock },
      ],
    }).compile();
    service = moduleRef.get(NutritionService);
  });

  it('gán ingredient_id bằng so khớp chính xác name_en rồi lưu nutrition', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      servings: 2,
      ingredients: [
        {
          id: 11,
          ingredientId: null,
          nameEn: '  Chicken Breast ',
          quantity: 500,
          unit: 'g',
        },
        {
          id: 12,
          ingredientId: null,
          nameEn: 'Dragon fruit jam',
          quantity: 100,
          unit: 'g',
        },
      ],
    });
    mockIngredientQueries(
      [{ id: 7, nameEn: 'Chicken breast' }],
      [{ id: 7, ...CHICKEN_BREAST }],
    );

    const result = await service.calculate(8);

    // Chỉ dòng khớp chính xác được gán, dòng còn lại giữ NULL (không fuzzy).
    expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { nameEn: { in: ['chicken breast', 'dragon fruit jam'] } },
      }),
    );
    expect(prismaMock.recipeIngredient.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.recipeIngredient.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [11] } },
      data: { ingredientId: 7 },
    });

    expect(result.coverage).toBe(NutritionCoverage.PARTIAL);
    expect(prismaMock.recipe.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: {
        nutrition: {
          calories: 412.5,
          protein: 77.5,
          fat: 9,
          carbohydrates: 0,
          fiber: 0,
          sugar: 0,
          sodium: 185,
        },
        nutritionCoverage: NutritionCoverage.PARTIAL,
        nutritionUpdatedAt: expect.any(Date),
      },
    });
  });

  it('gọi parseIngredients MỘT lần cho các dòng chưa khớp và dùng kết quả để tính', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      servings: 1,
      ingredients: [
        {
          id: 31,
          ingredientId: 30,
          nameEn: 'Tomato',
          quantity: 100,
          unit: 'g',
        },
        {
          id: 32,
          ingredientId: null,
          nameEn: 'Dragon fruit',
          quantity: 150,
          unit: 'g',
        },
        {
          id: 33,
          ingredientId: null,
          nameEn: 'Starfruit',
          quantity: 2,
          unit: null,
        },
      ],
    });
    mockIngredientQueries([], [{ id: 30, ...TOMATO }]);
    // Dòng thứ hai Spoonacular cũng không ước tính được.
    spoonacularMock.parseIngredients.mockResolvedValue([
      PARSED_DRAGON_FRUIT,
      null,
    ]);

    const result = await service.calculate(12);

    // Một lần gọi cho cả công thức, không gọi riêng từng dòng.
    expect(spoonacularMock.parseIngredients).toHaveBeenCalledTimes(1);
    expect(spoonacularMock.parseIngredients).toHaveBeenCalledWith([
      '150 g Dragon fruit',
      '2 Starfruit',
    ]);

    expect(result.coverage).toBe(NutritionCoverage.PARTIAL);
    expect(result.nutrition).toEqual({
      calories: 78,
      protein: 2.1,
      fat: 0.6,
      carbohydrates: 16.9,
      fiber: 4.2,
      sugar: 10.6,
      sodium: 5,
    });

    // Kết quả dự phòng KHÔNG được ghi ngược vào danh mục nội bộ (Mục 7.6).
    expect(prismaMock.ingredient.create).not.toHaveBeenCalled();
    expect(prismaMock.ingredient.upsert).not.toHaveBeenCalled();
    expect(prismaMock.ingredientNutrition.create).not.toHaveBeenCalled();
    expect(prismaMock.ingredientNutrition.upsert).not.toHaveBeenCalled();
    expect(prismaMock.recipeIngredient.updateMany).not.toHaveBeenCalled();
  });

  it('không gọi nguồn dự phòng cho dòng thiếu name_en hoặc thiếu số lượng', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      servings: 1,
      ingredients: [
        { id: 41, ingredientId: null, nameEn: null, quantity: 100, unit: 'g' },
        {
          id: 42,
          ingredientId: null,
          nameEn: 'Salt',
          quantity: null,
          unit: null,
        },
      ],
    });
    mockIngredientQueries([], []);

    const result = await service.calculate(13);

    expect(spoonacularMock.parseIngredients).not.toHaveBeenCalled();
    expect(result.coverage).toBe(NutritionCoverage.NONE);
  });

  it('vẫn lưu nutrition khi nguồn dự phòng không dùng được', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      servings: 1,
      ingredients: [
        {
          id: 51,
          ingredientId: 30,
          nameEn: 'Tomato',
          quantity: 100,
          unit: 'g',
        },
        {
          id: 52,
          ingredientId: null,
          nameEn: 'Dragon fruit',
          quantity: 150,
          unit: 'g',
        },
      ],
    });
    mockIngredientQueries([], [{ id: 30, ...TOMATO }]);
    // Thiếu SPOONACULAR_API_KEY hoặc lỗi mạng: provider trả mảng rỗng.
    spoonacularMock.parseIngredients.mockResolvedValue([]);

    const result = await service.calculate(14);

    expect(result.coverage).toBe(NutritionCoverage.PARTIAL);
    expect(result.nutrition?.calories).toBe(18);
    expect(prismaMock.recipe.update).toHaveBeenCalledTimes(1);
  });

  it('không truy vấn đối chiếu khi mọi dòng đã có ingredient_id', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      servings: 4,
      ingredients: [
        {
          id: 44,
          ingredientId: 21,
          nameEn: 'Chicken egg',
          quantity: 4,
          unit: 'quả',
        },
      ],
    });
    mockIngredientQueries([], [{ id: 21, ...CHICKEN_EGG }]);

    const result = await service.calculate(7);

    expect(prismaMock.recipeIngredient.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.ingredient.findMany).toHaveBeenCalledTimes(1);
    expect(result.coverage).toBe(NutritionCoverage.FULL);
    // 4 quả * 50 g = 200 g -> 155*2 kcal, chia 4 khẩu phần.
    expect(result.nutrition?.calories).toBe(77.5);
  });

  it('ghi NULL vào cột JSON khi coverage là NONE', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      servings: 2,
      ingredients: [
        {
          id: 21,
          ingredientId: 14,
          nameEn: 'Tapioca starch',
          quantity: 50,
          unit: 'g',
        },
      ],
    });
    mockIngredientQueries([], [{ id: 14, ...TAPIOCA_STARCH }]);

    const result = await service.calculate(3);

    expect(result.nutrition).toBeNull();
    expect(prismaMock.recipe.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        nutrition: Prisma.DbNull,
        nutritionCoverage: NutritionCoverage.NONE,
        nutritionUpdatedAt: expect.any(Date),
      },
    });
  });

  it('ném 404 khi không có công thức', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue(null);

    await expect(service.calculate(999)).rejects.toThrow(
      'Không tìm thấy công thức',
    );
    expect(prismaMock.recipe.update).not.toHaveBeenCalled();
  });
});
