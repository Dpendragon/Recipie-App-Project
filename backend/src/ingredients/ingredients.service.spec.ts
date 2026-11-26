import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IngredientsService } from './ingredients.service';

const prismaMock = {
  ingredient: { findMany: jest.fn() },
};

const rows = [
  { id: 1, nameVi: 'Cà chua', nameEn: 'Tomato', commonUnit: 'quả' },
  { id: 2, nameVi: 'Cà rốt', nameEn: 'Carrot', commonUnit: 'củ' },
];

describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(IngredientsService);
  });

  it('tìm theo cả nameVi và nameEn, mặc định lấy tối đa 10', async () => {
    prismaMock.ingredient.findMany.mockResolvedValue(rows);

    const result = await service.autocomplete('cà');

    expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ nameVi: { contains: 'cà' } }, { nameEn: { contains: 'cà' } }],
      },
      select: { id: true, nameVi: true, nameEn: true, commonUnit: true },
      orderBy: { nameVi: 'asc' },
      take: 10,
    });
    expect(result).toEqual(rows);
  });

  it('cắt khoảng trắng hai đầu của q trước khi truy vấn', async () => {
    prismaMock.ingredient.findMany.mockResolvedValue([]);

    await service.autocomplete('  thịt  ');

    expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { nameVi: { contains: 'thịt' } },
            { nameEn: { contains: 'thịt' } },
          ],
        },
      }),
    );
  });

  it.each([undefined, '', '   '])(
    'q rỗng (%s) thì trả mảng rỗng và không gọi Prisma',
    async (q) => {
      const result = await service.autocomplete(q);

      expect(result).toEqual([]);
      expect(prismaMock.ingredient.findMany).not.toHaveBeenCalled();
    },
  );

  it('dùng limit do client truyền khi nhỏ hơn 10', async () => {
    prismaMock.ingredient.findMany.mockResolvedValue([rows[0]]);

    await service.autocomplete('cà', 1);

    expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 }),
    );
  });

  it('chặn limit lớn hơn 10 về đúng 10', async () => {
    prismaMock.ingredient.findMany.mockResolvedValue(rows);

    await service.autocomplete('cà', 50);

    expect(prismaMock.ingredient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});
