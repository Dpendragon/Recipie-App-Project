import { Logger, NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { NutritionCoverage, RecipeSource } from '../generated/prisma/enums';
import { ReviewsService } from '../reviews/reviews.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { LocalDbProvider } from './local-db.provider';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import type { RecipeDetail } from './recipe-provider.interface';

const detail = {
  id: '1',
  title: 'Phở bò',
  author: { id: 3, name: 'Nam' },
} as RecipeDetail;

const localDbProviderMock = {
  getById: jest.fn(),
};

const reviewsServiceMock = {
  getRatingSummary: jest.fn(),
};

const nutritionServiceMock = {
  calculate: jest.fn(),
};

const txMock = {
  recipe: { create: jest.fn() },
  recipeIngredient: { createMany: jest.fn(), findMany: jest.fn() },
};

const prismaMock = {
  favorite: { findUnique: jest.fn() },
  recipe: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

// Payload tối thiểu hợp lệ cho POST /recipes; mỗi test chỉ đổi phần cần thiết.
function createPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Phở bò',
    servings: 2,
    steps: ['Ninh xương', 'Chan nước dùng'],
    ingredients: [{ nameVi: 'Bánh phở' }],
    ...overrides,
  };
}

describe('CreateRecipeDto', () => {
  function errorsFor(payload: Record<string, unknown>) {
    return validateSync(plainToInstance(CreateRecipeDto, payload));
  }

  it('chấp nhận payload tối thiểu', () => {
    expect(errorsFor(createPayload())).toHaveLength(0);
  });

  it('từ chối khi thiếu title', () => {
    const errors = errorsFor(createPayload({ title: undefined }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('title');
  });

  it('từ chối servings bằng 0', () => {
    const errors = errorsFor(createPayload({ servings: 0 }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('servings');
  });

  it('từ chối danh sách nguyên liệu rỗng', () => {
    const errors = errorsFor(createPayload({ ingredients: [] }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('ingredients');
  });

  it('từ chối danh sách bước thực hiện rỗng', () => {
    const errors = errorsFor(createPayload({ steps: [] }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('steps');
  });

  it('bước chỉ có khoảng trắng bị loại nên cũng coi như rỗng', () => {
    const errors = errorsFor(createPayload({ steps: ['   ', ''] }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('steps');
  });

  it('từ chối nguyên liệu thiếu nameVi', () => {
    const errors = errorsFor(createPayload({ ingredients: [{ unit: 'g' }] }));

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('ingredients');
  });
});

describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    localDbProviderMock.getById.mockResolvedValue(detail);
    reviewsServiceMock.getRatingSummary.mockResolvedValue({
      average: 4.5,
      count: 2,
    });
    prismaMock.favorite.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation(
      (fn: (tx: typeof txMock) => unknown) => fn(txMock),
    );
    nutritionServiceMock.calculate.mockResolvedValue({
      nutrition: null,
      coverage: NutritionCoverage.NONE,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: LocalDbProvider, useValue: localDbProviderMock },
        { provide: ReviewsService, useValue: reviewsServiceMock },
        { provide: NutritionService, useValue: nutritionServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(RecipesService);
  });

  it('source LOCAL thì gọi LocalDbProvider và ghép thêm rating, favoriteId', async () => {
    prismaMock.favorite.findUnique.mockResolvedValue({ id: 42 });

    const result = await service.getById('1', RecipeSource.LOCAL, 7);

    expect(localDbProviderMock.getById).toHaveBeenCalledTimes(1);
    expect(localDbProviderMock.getById).toHaveBeenCalledWith('1');
    // Giữ nguyên các trường đang có, chỉ thêm rating và favoriteId.
    expect(result).toEqual({
      ...detail,
      rating: { average: 4.5, count: 2 },
      favoriteId: 42,
    });
  });

  it('source SPOONACULAR thì 501 và không chạm LocalDbProvider', async () => {
    await expect(
      service.getById('716429', RecipeSource.SPOONACULAR, 7),
    ).rejects.toThrow(
      new NotImplementedException('Chưa hỗ trợ nguồn Spoonacular'),
    );
    expect(localDbProviderMock.getById).not.toHaveBeenCalled();
    expect(reviewsServiceMock.getRatingSummary).not.toHaveBeenCalled();
    expect(prismaMock.favorite.findUnique).not.toHaveBeenCalled();
  });

  it('chưa có đánh giá thì rating là { average: 0, count: 0 }', async () => {
    reviewsServiceMock.getRatingSummary.mockResolvedValue({
      average: 0,
      count: 0,
    });

    const result = await service.getById('1', RecipeSource.LOCAL, 7);

    expect(result.rating).toEqual({ average: 0, count: 0 });
    expect(reviewsServiceMock.getRatingSummary).toHaveBeenCalledWith(
      '1',
      RecipeSource.LOCAL,
    );
  });

  it('chưa lưu yêu thích thì favoriteId là null', async () => {
    const result = await service.getById('1', RecipeSource.LOCAL, 7);

    expect(result.favoriteId).toBeNull();
    expect(prismaMock.favorite.findUnique).toHaveBeenCalledWith({
      where: {
        userId_recipeId_source: {
          userId: 7,
          recipeId: '1',
          source: RecipeSource.LOCAL,
        },
      },
      select: { id: true },
    });
  });

  it('LOCAL chuẩn hoá recipeId trước khi tra rating và favorites', async () => {
    prismaMock.favorite.findUnique.mockResolvedValue({ id: 42 });

    const result = await service.getById('007', RecipeSource.LOCAL, 7);

    // Provider vẫn nhận id gốc; chỉ khoá tra bảng VARCHAR mới chuẩn hoá.
    expect(localDbProviderMock.getById).toHaveBeenCalledWith('007');
    expect(reviewsServiceMock.getRatingSummary).toHaveBeenCalledWith(
      '7',
      RecipeSource.LOCAL,
    );
    expect(prismaMock.favorite.findUnique).toHaveBeenCalledWith({
      where: {
        userId_recipeId_source: {
          userId: 7,
          recipeId: '7',
          source: RecipeSource.LOCAL,
        },
      },
      select: { id: true },
    });
    expect(result.favoriteId).toBe(42);
  });

  describe('create (UC-17)', () => {
    const recipeRow = {
      id: 12,
      title: 'Phở bò',
      servings: 2,
      readyInMinutes: null,
      diets: null,
      dishTypes: null,
      steps: 'Ninh xương\nChan nước dùng',
      imageUrl: null,
      videoUrl: null,
      nutrition: null,
      nutritionCoverage: null,
      author: { id: 3, name: 'Nam', deletedAt: null },
    };

    function dto(overrides: Partial<CreateRecipeDto> = {}) {
      return plainToInstance(
        CreateRecipeDto,
        createPayload(overrides as Record<string, unknown>),
      );
    }

    beforeEach(() => {
      txMock.recipe.create.mockResolvedValue(recipeRow);
      txMock.recipeIngredient.createMany.mockResolvedValue({ count: 1 });
      txMock.recipeIngredient.findMany.mockResolvedValue([
        {
          id: 20,
          nameVi: 'Bánh phở',
          nameEn: null,
          quantity: null,
          unit: null,
          sortOrder: 1,
        },
      ]);
    });

    it('ghi recipes và recipe_ingredients trong cùng một transaction', async () => {
      await service.create(3, dto());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(txMock.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authorId: 3,
            title: 'Phở bò',
            servings: 2,
            // Cột steps là TEXT: mỗi bước một dòng.
            steps: 'Ninh xương\nChan nước dùng',
          }),
        }),
      );
      expect(txMock.recipeIngredient.createMany).toHaveBeenCalledTimes(1);
    });

    it('tạo xong có đủ nguyên liệu, sort_order theo thứ tự mảng', async () => {
      txMock.recipeIngredient.findMany.mockResolvedValue([
        {
          id: 20,
          nameVi: 'Bánh phở',
          nameEn: 'Rice noodles',
          quantity: { toString: () => '200.00' },
          unit: 'g',
          sortOrder: 1,
        },
        {
          id: 21,
          nameVi: 'Hành lá',
          nameEn: null,
          quantity: null,
          unit: null,
          sortOrder: 2,
        },
      ]);

      const result = await service.create(
        3,
        dto({
          ingredients: [
            {
              nameVi: 'Bánh phở',
              nameEn: 'Rice noodles',
              quantity: 200,
              unit: 'g',
            },
            { nameVi: 'Hành lá' },
          ],
        }),
      );

      expect(txMock.recipeIngredient.createMany).toHaveBeenCalledWith({
        data: [
          {
            recipeId: 12,
            nameVi: 'Bánh phở',
            nameEn: 'Rice noodles',
            quantity: 200,
            unit: 'g',
            sortOrder: 1,
          },
          {
            recipeId: 12,
            nameVi: 'Hành lá',
            nameEn: null,
            quantity: null,
            unit: null,
            sortOrder: 2,
          },
        ],
      });
      expect(result.ingredients).toEqual([
        {
          id: 20,
          nameVi: 'Bánh phở',
          nameEn: 'Rice noodles',
          quantity: 200,
          unit: 'g',
          sortOrder: 1,
        },
        {
          id: 21,
          nameVi: 'Hành lá',
          nameEn: null,
          quantity: null,
          unit: null,
          sortOrder: 2,
        },
      ]);
    });

    it('trả về cùng định dạng GET /recipes/:id, rating 0 và favoriteId null', async () => {
      const result = await service.create(3, dto());

      expect(result).toEqual({
        id: '12',
        source: RecipeSource.LOCAL,
        title: 'Phở bò',
        imageUrl: null,
        servings: 2,
        readyInMinutes: null,
        diets: null,
        dishTypes: null,
        // steps được tách lại thành string[] giống GET /recipes/:id.
        steps: ['Ninh xương', 'Chan nước dùng'],
        videoUrl: null,
        ingredients: [
          {
            id: 20,
            nameVi: 'Bánh phở',
            nameEn: null,
            quantity: null,
            unit: null,
            sortOrder: 1,
          },
        ],
        nutrition: null,
        nutritionCoverage: NutritionCoverage.NONE,
        author: { id: 3, name: 'Nam' },
        rating: { average: 0, count: 0 },
        favoriteId: null,
      });
      // Công thức mới chưa thể có đánh giá hay yêu thích.
      expect(reviewsServiceMock.getRatingSummary).not.toHaveBeenCalled();
      expect(prismaMock.favorite.findUnique).not.toHaveBeenCalled();
    });

    it('ghi nutrition_coverage = NONE ngay trong transaction (UC-17 8a)', async () => {
      await service.create(3, dto());

      expect(txMock.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nutritionCoverage: NutritionCoverage.NONE,
          }),
        }),
      );
    });

    it('tính dinh dưỡng NGOÀI transaction và trả coverage vừa tính', async () => {
      const nutrition = {
        calories: 320.5,
        protein: 12,
        fat: 8.25,
        carbohydrates: 48,
      };
      nutritionServiceMock.calculate.mockResolvedValue({
        nutrition,
        coverage: NutritionCoverage.PARTIAL,
      });

      const result = await service.create(3, dto());

      expect(nutritionServiceMock.calculate).toHaveBeenCalledWith(12);
      // Chỉ nhận id: NutritionService tự dùng prisma của nó, không nhận tx.
      expect(nutritionServiceMock.calculate.mock.calls[0]).toHaveLength(1);
      expect(result.nutrition).toEqual(nutrition);
      expect(result.nutritionCoverage).toBe(NutritionCoverage.PARTIAL);
    });

    it('coverage FULL khi mọi nguyên liệu quy đổi được', async () => {
      nutritionServiceMock.calculate.mockResolvedValue({
        nutrition: { calories: 100, protein: 5, fat: 2, carbohydrates: 10 },
        coverage: NutritionCoverage.FULL,
      });

      const result = await service.create(3, dto());

      expect(result.nutritionCoverage).toBe(NutritionCoverage.FULL);
    });

    it('NutritionService lỗi thì công thức vẫn lưu, coverage NONE, không ném lỗi', async () => {
      nutritionServiceMock.calculate.mockRejectedValue(
        new Error('Spoonacular timeout'),
      );
      // Service ghi log lỗi: chặn lại để output test không nhiễu.
      const logSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      const result = await service.create(3, dto());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('12');
      expect(result.nutrition).toBeNull();
      expect(result.nutritionCoverage).toBe(NutritionCoverage.NONE);
      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });

  describe('listMine (UC-18)', () => {
    const rows = [
      {
        id: 12,
        title: 'Phở bò',
        imageUrl: null,
        readyInMinutes: 90,
        servings: 2,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 5,
        title: 'Bún chả',
        imageUrl: 'https://img/5.jpg',
        readyInMinutes: null,
        servings: 4,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ];

    it('chỉ lấy công thức của chính mình, id giảm dần', async () => {
      prismaMock.recipe.findMany.mockResolvedValue(rows);

      const result = await service.listMine(3, {});

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: 3 },
          orderBy: { id: 'desc' },
          take: 21,
        }),
      );
      // Không có cursor thì không được gửi cursor/skip.
      const args = prismaMock.recipe.findMany.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(args.cursor).toBeUndefined();
      expect(args.skip).toBeUndefined();
      expect(result).toEqual({
        data: rows,
        meta: { nextCursor: null, hasMore: false },
      });
    });

    it('mỗi phần tử chỉ gồm 6 trường theo đặc tả', async () => {
      prismaMock.recipe.findMany.mockResolvedValue(rows);

      await service.listMine(3, {});

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            title: true,
            imageUrl: true,
            readyInMinutes: true,
            servings: true,
            createdAt: true,
          },
        }),
      );
    });

    it('còn trang sau thì cắt dòng thừa và trả nextCursor', async () => {
      prismaMock.recipe.findMany.mockResolvedValue(rows);

      const result = await service.listMine(3, { limit: 1 });

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
      expect(result.data).toEqual([rows[0]]);
      expect(result.meta).toEqual({ nextCursor: 12, hasMore: true });
    });

    it('có cursor thì bỏ qua đúng dòng của trang trước', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([rows[1]]);

      const result = await service.listMine(3, { cursor: 12, limit: 20 });

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 12 }, skip: 1 }),
      );
      expect(result.meta).toEqual({ nextCursor: null, hasMore: false });
    });

    it('limit vượt mức tối đa bị kẹp về 50', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([]);

      const result = await service.listMine(3, { limit: 999 });

      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 51 }),
      );
      // Chưa đăng công thức nào: danh sách rỗng, không lỗi (UC-18 ngoại lệ 2a).
      expect(result).toEqual({
        data: [],
        meta: { nextCursor: null, hasMore: false },
      });
    });
  });
});
