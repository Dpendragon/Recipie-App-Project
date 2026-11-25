import { RankedRecipe } from './providers/recipe-provider.interface';

// So sánh 2 món theo độ phù hợp
// Trả số âm = a đứng trước b, số dương = b đứng trước a.
export function byRelevance(a: RankedRecipe, b: RankedRecipe): number {
  // 1) Khớp nhiều nguyên liệu hơn thì đứng trước
  const matchDiff = (b.matchedCount ?? 0) - (a.matchedCount ?? 0);
  if (matchDiff !== 0) return matchDiff;

  // 2) Thiếu ít nguyên liệu hơn thì đứng trước
  const missA = (a.totalIngredients ?? 0) - (a.matchedCount ?? 0);
  const missB = (b.totalIngredients ?? 0) - (b.matchedCount ?? 0);
  if (missA !== missB) return missA - missB;

  // 3) Tìm theo tên: trùng hẳn > bắt đầu bằng > có chứa
  const tierDiff = (a.nameTier ?? 3) - (b.nameTier ?? 3);
  if (tierDiff !== 0) return tierDiff;

  // 4) Hoà nhau thì món cộng đồng đứng trước
  if (a.source !== b.source) return a.source === 'LOCAL' ? -1 : 1;

  // 5) Điểm đánh giá cao hơn thì đứng trước
  const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
  if (ratingDiff !== 0) return ratingDiff;

  // 6) Vẫn hoà thì so id để thứ tự luôn cố định giữa các lần sắp xếp
  return a.id.localeCompare(b.id);
}
