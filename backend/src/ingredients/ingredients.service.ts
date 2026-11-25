import { Injectable } from '@nestjs/common';
import { foldVietnamese } from '../common/utils/text';
import { PrismaService } from '../prisma/prisma.service';

// Một dòng gợi ý trả về cho app
export interface IngredientSuggestion {
  id: number;
  nameVi: string;
  nameEn: string;
}

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async autocomplete(q: string, limit: number): Promise<IngredientSuggestion[]> {
    const rows = await this.prisma.ingredient.findMany({
      select: { id: true, nameVi: true, nameEn: true },
      orderBy: { nameVi: 'asc' },
    });

    const key = foldVietnamese(q);

    return rows
      .map((row) => ({ row, folded: foldVietnamese(row.nameVi) }))
      .filter(({ folded }) => folded.includes(key))
      .sort((a, b) => Number(b.folded.startsWith(key)) - Number(a.folded.startsWith(key)))
      .slice(0, limit)
      .map(({ row }) => row);
  }
}
