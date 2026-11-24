import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { isAxiosError } from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/common/Icon';
import { icons, type IconAsset } from '@/constants/assets';
import { fontSize, spacing } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { useNetwork } from '@/hooks/useNetwork';
import { getById } from '@/services/api/recipeApi';
import type { RecipeDetail, RecipeSource } from '@/types/recipe.types';

// Màn hình chỉ có 5 trạng thái; 'offline' và 'notFound' là hai nhánh ngoại lệ của UC-08.
type Status = 'loading' | 'ready' | 'notFound' | 'offline' | 'error';

// Kết quả đã xong của một lần gọi API. 'loading' không nằm ở đây: trạng thái tải
// được suy ra khi chưa có kết quả nào khớp với request hiện tại.
type Settled =
  | { kind: 'ready'; recipe: RecipeDetail }
  | { kind: 'notFound' }
  | { kind: 'offline' }
  | { kind: 'error'; message: string };

const SOURCE_LABEL: Record<RecipeSource, string> = {
  LOCAL: 'Cộng đồng',
  SPOONACULAR: 'Spoonacular',
};

// Màu vàng của sao đánh giá, chỉ dùng ở màn này nên không thêm vào theme.ts
// (file dùng chung của nhánh khác).
const STAR_COLOR = '#C58A35';

// Tính năng chưa nối API: báo cho người dùng thay vì để nút bấm không phản hồi.
function comingSoon() {
  Alert.alert('Sắp có', 'Tính năng này đang được hoàn thiện.');
}

// Route param là string tuỳ ý, chỉ nhận đúng hai giá trị API chấp nhận.
function toSource(value: string | undefined): RecipeSource {
  return value === 'SPOONACULAR' ? 'SPOONACULAR' : 'LOCAL';
}

// Danh sách id nguyên liệu khớp, do luồng tìm kiếm theo nguyên liệu truyền sang.
// Không có param thì trả null: màn hình ẩn toàn bộ phần đối chiếu bếp.
function toMatchedIds(value: string | undefined): Set<string> | null {
  if (value === undefined) return null;
  return new Set(
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

// Số thập phân hiển thị theo kiểu Việt: 1.5 -> "1,5".
function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

// Định lượng có thể thiếu số, thiếu đơn vị, hoặc thiếu cả hai.
function formatAmount(quantity: number | null, unit: string | null): string {
  const amount = quantity === null ? '' : formatNumber(quantity);
  return [amount, unit ?? ''].filter(Boolean).join(' ');
}

// Dải 5 sao theo điểm trung bình, làm tròn về sao gần nhất.
function formatStars(average: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(average)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

// Cột nutrition là JSON tự do: chỉ nhận số hữu hạn, còn lại coi như không có.
function toMetric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// Quy lỗi gọi API về đúng nhánh ngoại lệ của UC-08.
function toFailure(error: unknown): Settled {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return { kind: 'notFound' };
    // Hết thời gian chờ hoặc không gọi được máy chủ: coi như mất mạng.
    if (!error.response) return { kind: 'offline' };
    if (error.response.status === 501) {
      return { kind: 'error', message: 'Chưa hỗ trợ nguồn Spoonacular' };
    }
  }
  return { kind: 'error', message: 'Không tải được công thức. Vui lòng thử lại.' };
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { isOnline } = useNetwork();
  const {
    id,
    source: sourceParam,
    matchedIds: matchedIdsParam,
  } = useLocalSearchParams<{ id: string; source?: string; matchedIds?: string }>();
  const source = toSource(sourceParam);
  const matchedIds = toMatchedIds(matchedIdsParam);

  // Số lần bấm "Thử lại": đổi requestKey để effect gọi lại API.
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: Settled } | null>(null);

  const requestKey = `${id ?? ''}|${source}|${attempt}`;
  // Kết quả cũ của request khác (đổi id, đổi nguồn, bấm thử lại) không được dùng,
  // nhờ vậy không cần setState trong effect để quay về trạng thái đang tải.
  const settled = result?.key === requestKey ? result.state : null;

  // UC-08 2c: mất mạng và công thức chưa từng được lưu yêu thích.
  // Bản lưu ngoại tuyến sẽ được đọc ở bước làm Yêu thích, hiện chỉ báo cần mạng.
  const status: Status = !id ? 'notFound' : !isOnline ? 'offline' : (settled?.kind ?? 'loading');
  const recipe = settled?.kind === 'ready' ? settled.recipe : null;
  const errorMessage = settled?.kind === 'error' ? settled.message : null;

  useEffect(() => {
    if (!id || !isOnline) return;

    let cancelled = false;
    void getById(id, source)
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, state: { kind: 'ready', recipe: data } });
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key: requestKey, state: toFailure(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [id, isOnline, requestKey, source]);

  const retry = () => setAttempt((value) => value + 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Icon icon={icons.arrowLeft} />
        </Pressable>
        <Text style={styles.headerTitle}>Công thức</Text>
      </View>

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải công thức…</Text>
        </View>
      ) : null}

      {status === 'notFound' ? (
        <EmptyState
          icon={icons.recipeNotFound}
          title="Không tìm thấy công thức"
          message="Công thức có thể đã bị xóa hoặc không còn được chia sẻ. Hãy tìm một món ngon khác nhé."
          actionTitle="Tìm công thức khác"
          // Chưa có màn tìm kiếm (UC-06/UC-07), tạm đưa về tab chính.
          onAction={() => router.replace('/(app)/(tabs)')}
          onBack={() => router.back()}
        />
      ) : null}

      {status === 'offline' ? (
        <EmptyState
          icon={icons.recipeOffline}
          title="Cần kết nối mạng để xem công thức này"
          message="Chưa có bản lưu ngoại tuyến cho công thức này. Hãy kết nối mạng rồi thử tải lại."
          actionTitle="Thử lại"
          onAction={retry}
          onBack={() => router.back()}
        />
      ) : null}

      {status === 'error' ? (
        <EmptyState
          icon={icons.recipeNotFound}
          title="Không tải được công thức"
          message={errorMessage ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
          actionTitle="Thử lại"
          onAction={retry}
          onBack={() => router.back()}
        />
      ) : null}

      {status === 'ready' && recipe ? (
        <RecipeBody recipe={recipe} matchedIds={matchedIds} />
      ) : null}
    </SafeAreaView>
  );
}

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconAsset;
};

// Thành phần "Nút hành động" của Figma: cao 52, bo tròn, chữ 14, gap 9.
// Không dùng components/common/Button vì nút đó đang dùng chữ 15 và chỉ có biến
// thể viền trắng, còn frame này cần cả biến thể nền xanh nhạt.
function ActionButton({ title, onPress, variant = 'primary', icon }: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary ? styles.actionPrimary : styles.actionSecondary,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? <Icon icon={icon} /> : null}
      <Text
        style={[styles.actionText, isPrimary ? styles.actionTextPrimary : styles.actionTextSecondary]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

type EmptyStateProps = {
  icon: IconAsset;
  title: string;
  message: string;
  actionTitle: string;
  onAction: () => void;
  onBack?: () => void;
};

// Khung chung cho hai nhánh ngoại lệ của UC-08 (frame 2003:9313 và 2003:9341).
function EmptyState({ icon, title, message, actionTitle, onAction, onBack }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon icon={icon} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <View style={styles.emptyAction}>
        <ActionButton title={actionTitle} onPress={onAction} />
      </View>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
          <Text style={styles.emptyBack}>Quay lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type RecipeBodyProps = {
  recipe: RecipeDetail;
  // null khi màn hình không được mở từ luồng tìm kiếm theo nguyên liệu.
  matchedIds: Set<string> | null;
};

function RecipeBody({ recipe, matchedIds }: RecipeBodyProps) {
  const authorName = recipe.author?.name?.trim();
  const rating = recipe.rating;
  // favoriteId chỉ có khi backend B2 đã trả; có giá trị nghĩa là đã lưu.
  const isSaved = typeof recipe.favoriteId === 'number';

  const calories = toMetric(recipe.nutrition?.calories);
  const protein = toMetric(recipe.nutrition?.protein);
  const carbs = toMetric(recipe.nutrition?.carbohydrates);
  const fat = toMetric(recipe.nutrition?.fat);

  // Ẩn cả khối dinh dưỡng khi coverage là NONE (hoặc không có số liệu nào).
  const hasNutrition =
    recipe.nutritionCoverage !== 'NONE' &&
    recipe.nutritionCoverage !== null &&
    [calories, protein, carbs, fat].some((value) => value !== null);
  // Số liệu chưa đầy đủ thì đánh dấu * ngay cạnh kcal.
  const estimateMark = recipe.nutritionCoverage === 'PARTIAL' ? '*' : '';

  const total = recipe.ingredients.length;
  const matchedCount =
    matchedIds === null
      ? 0
      : recipe.ingredients.filter((item) => matchedIds.has(String(item.id))).length;

  const videoUrl = recipe.videoUrl;
  const openVideo = () => {
    if (!videoUrl) return;
    // Mở bằng trình xem bên ngoài, không nhúng thêm thư viện video.
    void Linking.openURL(videoUrl).catch(() => {
      Alert.alert('Không mở được video', 'Liên kết video không hợp lệ hoặc thiết bị không mở được.');
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.hero} contentFit="cover" />
      ) : (
        <View style={[styles.hero, styles.imagePlaceholder]} />
      )}

      <View style={styles.intro}>
        <View style={styles.introTopRow}>
          <View style={styles.sourceChip}>
            <Text style={styles.sourceChipText}>{SOURCE_LABEL[recipe.source]}</Text>
          </View>
          {/* TODO(B5 – Yêu thích): nối API lưu/bỏ lưu yêu thích, bỏ comingSoon(). */}
          <Pressable
            onPress={comingSoon}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved }}
            accessibilityLabel={isSaved ? 'Bỏ lưu công thức' : 'Lưu công thức vào yêu thích'}
            style={styles.favorite}
          >
            <Icon icon={icons.heart} />
            <Text style={styles.favoriteText}>{isSaved ? 'Đã lưu' : 'Yêu thích'}</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{recipe.title}</Text>

        {authorName || rating ? (
          <View style={styles.metaRow}>
            <Text style={styles.author}>{authorName ? `Bếp của ${authorName}` : ''}</Text>
            {/* rating chưa có trong response (backend chưa làm B2) thì ẩn hẳn dòng sao. */}
            {rating ? (
              <Text style={styles.rating}>
                {rating.count > 0
                  ? `★ ${formatNumber(rating.average)} · ${rating.count} đánh giá`
                  : 'Chưa có đánh giá'}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.quickInfo}>
        {recipe.readyInMinutes !== null ? (
          <QuickInfoItem icon={icons.clock} label={`${recipe.readyInMinutes} phút`} />
        ) : null}
        <QuickInfoItem icon={icons.users} label={`${recipe.servings} người`} />
        {hasNutrition && calories !== null ? (
          <QuickInfoItem
            icon={icons.flame}
            label={`${formatNumber(calories)} kcal${estimateMark}`}
          />
        ) : null}
      </View>

      {total > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nguyên liệu</Text>

          <View style={styles.servingRow}>
            <Text style={styles.servingText}>{`${recipe.servings} người`}</Text>
            {/* Mức phù hợp là thông tin của luồng tìm theo nguyên liệu, chỉ hiện khi có matchedIds. */}
            {matchedIds ? (
              <Text
                style={styles.matchText}
              >{`Có ${matchedCount}/${total} · thiếu ${total - matchedCount}`}</Text>
            ) : null}
          </View>

          <View style={styles.ingredientCard}>
            {recipe.ingredients.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                {matchedIds ? (
                  <Icon icon={matchedIds.has(String(item.id)) ? icons.circleCheck : icons.circlePlus} />
                ) : null}
                <Text style={styles.ingredientName}>{item.nameVi}</Text>
                <Text style={styles.ingredientAmount}>
                  {formatAmount(item.quantity, item.unit)}
                </Text>
              </View>
            ))}
          </View>

          {matchedIds ? (
            <Text style={styles.legend}>{'✓ Đã có trong bếp     ⊕ Cần mua thêm'}</Text>
          ) : null}

          {/* TODO(Mua sắm): nối API thêm nguyên liệu vào danh sách mua sắm, bỏ comingSoon(). */}
          <ActionButton
            title="Thêm tất cả nguyên liệu vào mua sắm"
            icon={icons.cart}
            onPress={comingSoon}
          />
          <Text
            style={styles.sectionNote}
          >{`Thêm nguyên nhóm ${total} nguyên liệu. Mỗi dòng được giữ riêng, không gộp với nguyên liệu đã có trong danh sách.`}</Text>
        </View>
      ) : null}

      {recipe.steps.length > 0 ? (
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Cùng vào bếp</Text>
          {recipe.steps.map((step, index) => (
            <View key={`${index}-${step.slice(0, 24)}`} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              {/* API chỉ trả mảng câu hướng dẫn, chưa có tiêu đề và thời lượng từng bước. */}
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {hasNutrition ? (
        <View style={styles.nutrition}>
          <Text style={styles.nutritionTitle}>Dinh dưỡng ước tính</Text>
          <Text
            style={styles.nutritionSubtitle}
          >{`Trên mỗi khẩu phần · ${recipe.servings} khẩu phần / công thức`}</Text>
          <View style={styles.nutritionRow}>
            {calories !== null ? (
              <NutritionMetric value={`${formatNumber(calories)}`} label="kcal" />
            ) : null}
            {protein !== null ? (
              <NutritionMetric value={`${formatNumber(protein)} g`} label="Đạm" />
            ) : null}
            {carbs !== null ? (
              <NutritionMetric value={`${formatNumber(carbs)} g`} label="Carb" />
            ) : null}
            {fat !== null ? <NutritionMetric value={`${formatNumber(fat)} g`} label="Béo" /> : null}
          </View>
          <Text style={styles.nutritionFootnote}>
            *Ước tính từ nguyên liệu, có thể thay đổi theo cách nấu và khẩu phần. Không phải số liệu
            kiểm định hay tư vấn sức khỏe.
          </Text>
        </View>
      ) : null}

      {videoUrl ? (
        <View style={styles.videoSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Xem cách làm</Text>
            <Pressable onPress={openVideo} hitSlop={8} accessibilityRole="link">
              <Text style={styles.sectionLink}>Mở video ↗</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={openVideo}
            accessibilityRole="button"
            accessibilityLabel="Phát video hướng dẫn"
            style={styles.videoPreview}
          >
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} style={styles.videoImage} contentFit="cover" />
            ) : (
              <View style={[styles.videoImage, styles.imagePlaceholder]} />
            )}
            <View style={styles.videoOverlay}>
              <View style={styles.playBadge}>
                <Icon icon={icons.play} />
              </View>
            </View>
          </Pressable>
          <Text style={styles.sectionNote}>
            Video do tác giả chia sẻ · mở bằng liên kết bên ngoài
          </Text>
        </View>
      ) : null}

      <View style={styles.reviewSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cả nhà nói gì?</Text>
          {rating && rating.count > 0 ? (
            /* TODO(B6 – Đánh giá): mở màn danh sách đánh giá, bỏ comingSoon(). */
            <Pressable onPress={comingSoon} hitSlop={8} accessibilityRole="button">
              <Text style={styles.sectionLink}>{`Xem ${rating.count} đánh giá`}</Text>
            </Pressable>
          ) : null}
        </View>

        {rating && rating.count > 0 ? (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{formatNumber(rating.average)}</Text>
            <View style={styles.scoreSummary}>
              <Text style={styles.scoreStars}>{formatStars(rating.average)}</Text>
              <Text style={styles.scoreCount}>{`${rating.count} đánh giá từ cộng đồng`}</Text>
            </View>
          </View>
        ) : (
          // Chưa có API danh sách đánh giá nên không dựng đánh giá nổi bật như frame.
          <Text style={styles.reviewEmpty}>Chưa có đánh giá nào, hãy là người đầu tiên!</Text>
        )}

        {/* TODO(B6 – Đánh giá): nối API gửi đánh giá, bỏ comingSoon(). */}
        <ActionButton title="Viết đánh giá" variant="secondary" onPress={comingSoon} />
      </View>

      {/* TODO(Kế hoạch bữa ăn): nối API thêm công thức vào kế hoạch, bỏ comingSoon(). */}
      <ActionButton
        title="Thêm vào kế hoạch bữa ăn"
        icon={icons.calendar}
        onPress={comingSoon}
      />
    </ScrollView>
  );
}

function QuickInfoItem({ icon, label }: { icon: IconAsset; label: string }) {
  return (
    <View style={styles.quickInfoItem}>
      <Icon icon={icon} />
      <Text style={styles.quickInfoText}>{label}</Text>
    </View>
  );
}

function NutritionMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.nutritionMetric}>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 22,
    paddingTop: 9,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: colors.textDark,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMid },

  pressed: { opacity: 0.85 },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionSecondary: { backgroundColor: colors.softGreen },
  actionText: { fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  actionTextPrimary: { color: colors.white },
  actionTextSecondary: { color: colors.primary },

  emptyState: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 28,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    lineHeight: 30,
    textAlign: 'center',
    color: colors.textDark,
  },
  emptyMessage: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textMid,
  },
  emptyAction: { width: '100%' },
  emptyBack: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.primary,
  },

  scroll: { paddingHorizontal: 22, paddingBottom: 70, gap: 22 },

  hero: { width: '100%', height: 254, borderRadius: 20 },
  imagePlaceholder: { backgroundColor: colors.softGreen },

  intro: { gap: spacing.md },
  introTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  sourceChipText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  favorite: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  favoriteText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  title: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.9,
    color: colors.textDark,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMid },
  rating: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: STAR_COLOR },

  quickInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    backgroundColor: colors.softGreen,
  },
  quickInfoItem: { flex: 1, alignItems: 'center', gap: 7 },
  quickInfoText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.primary,
    textAlign: 'center',
  },

  section: { gap: 14 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textDark },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLink: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  sectionNote: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textMid,
  },

  servingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  servingText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.textDark },
  matchText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.primary },

  ingredientCard: {
    paddingHorizontal: 14,
    borderRadius: spacing.lg,
    backgroundColor: colors.surface,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 47,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ingredientName: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textDark },
  ingredientAmount: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMid },
  legend: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMid,
  },

  stepsSection: { gap: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  stepBadgeText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.white },
  stepText: {
    flex: 1,
    paddingTop: 5,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textMid,
  },

  nutrition: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.softGreen,
  },
  nutritionTitle: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 27, color: colors.textDark },
  nutritionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.primary,
  },
  nutritionRow: { flexDirection: 'row', gap: 10 },
  nutritionMetric: { flex: 1, gap: spacing.xs },
  nutritionValue: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.primary },
  nutritionLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.primary },
  nutritionFootnote: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textMid,
  },

  videoSection: { gap: spacing.md },
  videoPreview: { width: '100%' },
  videoImage: { width: '100%', height: 164, borderRadius: 20 },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },

  reviewSection: { gap: 13 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreValue: { fontFamily: fonts.bold, fontSize: 38, color: colors.textDark },
  scoreSummary: { gap: 3 },
  scoreStars: { fontFamily: fonts.regular, fontSize: fontSize.lg, color: STAR_COLOR },
  scoreCount: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMid },
  reviewEmpty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMid,
  },
});
