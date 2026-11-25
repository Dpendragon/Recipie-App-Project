import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MealSlot, RecipeSource } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import {
  formatDateOnly,
  parseDateOnly,
  toApiMealSlot,
  toPrismaMealSlot,
} from './meal-plan.utils';

// Khoảng ngày tối đa cho 1 lần GET (tính cả 2 đầu) — thay cho phân trang.
const MAX_RANGE_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

// Cột đọc ra từ DB (không trả userId cho client).
const ENTRY_SELECT = {
  id: true,
  date: true,
  mealSlot: true,
  recipeId: true,
  source: true,
  titleSnapshot: true,
  imageSnapshot: true,
  createdAt: true,
  updatedAt: true,
} as const;

type EntryRow = {
  id: number;
  date: Date;
  mealSlot: MealSlot;
  recipeId: string;
  source: RecipeSource;
  titleSnapshot: string | null;
  imageSnapshot: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RecipeDisplay = { title: string | null; imageUrl: string | null };

@Injectable()
export class MealPlanService {
  constructor(private readonly prisma: PrismaService) {}

  // XEM KẾ HOẠCH (UC-22)
  async findRange(userId: number, from: string, to: string) {
    const fromDate = parseDateOnly(from, 'from');
    const toDate = parseDateOnly(to, 'to');
    if (fromDate > toDate) {
      throw new BadRequestException('from phải trước hoặc bằng to');
    }
    const days = (toDate.getTime() - fromDate.getTime()) / DAY_MS + 1;
    if (days > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `Chỉ xem được tối đa ${MAX_RANGE_DAYS} ngày mỗi lần`,
      );
    }

    // meal_slot là ENUM của MySQL nên ORDER BY theo thứ tự khai báo:
    // breakfast -> lunch -> dinner.
    const entries = await this.prisma.mealPlanEntry.findMany({
      where: { userId, date: { gte: fromDate, lte: toDate } },
      orderBy: [
        { date: 'asc' },
        { mealSlot: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      select: ENTRY_SELECT,
    });

    // LOCAL: ưu tiên dữ liệu sống trong bảng recipes, công thức đã bị xoá thì
    // rơi về snapshot (tương đương LEFT JOIN + COALESCE ở Mục 2).
    // recipe_id là VARCHAR nên không JOIN được qua Prisma -> lấy gộp 1 truy vấn.
    const localIds = [
      ...new Set(
        entries
          .filter((e) => e.source === RecipeSource.LOCAL)
          .map((e) => parseLocalId(e.recipeId))
          .filter((id): id is number => id !== null),
      ),
    ];
    const liveRecipes = new Map<string, RecipeDisplay>();
    if (localIds.length > 0) {
      const recipes = await this.prisma.recipe.findMany({
        where: { id: { in: localIds } },
        select: { id: true, title: true, imageUrl: true },
      });
      for (const r of recipes) {
        liveRecipes.set(String(r.id), { title: r.title, imageUrl: r.imageUrl });
      }
    }

    return entries.map((entry) =>
      toResponse(
        entry,
        entry.source === RecipeSource.LOCAL
          ? liveRecipes.get(entry.recipeId)
          : undefined,
      ),
    );
  }

  // THÊM MÓN (UC-21) — luôn tạo dòng mới, 1 buổi có thể có nhiều món.
  async create(userId: number, dto: CreateMealPlanDto) {
    const date = parseDateOnly(dto.date, 'Ngày');
    const snapshot = await this.resolveSnapshot(dto);

    const entry = await this.prisma.mealPlanEntry.create({
      data: {
        userId,
        date,
        mealSlot: toPrismaMealSlot(dto.mealSlot),
        recipeId: dto.recipeId,
        source: dto.source,
        ...snapshot,
      },
      select: ENTRY_SELECT,
    });
    // Snapshot vừa lấy từ nguồn nên chính là dữ liệu hiển thị hiện tại.
    return toResponse(entry);
  }

  // ĐỔI MÓN (UC-23) — chỉ sửa đúng dòng id, các món khác cùng buổi giữ nguyên.
  async update(userId: number, id: number, dto: UpdateMealPlanDto) {
    await this.assertOwner(userId, id);
    const snapshot = await this.resolveSnapshot(dto);

    const entry = await this.prisma.mealPlanEntry.update({
      where: { id },
      data: {
        recipeId: dto.recipeId,
        source: dto.source,
        ...snapshot,
      },
      select: ENTRY_SELECT,
    });
    return toResponse(entry);
  }

  // XOÁ MÓN (UC-24) — chỉ xoá đúng dòng id.
  async remove(userId: number, id: number) {
    await this.assertOwner(userId, id);
    await this.prisma.mealPlanEntry.delete({ where: { id } });
  }

  // Không có -> 404; có nhưng của người khác -> 403 (theo ghi chú Mục 8).
  private async assertOwner(userId: number, id: number) {
    const existing = await this.prisma.mealPlanEntry.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy món trong kế hoạch');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi kế hoạch của người khác',
      );
    }
  }

  // Snapshot được ghi cho MỌI nguồn lúc tạo/đổi món (Mục 2):
  // - LOCAL: lấy từ bảng recipes (bỏ qua giá trị client gửi).
  // - SPOONACULAR: dùng giá trị client gửi, bắt buộc có titleSnapshot.
  private async resolveSnapshot(dto: UpdateMealPlanDto) {
    if (dto.source === RecipeSource.SPOONACULAR) {
      if (!dto.titleSnapshot) {
        throw new BadRequestException(
          'Vui lòng gửi titleSnapshot cho công thức Spoonacular',
        );
      }
      return {
        titleSnapshot: dto.titleSnapshot,
        imageSnapshot: dto.imageSnapshot ?? null,
      };
    }

    const localId = parseLocalId(dto.recipeId);
    const recipe =
      localId === null
        ? null
        : await this.prisma.recipe.findUnique({
            where: { id: localId },
            select: { title: true, imageUrl: true },
          });
    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }
    return { titleSnapshot: recipe.title, imageSnapshot: recipe.imageUrl };
  }
}

// Công thức LOCAL có id là số nguyên dương; sai định dạng trả null.
function parseLocalId(recipeId: string): number | null {
  const id = /^\d+$/.test(recipeId) ? Number(recipeId) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// live: dữ liệu sống của công thức LOCAL (nếu còn tồn tại).
function toResponse(entry: EntryRow, live?: RecipeDisplay) {
  return {
    id: entry.id,
    date: formatDateOnly(entry.date),
    mealSlot: toApiMealSlot(entry.mealSlot),
    recipeId: entry.recipeId,
    source: entry.source,
    title: live ? live.title : entry.titleSnapshot,
    imageUrl: live ? live.imageUrl : entry.imageSnapshot,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
