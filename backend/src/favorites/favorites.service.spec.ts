import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesService } from './favorites.service';

const prismaMock = {
  favorite: {
    upsert: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const NOW = new Date('2026-01-02T03:04:05.000Z');

function favoriteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    userId: 9,
    recipeId: '7',
    source: RecipeSource.LOCAL,
    titleSnapshot: 'Phở bò',
    imageSnapshot: null,
    createdAt: NOW,
    ...overrides,
  };
}

function dto(overrides: Record<string, unknown> = {}): CreateFavoriteDto {
  return {
    recipeId: '7',
    source: RecipeSource.LOCAL,
    ...overrides,
  } as CreateFavoriteDto;
}

describe('CreateFavoriteDto', () => {
  function errorsFor(payload: Record<string, unknown>) {
    return validateSync(plainToInstance(CreateFavoriteDto, payload));
  }

  it('chấp nhận payload LOCAL tối thiểu', () => {
    expect(
      errorsFor({ recipeId: '7', source: RecipeSource.LOCAL }),
    ).toHaveLength(0);
  });

  it('từ chối source lạ', () => {
    const errors = errorsFor({ recipeId: '7', source: 'MYSQL' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('source');
  });

  it('từ chối recipeId rỗng', () => {
    const errors = errorsFor({ recipeId: '  ', source: RecipeSource.LOCAL });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('recipeId');
  });
});

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.recipe.findMany.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(FavoritesService);
  });

  describe('create (UC-09)', () => {
    it('lưu trùng không báo lỗi và không tạo dòng thứ hai', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        title: 'Phở bò',
        imageUrl: null,
      });
      // upsert luôn trả về đúng dòng cũ cho lần bấm tim thứ hai.
      prismaMock.favorite.upsert.mockResolvedValue(favoriteRow());

      const first = await service.create(9, dto());
      const second = await service.create(9, dto());

      // UC-09 ngoại lệ 2a: cùng một id, không lỗi.
      expect(second).toEqual(first);
      expect(second.id).toBe(1);
      // Không có đường nào tạo dòng mới ngoài nhánh create của upsert.
      expect(prismaMock.favorite.create).not.toHaveBeenCalled();
      expect(prismaMock.favorite.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.favorite.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: {
            userId_recipeId_source: {
              userId: 9,
              recipeId: '7',
              source: RecipeSource.LOCAL,
            },
          },
          // Giữ nguyên bản ghi cũ.
          update: {},
        }),
      );
    });

    it('"007" và "7" rơi vào cùng một dòng', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        title: 'Phở bò',
        imageUrl: null,
      });
      prismaMock.favorite.upsert.mockResolvedValue(favoriteRow());

      await service.create(9, dto({ recipeId: '7' }));
      await service.create(9, dto({ recipeId: '007' }));

      // Chuẩn hoá trước khi ghi nên UNIQUE(user_id, recipe_id, source) bắt được trùng.
      const calls = prismaMock.favorite.upsert.mock.calls as Array<
        [
          {
            where: { userId_recipeId_source: { recipeId: string } };
            create: { recipeId: string };
          },
        ]
      >;
      expect(calls).toHaveLength(2);
      for (const [arg] of calls) {
        expect(arg.where.userId_recipeId_source.recipeId).toBe('7');
        expect(arg.create.recipeId).toBe('7');
      }
      // "007" vẫn tra đúng recipes.id = 7.
      expect(prismaMock.recipe.findUnique).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: { id: 7 } }),
      );
    });

    it('id LOCAL không phải số trả 404', async () => {
      await expect(service.create(9, dto({ recipeId: 'abc' }))).rejects.toThrow(
        NotFoundException,
      );

      // Chặn từ trước khi chạm database.
      expect(prismaMock.recipe.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
    });

    it('LOCAL không tồn tại trong recipes trả 404', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue(null);

      await expect(service.create(9, dto({ recipeId: '404' }))).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
    });

    it('LOCAL lấy snapshot từ recipes, bỏ qua snapshot client gửi', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        title: 'Phở bò',
        imageUrl: 'https://cdn/pho.jpg',
      });
      prismaMock.favorite.upsert.mockResolvedValue(favoriteRow());

      await service.create(
        9,
        dto({ titleSnapshot: 'Tên giả', imageSnapshot: 'https://cdn/gia.jpg' }),
      );

      expect(prismaMock.favorite.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            titleSnapshot: 'Phở bò',
            imageSnapshot: 'https://cdn/pho.jpg',
          }),
        }),
      );
    });

    it('SPOONACULAR thiếu titleSnapshot trả 400', async () => {
      await expect(
        service.create(9, dto({ source: RecipeSource.SPOONACULAR })),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
    });

    it('SPOONACULAR giữ nguyên id và dùng snapshot client gửi', async () => {
      prismaMock.favorite.upsert.mockResolvedValue(
        favoriteRow({
          id: 2,
          recipeId: '007',
          source: RecipeSource.SPOONACULAR,
          titleSnapshot: 'Pasta',
        }),
      );

      const result = await service.create(
        9,
        dto({
          recipeId: '007',
          source: RecipeSource.SPOONACULAR,
          titleSnapshot: 'Pasta',
        }),
      );

      // Không chuẩn hoá id của nguồn ngoài, và không tra bảng recipes.
      expect(prismaMock.recipe.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.favorite.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            recipeId: '007',
            titleSnapshot: 'Pasta',
            imageSnapshot: null,
          }),
        }),
      );
      expect(result).toEqual({
        id: 2,
        recipeId: '007',
        source: RecipeSource.SPOONACULAR,
        title: 'Pasta',
        imageUrl: null,
        createdAt: NOW,
      });
    });
  });

});
