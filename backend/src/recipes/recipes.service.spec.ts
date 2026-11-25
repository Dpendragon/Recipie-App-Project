import { NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { ReviewsService } from '../reviews/reviews.service';
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

const txMock = {
  recipe: { create: jest.fn() },
  recipeIngredient: { createMany: jest.fn(), findMany: jest.fn() },
};

const prismaMock = {
  favorite: { findUnique: jest.fn() },
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

    const moduleRef = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: LocalDbProvider, useValue: localDbProviderMock },
        { provide: ReviewsService, useValue: reviewsServiceMock },
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
        nutritionCoverage: null,
        author: { id: 3, name: 'Nam' },
        rating: { average: 0, count: 0 },
        favoriteId: null,
      });
      // Công thức mới chưa thể có đánh giá hay yêu thích.
      expect(reviewsServiceMock.getRatingSummary).not.toHaveBeenCalled();
      expect(prismaMock.favorite.findUnique).not.toHaveBeenCalled();
    });
  });
});
