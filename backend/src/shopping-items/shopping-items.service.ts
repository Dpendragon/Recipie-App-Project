import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { RecipeSource } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';

// Danh sách cột trả về cho client (không trả userId).
const SHOPPING_ITEM_SELECT = {
  id: true,
  name: true,
  quantity: true,
  note: true,
  checked: true,
  sourceRecipeId: true,
  source: true,
  recipeTitleSnapshot: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ShoppingItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // XEM DANH SÁCH — chưa mua lên trước, mới thêm lên trước
  findAll(userId: number) {
    return this.prisma.shoppingItem.findMany({
      where: { userId },
      orderBy: [{ checked: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: SHOPPING_ITEM_SELECT,
    });
  }

  // THÊM THỦ CÔNG — không gộp với dòng trùng tên
  create(userId: number, dto: CreateShoppingItemDto) {
    return this.prisma.shoppingItem.create({
      data: {
        userId,
        name: dto.name,
        quantity: dto.quantity ?? null,
        note: dto.note ?? null,
      },
      select: SHOPPING_ITEM_SELECT,
    });
  }

  // ĐÁNH DẤU ĐÃ MUA / SỬA GHI CHÚ
  async update(userId: number, id: number, dto: UpdateShoppingItemDto) {
    if (dto.checked === undefined && dto.note === undefined) {
      throw new BadRequestException('Không có thông tin để cập nhật');
    }

    // Lọc theo cả userId: dòng của người khác coi như không tồn tại (404),
    // để không lộ việc id đó có trong hệ thống.
    const existing = await this.prisma.shoppingItem.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy mục mua sắm');
    }

    return this.prisma.shoppingItem.update({
      where: { id },
      data: {
        checked: dto.checked,
        note: dto.note,
      },
      select: SHOPPING_ITEM_SELECT,
    });
  }

  // XOÁ — idempotent: không tồn tại (hoặc của người khác) thì không xoá gì
  // nhưng vẫn coi là thành công.
  async remove(userId: number, id: number) {
    await this.prisma.shoppingItem.deleteMany({ where: { id, userId } });
  }

  // THÊM NGUYÊN LIỆU TỪ CÔNG THỨC
  async addFromRecipe(userId: number, recipeId: string, source: RecipeSource) {
    if (source === RecipeSource.SPOONACULAR) {
      // TODO: khi có Spoonacular provider thì lấy extendedIngredients của
      // công thức và thêm từng nguyên liệu như nhánh LOCAL bên dưới.
      throw new NotImplementedException(
        'Chưa hỗ trợ thêm nguyên liệu từ công thức Spoonacular',
      );
    }

    // Công thức LOCAL có id là số nguyên dương.
    const localId = /^\d+$/.test(recipeId) ? Number(recipeId) : NaN;
    if (!Number.isSafeInteger(localId) || localId <= 0) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: localId },
      select: {
        id: true,
        title: true,
        ingredients: {
          orderBy: { sortOrder: 'asc' },
          select: { nameVi: true, quantity: true, unit: true },
        },
      },
    });
    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }
    if (recipe.ingredients.length === 0) {
      throw new BadRequestException('Công thức này chưa có nguyên liệu để thêm');
    }

    // Mỗi nguyên liệu thành 1 dòng mới, không gộp với dòng đã có.
    // MySQL không hỗ trợ createManyAndReturn nên tạo từng dòng trong 1 transaction.
    return this.prisma.$transaction(
      recipe.ingredients.map((ingredient) =>
        this.prisma.shoppingItem.create({
          data: {
            userId,
            name: ingredient.nameVi,
            quantity: formatQuantity(
              ingredient.quantity?.toString(),
              ingredient.unit,
            ),
            sourceRecipeId: String(recipe.id),
            source: RecipeSource.LOCAL,
            recipeTitleSnapshot: recipe.title,
          },
          select: SHOPPING_ITEM_SELECT,
        }),
      ),
    );
  }
}

// Ghép số lượng + đơn vị thành chuỗi, vd "400 g". Cả hai trống thì trả null.
function formatQuantity(
  quantity: string | undefined,
  unit: string | null,
): string | null {
  const text = [quantity, unit?.trim()].filter(Boolean).join(' ');
  return text || null;
}
