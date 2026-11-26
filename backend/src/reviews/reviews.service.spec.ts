import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

const prismaMock = {
  recipeReview: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const NOW = new Date('2026-01-02T03:04:05.000Z');

function reviewRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    userId: 9,
    recipeId: '7',
    source: RecipeSource.LOCAL,
    titleSnapshot: 'Phở bò',
    imageSnapshot: null,
    rating: 5,
    comment: 'Ngon',
    createdAt: NOW,
    updatedAt: NOW,
    user: { name: 'An', deletedAt: null },
    ...overrides,
  };
}

function emptySummary() {
  prismaMock.recipeReview.aggregate.mockResolvedValue({
    _avg: { rating: null },
    _count: { _all: 0 },
  });
}

describe('CreateReviewDto', () => {
  function errorsFor(payload: Record<string, unknown>) {
    return validateSync(plainToInstance(CreateReviewDto, payload));
  }

  it.each([0, 6, -1, 2.5])('từ chối rating %s', (rating) => {
    const errors = errorsFor({ rating });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('rating');
  });

  it.each([1, 3, 5])('chấp nhận rating %s', (rating) => {
    expect(errorsFor({ rating })).toHaveLength(0);
  });

  it('từ chối nhận xét dài hơn 1000 ký tự', () => {
    const errors = errorsFor({ rating: 4, comment: 'a'.repeat(1001) });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('comment');
  });
});

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(ReviewsService);
  });

  describe('upsert', () => {
    it('lần gửi thứ hai vẫn là upsert theo khoá (userId, recipeId, source), không tạo bản ghi thứ hai', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        title: 'Phở bò',
        imageUrl: 'https://img/pho.jpg',
      });
      prismaMock.recipeReview.upsert.mockResolvedValue(reviewRow());
      prismaMock.recipeReview.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { _all: 1 },
      });

      await service.upsert(9, '7', RecipeSource.LOCAL, { rating: 5 });
      await service.upsert(9, '7', RecipeSource.LOCAL, {
        rating: 4,
        comment: 'Sửa lại',
      });

      expect(prismaMock.recipeReview.upsert).toHaveBeenCalledTimes(2);
      for (const call of prismaMock.recipeReview.upsert.mock.calls) {
        expect(call[0].where).toEqual({
          userId_recipeId_source: {
            userId: 9,
            recipeId: '7',
            source: RecipeSource.LOCAL,
          },
        });
      }
      // Nhánh update làm mới cả snapshot lấy từ bảng recipes.
      expect(prismaMock.recipeReview.upsert.mock.calls[1][0].update).toEqual({
        rating: 4,
        comment: 'Sửa lại',
        titleSnapshot: 'Phở bò',
        imageSnapshot: 'https://img/pho.jpg',
      });
    });

    it('chuẩn hoá recipeId "007" thành "7" và lấy snapshot từ recipes, bỏ qua dữ liệu client', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        title: 'Bún chả',
        imageUrl: null,
      });
      prismaMock.recipeReview.upsert.mockResolvedValue(reviewRow());
      emptySummary();

      await service.upsert(9, '007', RecipeSource.LOCAL, {
        rating: 5,
        titleSnapshot: 'Tên client gửi',
        imageSnapshot: 'https://client/anh.jpg',
      });

      expect(prismaMock.recipe.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        select: { title: true, imageUrl: true },
      });
      const args = prismaMock.recipeReview.upsert.mock.calls[0][0];
      expect(args.where.userId_recipeId_source.recipeId).toBe('7');
      expect(args.create).toEqual({
        userId: 9,
        recipeId: '7',
        source: RecipeSource.LOCAL,
        titleSnapshot: 'Bún chả',
        imageSnapshot: null,
        rating: 5,
        comment: null,
      });
    });

    it('LOCAL với id không phải chuỗi số thì 404', async () => {
      await expect(
        service.upsert(9, 'abc', RecipeSource.LOCAL, { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.recipe.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.recipeReview.upsert).not.toHaveBeenCalled();
    });

    it('LOCAL với công thức không tồn tại thì 404', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.upsert(9, '7', RecipeSource.LOCAL, { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.recipeReview.upsert).not.toHaveBeenCalled();
    });

    it('SPOONACULAR thiếu titleSnapshot thì 400', async () => {
      await expect(
        service.upsert(9, '716429', RecipeSource.SPOONACULAR, { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.recipeReview.upsert).not.toHaveBeenCalled();
    });

    it('SPOONACULAR giữ nguyên recipeId và dùng snapshot của client', async () => {
      prismaMock.recipeReview.upsert.mockResolvedValue(
        reviewRow({ recipeId: '716429', source: RecipeSource.SPOONACULAR }),
      );
      emptySummary();

      await service.upsert(9, '716429', RecipeSource.SPOONACULAR, {
        rating: 4,
        titleSnapshot: 'Pasta',
      });

      expect(prismaMock.recipe.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.recipeReview.upsert.mock.calls[0][0].create).toEqual({
        userId: 9,
        recipeId: '716429',
        source: RecipeSource.SPOONACULAR,
        titleSnapshot: 'Pasta',
        imageSnapshot: null,
        rating: 4,
        comment: null,
      });
    });

    it('trả về đánh giá vừa lưu kèm summary mới', async () => {
      prismaMock.recipe.findUnique.mockResolvedValue({
        title: 'Phở bò',
        imageUrl: null,
      });
      prismaMock.recipeReview.upsert.mockResolvedValue(
        reviewRow({ rating: 4 }),
      );
      prismaMock.recipeReview.aggregate.mockResolvedValue({
        _avg: { rating: 4.25 },
        _count: { _all: 2 },
      });

      const result = await service.upsert(9, '7', RecipeSource.LOCAL, {
        rating: 4,
      });

      expect(result).toEqual({
        review: {
          id: 1,
          rating: 4,
          comment: 'Ngon',
          createdAt: NOW,
          updatedAt: NOW,
          author: { name: 'An' },
        },
        summary: { average: 4.3, count: 2 },
      });
    });
  });

  describe('getRatingSummary', () => {
    it('làm tròn 1 chữ số thập phân và bỏ qua tác giả đã xoá', async () => {
      prismaMock.recipeReview.aggregate.mockResolvedValue({
        _avg: { rating: 4.666666 },
        _count: { _all: 3 },
      });

      const summary = await service.getRatingSummary('7', RecipeSource.LOCAL);

      expect(prismaMock.recipeReview.aggregate).toHaveBeenCalledWith({
        where: {
          recipeId: '7',
          source: RecipeSource.LOCAL,
          user: { deletedAt: null },
        },
        _avg: { rating: true },
        _count: { _all: true },
      });
      expect(summary).toEqual({ average: 4.7, count: 3 });
    });

    it('chưa có đánh giá nào thì average = 0 và count = 0', async () => {
      emptySummary();

      expect(await service.getRatingSummary('7', RecipeSource.LOCAL)).toEqual({
        average: 0,
        count: 0,
      });
    });

    it('chuẩn hoá recipeId LOCAL trước khi tính', async () => {
      emptySummary();

      await service.getRatingSummary('007', RecipeSource.LOCAL);

      expect(prismaMock.recipeReview.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ recipeId: '7' }),
        }),
      );
    });
  });

  describe('listByRecipe', () => {
    it('loại đánh giá của tác giả đã xoá, sắp theo updatedAt rồi id giảm dần', async () => {
      emptySummary();
      prismaMock.recipeReview.findUnique.mockResolvedValue(null);
      prismaMock.recipeReview.findMany.mockResolvedValue([]);

      await service.listByRecipe(9, '7', RecipeSource.LOCAL, {});

      expect(prismaMock.recipeReview.findMany).toHaveBeenCalledWith({
        where: {
          recipeId: '7',
          source: RecipeSource.LOCAL,
          userId: { not: 9 },
          user: { deletedAt: null },
        },
        include: { user: { select: { name: true, deletedAt: true } } },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
    });

    it('trang cuối trả hasMore = false và nextCursor = null', async () => {
      emptySummary();
      prismaMock.recipeReview.findUnique.mockResolvedValue(null);
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({ id: 5 }),
        reviewRow({ id: 4 }),
      ]);

      const result = await service.listByRecipe(9, '7', RecipeSource.LOCAL, {
        limit: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({ nextCursor: null, hasMore: false });
    });

    it('còn trang sau thì cắt dòng thừa và trả nextCursor là id dòng cuối', async () => {
      emptySummary();
      prismaMock.recipeReview.findUnique.mockResolvedValue(null);
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({ id: 5 }),
        reviewRow({ id: 4 }),
        reviewRow({ id: 3 }),
      ]);

      const result = await service.listByRecipe(9, '7', RecipeSource.LOCAL, {
        limit: 2,
      });

      expect(result.data.map((item) => item.id)).toEqual([5, 4]);
      expect(result.meta).toEqual({ nextCursor: 4, hasMore: true });
    });

    it('có cursor thì dùng cursor + skip 1', async () => {
      emptySummary();
      prismaMock.recipeReview.findUnique.mockResolvedValue(null);
      prismaMock.recipeReview.findMany.mockResolvedValue([]);

      await service.listByRecipe(9, '7', RecipeSource.LOCAL, {
        cursor: 4,
        limit: 2,
      });

      expect(prismaMock.recipeReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 4 }, skip: 1, take: 3 }),
      );
    });

    it('name null thì tên tác giả hiển thị "Người dùng"', async () => {
      emptySummary();
      prismaMock.recipeReview.findUnique.mockResolvedValue(
        reviewRow({ id: 2, user: { name: null, deletedAt: null } }),
      );
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({ id: 5, user: { name: '  ', deletedAt: null } }),
      ]);

      const result = await service.listByRecipe(9, '7', RecipeSource.LOCAL, {});

      expect(result.mine?.author).toEqual({ name: 'Người dùng' });
      expect(result.data[0].author).toEqual({ name: 'Người dùng' });
    });

    it('tác giả đã xoá cũng hiển thị "Người dùng"', async () => {
      emptySummary();
      prismaMock.recipeReview.findUnique.mockResolvedValue(null);
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({ id: 5, user: { name: 'An', deletedAt: NOW } }),
      ]);

      const result = await service.listByRecipe(9, '7', RecipeSource.LOCAL, {});

      expect(result.data[0].author).toEqual({ name: 'Người dùng' });
    });

    it('trả về đánh giá của chính mình ở "mine", tách khỏi "data"', async () => {
      prismaMock.recipeReview.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { _all: 2 },
      });
      prismaMock.recipeReview.findUnique.mockResolvedValue(
        reviewRow({ id: 2 }),
      );
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({ id: 5 }),
      ]);

      const result = await service.listByRecipe(
        9,
        '007',
        RecipeSource.LOCAL,
        {},
      );

      expect(prismaMock.recipeReview.findUnique).toHaveBeenCalledWith({
        where: {
          userId_recipeId_source: {
            userId: 9,
            recipeId: '7',
            source: RecipeSource.LOCAL,
          },
        },
        include: { user: { select: { name: true, deletedAt: true } } },
      });
      expect(result.mine?.id).toBe(2);
      expect(result.data.map((item) => item.id)).toEqual([5]);
      expect(result.summary).toEqual({ average: 4, count: 2 });
    });
  });

  describe('listMine', () => {
    it('ưu tiên dữ liệu sống của recipes, thiếu thì rơi về snapshot', async () => {
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({
          id: 5,
          recipeId: '7',
          titleSnapshot: 'Tên cũ',
          imageSnapshot: 'https://img/cu.jpg',
        }),
        reviewRow({
          id: 4,
          recipeId: '8',
          titleSnapshot: 'Công thức đã xoá',
          imageSnapshot: null,
        }),
        reviewRow({
          id: 3,
          recipeId: '716429',
          source: RecipeSource.SPOONACULAR,
          titleSnapshot: 'Pasta',
          imageSnapshot: 'https://img/pasta.jpg',
        }),
      ]);
      prismaMock.recipe.findMany.mockResolvedValue([
        { id: 7, title: 'Tên mới', imageUrl: 'https://img/moi.jpg' },
      ]);

      const result = await service.listMine(9, {});

      expect(prismaMock.recipeReview.findMany).toHaveBeenCalledWith({
        where: { userId: 9 },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      // Chỉ gom id của các dòng LOCAL, một truy vấn duy nhất.
      expect(prismaMock.recipe.findMany).toHaveBeenCalledWith({
        where: { id: { in: [7, 8] } },
        select: { id: true, title: true, imageUrl: true },
      });
      expect(result.data.map((item) => [item.title, item.imageUrl])).toEqual([
        ['Tên mới', 'https://img/moi.jpg'],
        ['Công thức đã xoá', null],
        ['Pasta', 'https://img/pasta.jpg'],
      ]);
      expect(result.meta).toEqual({ nextCursor: null, hasMore: false });
    });

    it('trả nhận xét đầy đủ, không rút gọn', async () => {
      const comment = 'a'.repeat(900);
      prismaMock.recipeReview.findMany.mockResolvedValue([
        reviewRow({ comment, source: RecipeSource.SPOONACULAR }),
      ]);

      const result = await service.listMine(9, {});

      expect(result.data[0].comment).toBe(comment);
      expect(prismaMock.recipe.findMany).not.toHaveBeenCalled();
    });

    it('chặn limit vượt trần 50', async () => {
      prismaMock.recipeReview.findMany.mockResolvedValue([]);

      await service.listMine(9, { limit: 500 });

      expect(prismaMock.recipeReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 51 }),
      );
    });
  });

  describe('remove', () => {
    it('xoá theo (userId, recipeId, source) đã chuẩn hoá', async () => {
      prismaMock.recipeReview.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(9, '007', RecipeSource.LOCAL);

      expect(prismaMock.recipeReview.deleteMany).toHaveBeenCalledWith({
        where: { userId: 9, recipeId: '7', source: RecipeSource.LOCAL },
      });
    });

    it('không có bản ghi thì 404', async () => {
      prismaMock.recipeReview.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(9, '7', RecipeSource.LOCAL)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
