import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSource } from '../generated/prisma/enums';
import { isLocalId, normalizeRecipeId } from '../common/utils/recipe-id';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

// Kiểu dữ liệu trả về dùng chung cho các chức năng Favorites.
export type FavoriteItem = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  createdAt: Date;
};

type FavoriteRow = {
  id: number;
  recipeId: string;
  source: RecipeSource;
  titleSnapshot: string;
  imageSnapshot: string | null;
  createdAt: Date;
};

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-09. Ngoại lệ 2a: đã có sẵn thì giữ nguyên, không báo lỗi.
  async create(userId: number, dto: CreateFavoriteDto): Promise<FavoriteItem> {
    const { recipeId, titleSnapshot, imageSnapshot } =
      await this.resolveRecipe(dto);

    // upsert thay cho findUnique + create: hai request song song cùng bấm tim
    // sẽ không làm request thua cuộc vỡ vì UNIQUE(user_id, recipe_id, source).
    // update rỗng vì UC-09 2a yêu cầu giữ nguyên bản ghi cũ.
    const favorite = await this.prisma.favorite.upsert({
      where: {
        userId_recipeId_source: { userId, recipeId, source: dto.source },
      },
      create: {
        userId,
        recipeId,
        source: dto.source,
        titleSnapshot,
        imageSnapshot,
      },
      update: {},
    });

    return toFavoriteItem(favorite);
  }

  // LOCAL: kiểm tra công thức tồn tại và lấy snapshot từ bảng recipes;
  // SPOONACULAR: dùng dữ liệu client gửi, titleSnapshot là bắt buộc.
  private async resolveRecipe(dto: CreateFavoriteDto): Promise<{
    recipeId: string;
    titleSnapshot: string;
    imageSnapshot: string | null;
  }> {
    if (dto.source === RecipeSource.SPOONACULAR) {
      if (!dto.titleSnapshot) {
        throw new BadRequestException(
          'Thiếu tên công thức (titleSnapshot) cho nguồn SPOONACULAR',
        );
      }
      return {
        recipeId: dto.recipeId,
        titleSnapshot: dto.titleSnapshot,
        imageSnapshot: dto.imageSnapshot ?? null,
      };
    }

    // Id sai định dạng cũng coi như không tồn tại, giống UC-08.
    if (!isLocalId(dto.recipeId)) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    // Không qua RecipesService: ở đây chỉ cần tên và ảnh, không cần nguyên liệu,
    // dinh dưỡng hay rating của màn chi tiết.
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: Number(dto.recipeId) },
      select: { title: true, imageUrl: true },
    });

    if (!recipe) {
      throw new NotFoundException('Không tìm thấy công thức');
    }

    // "7" và "007" phải ra cùng một dòng qua UNIQUE nên LOCAL luôn chuẩn hoá.
    return {
      recipeId: normalizeRecipeId(dto.recipeId, dto.source),
      titleSnapshot: recipe.title,
      imageSnapshot: recipe.imageUrl,
    };
  }


}

function toFavoriteItem(row: FavoriteRow): FavoriteItem {
  return {
    id: row.id,
    recipeId: row.recipeId,
    source: row.source,
    title: row.titleSnapshot,
    imageUrl: row.imageSnapshot,
    createdAt: row.createdAt,
  };
}
