import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { DELETED_AUTHOR_NAME } from '../reviews/reviews.service';
import type {
  RecipeAuthor,
  RecipeDetail,
  RecipeProvider,
} from './recipe-provider.interface';

// Cột steps là TEXT một chuỗi: tách theo dòng, chịu được \r\n, \n và \r.
export function splitSteps(steps: string): string[] {
  return steps
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

// Tác giả đã xoá mềm thì coi như không có tác giả (UC-08).
// Còn tài khoản nhưng chưa đặt tên thì hiển thị tên mặc định.
function toAuthor(
  author: { id: number; name: string | null; deletedAt: Date | null } | null,
): RecipeAuthor | null {
  if (!author || author.deletedAt !== null) return null;
  return {
    id: author.id,
    name: author.name?.trim() ? author.name.trim() : DELETED_AUTHOR_NAME,
  };
}

// JSON trong DB có thể là bất cứ thứ gì: chỉ nhận mảng chuỗi, còn lại trả null.
function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === 'string')
    ? (value as string[])
    : null;
}

// recipes.id là Int nhưng tham số vào là chuỗi (route dùng chung với Spoonacular).
function parseLocalId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

@Injectable()
export class LocalDbProvider implements RecipeProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string): Promise<RecipeDetail> {
    const localId = parseLocalId(id);
    // Id sai định dạng cũng coi như không tồn tại, để UC-08 chỉ có một thông báo.
    if (localId === null) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: localId },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        author: { select: { id: true, name: true, deletedAt: true } },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    return {
      id: String(recipe.id),
      source: RecipeSource.LOCAL,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      diets: toStringArray(recipe.diets),
      dishTypes: toStringArray(recipe.dishTypes),
      steps: splitSteps(recipe.steps),
      videoUrl: recipe.videoUrl,
      ingredients: recipe.ingredients.map((item) => ({
        id: item.id,
        nameVi: item.nameVi,
        nameEn: item.nameEn,
        quantity: item.quantity === null ? null : Number(item.quantity),
        unit: item.unit,
        sortOrder: item.sortOrder,
      })),
      nutrition: recipe.nutrition ?? null,
      nutritionCoverage: recipe.nutritionCoverage,
      author: toAuthor(recipe.author),
    };
  }
}
