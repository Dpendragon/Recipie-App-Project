import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AUTOCOMPLETE_MAX_LIMIT } from './dto/ingredient-autocomplete-query.dto';

export interface IngredientSuggestion {
  id: number;
  nameVi: string;
  nameEn: string;
  commonUnit: string | null;
}

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async autocomplete(
    q?: string,
    limit?: number,
  ): Promise<IngredientSuggestion[]> {
    const keyword = q?.trim() ?? '';
    // Dưới 1 ký tự thì không truy vấn DB, tránh trả về cả danh mục.
    if (keyword.length < 1) {
      return [];
    }

    const take = Math.min(
      limit ?? AUTOCOMPLETE_MAX_LIMIT,
      AUTOCOMPLETE_MAX_LIMIT,
    );

    // contains không phân biệt hoa thường nhờ collation mặc định của MySQL
    // (utf8mb4_*_ci); Prisma không hỗ trợ mode: 'insensitive' cho MySQL.
    return this.prisma.ingredient.findMany({
      where: {
        OR: [
          { nameVi: { contains: keyword } },
          { nameEn: { contains: keyword } },
        ],
      },
      select: { id: true, nameVi: true, nameEn: true, commonUnit: true },
      orderBy: { nameVi: 'asc' },
      take,
    });
  }
}
