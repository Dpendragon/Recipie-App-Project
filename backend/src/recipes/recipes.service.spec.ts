import { NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { ReviewsService } from '../reviews/reviews.service';
import { LocalDbProvider } from './local-db.provider';
import { RecipesService } from './recipes.service';
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

const prismaMock = {
  favorite: { findUnique: jest.fn() },
};

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
});
