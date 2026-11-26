import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { LocalDbProvider, splitSteps } from './providers/local-db.provider';

const prismaMock = {
  recipe: { findUnique: jest.fn() },
};

const recipeRow = {
  id: 1,
  authorId: 3,
  title: 'Phở bò',
  servings: 2,
  readyInMinutes: 45,
  diets: ['gluten free'],
  dishTypes: ['soup'],
  steps: 'Bước 1\r\nBước 2',
  imageUrl: 'https://example.com/pho.jpg',
  videoUrl: null,
  nutrition: { calories: 500 },
  nutritionCoverage: 'FULL',
  author: { id: 3, name: 'Nam', deletedAt: null },
  ingredients: [
    {
      id: 10,
      recipeId: 1,
      ingredientId: 5,
      nameVi: 'Bánh phở',
      nameEn: 'Rice noodles',
      quantity: { toString: () => '200.00' },
      unit: 'g',
      sortOrder: 1,
    },
    {
      id: 11,
      recipeId: 1,
      ingredientId: null,
      nameVi: 'Hành lá',
      nameEn: null,
      quantity: null,
      unit: null,
      sortOrder: 2,
    },
  ],
};

describe('LocalDbProvider', () => {
  let provider: LocalDbProvider;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocalDbProvider,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    provider = moduleRef.get(LocalDbProvider);
  });

  it('map đủ trường khi tìm thấy công thức', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue(recipeRow);

    const result = await provider.getById('1');

    expect(prismaMock.recipe.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        author: { select: { id: true, name: true, deletedAt: true } },
      },
    });
    expect(result).toEqual({
      id: '1',
      source: 'LOCAL',
      title: 'Phở bò',
      imageUrl: 'https://example.com/pho.jpg',
      servings: 2,
      readyInMinutes: 45,
      diets: ['gluten free'],
      dishTypes: ['soup'],
      steps: ['Bước 1', 'Bước 2'],
      videoUrl: null,
      ingredients: [
        {
          id: 10,
          nameVi: 'Bánh phở',
          nameEn: 'Rice noodles',
          quantity: 200,
          unit: 'g',
          sortOrder: 1,
        },
        {
          id: 11,
          nameVi: 'Hành lá',
          nameEn: null,
          quantity: null,
          unit: null,
          sortOrder: 2,
        },
      ],
      nutrition: { calories: 500 },
      nutritionCoverage: 'FULL',
      author: { id: 3, name: 'Nam' },
    });
    // id trả về là chuỗi để khớp recipe_id VARCHAR.
    expect(typeof result.id).toBe('string');
  });

  it('404 khi công thức không tồn tại', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue(null);

    await expect(provider.getById('999999')).rejects.toThrow(
      new NotFoundException('Không tìm thấy công thức'),
    );
  });

  it.each(['abc', '7a', '', '-1'])(
    'id sai định dạng (%s) thì 404 và không gọi Prisma',
    async (id) => {
      await expect(provider.getById(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.recipe.findUnique).not.toHaveBeenCalled();
    },
  );

  it('trả mảng rỗng khi diets/dishTypes không phải mảng chuỗi', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      ...recipeRow,
      diets: { a: 1 },
      dishTypes: [1, 2],
    });

    const result = await provider.getById('1');

    expect(result.diets).toEqual([]);
    expect(result.dishTypes).toEqual([]);
  });

  it('trả mảng rỗng khi cột diets/dishTypes là NULL', async () => {
    prismaMock.recipe.findUnique.mockResolvedValue({
      ...recipeRow,
      diets: null,
      dishTypes: null,
    });

    const result = await provider.getById('1');

    expect(result.diets).toEqual([]);
    expect(result.dishTypes).toEqual([]);
  });

  describe('author', () => {
    it('tác giả đã xoá mềm thì author là null', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        ...recipeRow,
        author: { id: 3, name: 'Nam', deletedAt: new Date() },
      });

      const result = await provider.getById('1');

      expect(result.author).toBeNull();
    });

    it('không đọc được tác giả thì author là null', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        ...recipeRow,
        author: null,
      });

      const result = await provider.getById('1');

      expect(result.author).toBeNull();
    });

    it.each([null, '   '])(
      'name rỗng (%s) thì dùng tên mặc định',
      async (name) => {
        prismaMock.recipe.findUnique.mockResolvedValue({
          ...recipeRow,
          author: { id: 3, name, deletedAt: null },
        });

        const result = await provider.getById('1');

        expect(result.author).toEqual({ id: 3, name: 'Người dùng' });
      },
    );
  });

  describe('splitSteps', () => {
    it('tách theo dòng, trim và bỏ dòng rỗng', () => {
      expect(splitSteps('Bước 1\r\nBước 2\n\n  Bước 3  \n')).toEqual([
        'Bước 1',
        'Bước 2',
        'Bước 3',
      ]);
    });

    it('chuỗi chỉ có khoảng trắng thì trả mảng rỗng', () => {
      expect(splitSteps('   \n\r\n  ')).toEqual([]);
    });
  });
});
