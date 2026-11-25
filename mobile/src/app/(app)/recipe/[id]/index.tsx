import { useCallback, useRef, useEffect, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActionButton } from '@/components/common/ActionButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Notice } from '@/components/common/Notice';
import { Toast } from '@/components/common/Toast';
import { icons, type IconAsset } from '@/constants/assets';
import { fontSize, spacing } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/useToast';
import { getById } from '@/services/api/recipeApi';
import { listByRecipe } from '@/services/api/reviewApi';
import {
  getRecipeDetail,
  OfflineCacheMissError,
  removeFavorite,
  saveFavorite,
  type RecipeDetailResult,
} from '@/services/cache/cacheManager';
import type {
  NutritionCoverage,
  RecipeAuthor,
  RecipeIngredient,
  RecipeNutrition,
  RecipeRating,
  RecipeSource,
} from '@/types/recipe.types';
import type { Review } from '@/types/review.types';
import { getApiErrorMessage } from '@/utils/helpers';

// Màn hình chỉ có 5 trạng thái; 'offline' và 'notFound' là hai nhánh ngoại lệ của UC-08.
type Status = 'loading' | 'ready' | 'notFound' | 'offline' | 'error';

// Kết quả đã xong của một lần tải. 'loading' không nằm ở đây: trạng thái tải
// được suy ra khi chưa có kết quả nào khớp với request hiện tại.
// 'ready' giữ nguyên nguồn dữ liệu: mạng (đủ trường) hoặc bản lưu trên máy.
type Settled =
  | { kind: 'ready'; data: RecipeDetailResult }
  | { kind: 'notFound' }
  | { kind: 'offline' }
  | { kind: 'error'; message: string };

// Trạng thái yêu thích cục bộ, gắn với đúng request đang hiển thị. saved tách
// khỏi favoriteId vì lúc lưu lạc quan đã hiện "Đã lưu" nhưng chưa có id từ server.
type FavoriteState = { key: string; saved: boolean; favoriteId: number | null };

// Dữ liệu màn hình cần, dựng được từ cả RecipeDetail lẫn CachedRecipe.
// Bản lưu trên máy không có tác giả và điểm đánh giá nên hai trường đó null.
type ViewRecipe = {
  id: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
  servings: number | null;
  readyInMinutes: number | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  videoUrl: string | null;
  nutrition: RecipeNutrition | null;
  nutritionCoverage: NutritionCoverage | null;
  author: RecipeAuthor | null;
  rating: RecipeRating | null;
};

const SOURCE_LABEL: Record<RecipeSource, string> = {
  LOCAL: 'Cộng đồng',
  SPOONACULAR: 'Spoonacular',
};

// Màu vàng của sao đánh giá, chỉ dùng ở màn này nên không thêm vào theme.ts
// (file dùng chung của nhánh khác).
const STAR_COLOR = '#C58A35';

const NEED_NETWORK_TO_SAVE = 'Cần kết nối mạng để lưu công thức';
const NEED_NETWORK_TO_UNSAVE = 'Cần kết nối mạng để bỏ lưu';

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

// Không gọi tới được server (mất mạng, timeout): khác lỗi có response từ server.
function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

// Quy lỗi tải công thức về đúng nhánh ngoại lệ của UC-08.
function toFailure(error: unknown): Settled {
  // Mất mạng và công thức chưa từng được lưu yêu thích (2c).
  if (error instanceof OfflineCacheMissError) return { kind: 'offline' };
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

// Có userId thì đi qua cacheManager: có mạng lấy dữ liệu sống và làm mới cache
// (chỉ dòng đã có), mất mạng đọc bản lưu trên máy. Không đọc được tài khoản thì
// không được đụng vào cache (cache phân vùng theo user_id), chỉ lấy từ mạng.
async function loadRecipe(
  userId: number | null,
  recipeId: string,
  source: RecipeSource,
  isOnline: boolean,
): Promise<RecipeDetailResult> {
  if (userId === null) {
    if (!isOnline) throw new OfflineCacheMissError();
    return { origin: 'network', recipe: await getById(recipeId, source) };
  }
  return getRecipeDetail({ userId, recipeId, source, isOnline });
}

function toViewRecipe(data: RecipeDetailResult): ViewRecipe {
  if (data.origin === 'network') {
    const recipe = data.recipe;
    return {
      id: recipe.id,
      source: recipe.source,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      videoUrl: recipe.videoUrl,
      nutrition: recipe.nutrition,
      nutritionCoverage: recipe.nutritionCoverage,
      author: recipe.author ?? null,
      rating: recipe.rating ?? null,
    };
  }

  const cached = data.recipe;
  return {
    id: cached.recipeId,
    source: cached.source,
    title: cached.title ?? 'Công thức đã lưu',
    imageUrl: cached.imageUrl,
    servings: cached.servings,
    readyInMinutes: cached.readyInMinutes,
    ingredients: cached.ingredients,
    steps: cached.steps,
    videoUrl: cached.videoUrl,
    nutrition: cached.nutrition,
    nutritionCoverage: cached.nutritionCoverage,
    author: null,
    rating: null,
  };
}

// Trạng thái yêu thích ban đầu theo dữ liệu vừa tải. Bản lưu trên máy chỉ tồn
// tại cho công thức đã yêu thích, nên luôn là "đã lưu" kể cả khi thiếu favorite_id
// (dòng do bản app cũ ghi).
function initialFavorite(key: string, data: RecipeDetailResult): FavoriteState {
  if (data.origin === 'cache') {
    return { key, saved: true, favoriteId: data.recipe.favoriteId };
  }
  const favoriteId = data.recipe.favoriteId ?? null;
  return { key, saved: favoriteId !== null, favoriteId };
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { isOnline } = useNetwork();
  const userId = useCurrentUserId();
  const { toast, showToast } = useToast();
  const {
    id,
    source: sourceParam,
    matchedIds: matchedIdsParam,
  } = useLocalSearchParams<{ id: string; source?: string; matchedIds?: string }>();
  const source = toSource(sourceParam);
  const matchedIds = toMatchedIds(matchedIdsParam);

  // Số lần bấm "Thử lại": đổi requestKey để effect tải lại.
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: Settled } | null>(null);
  const [favoriteOverride, setFavoriteOverride] = useState<FavoriteState | null>(null);
  // Đánh giá nổi bật của khối "Cả nhà nói gì?" (UC-13, lấy 1 dòng).
  const [featured, setFeatured] = useState<{ key: string; review: Review | null } | null>(null);
  // Chặn bấm tim liên tiếp khi yêu cầu trước chưa xong.
  const favoritePendingRef = useRef(false);

  // Đổi mạng cũng tải lại: mất mạng thì chuyển sang bản lưu trên máy (UC-08 2a),
  // có mạng lại thì lấy dữ liệu mới nhất và làm mới bản lưu đó.
  const requestKey = `${id ?? ''}|${source}|${attempt}|${isOnline ? 'online' : 'offline'}|${userId ?? ''}`;
  // Kết quả cũ của request khác (đổi id, đổi nguồn, bấm thử lại) không được dùng,
  // nhờ vậy không cần setState trong effect để quay về trạng thái đang tải.
  const settled = result?.key === requestKey ? result.state : null;

  // userId undefined: đang đọc token, chưa biết dùng vùng cache nào.
  const status: Status = !id
    ? 'notFound'
    : userId === undefined
      ? 'loading'
      : (settled?.kind ?? 'loading');
  const data = settled?.kind === 'ready' ? settled.data : null;
  const errorMessage = settled?.kind === 'error' ? settled.message : null;

  const favorite: FavoriteState | null = data
    ? favoriteOverride?.key === requestKey
      ? favoriteOverride
      : initialFavorite(requestKey, data)
    : null;
  const featuredReview = featured?.key === requestKey ? featured.review : null;

  // Tải ngầm đánh giá nổi bật (UC-13, limit=1): ưu tiên đánh giá của mình, không
  // có thì lấy dòng mới nhất. Mất mạng thì bỏ qua, khối đánh giá về trạng thái rỗng.
  const loadFeatured = useCallback(
    (key: string, signal: { cancelled: boolean }) => {
      if (!id || !isOnline) return;
      void listByRecipe(id, source, undefined, 1)
        .then((reviews) => {
          if (!signal.cancelled) {
            setFeatured({ key, review: reviews.mine ?? reviews.data[0] ?? null });
          }
        })
        .catch(() => {
          // Lỗi đánh giá không được làm hỏng phần còn lại của màn chi tiết.
        });
    },
    [id, isOnline, source],
  );

  useEffect(() => {
    if (!id || userId === undefined) return;

    let cancelled = false;
    void loadRecipe(userId, id, source, isOnline)
      .then((loaded) => {
        if (!cancelled) setResult({ key: requestKey, state: { kind: 'ready', data: loaded } });
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key: requestKey, state: toFailure(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [id, isOnline, requestKey, source, userId]);

  useEffect(() => {
    if (!id || userId === undefined) return;

    const signal = { cancelled: false };
    loadFeatured(requestKey, signal);

    return () => {
      signal.cancelled = true;
    };
  }, [id, loadFeatured, requestKey, userId]);

  // Quay lại từ màn đánh giá: điểm trung bình có thể đã đổi (UC-12, UC-15, UC-16)
  // nên tải lại ngầm, giữ nội dung đang hiển thị thay vì nhấp nháy về trạng thái tải.
  const focusedKeyRef = useRef<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      // Lần focus đầu của mỗi requestKey đã có effect bên trên tải.
      if (focusedKeyRef.current !== requestKey) {
        focusedKeyRef.current = requestKey;
        return;
      }
      if (!id || userId === undefined) return;

      const signal = { cancelled: false };
      void loadRecipe(userId, id, source, isOnline)
        .then((loaded) => {
          if (!signal.cancelled) {
            setResult({ key: requestKey, state: { kind: 'ready', data: loaded } });
          }
        })
        .catch(() => {
          // Tải lại ngầm thất bại: giữ nguyên dữ liệu cũ, không đổi trạng thái màn hình.
        });
      loadFeatured(requestKey, signal);

      return () => {
        signal.cancelled = true;
      };
    }, [id, isOnline, loadFeatured, requestKey, source, userId]),
  );

  const retry = () => setAttempt((value) => value + 1);

  // Màn đánh giá cần tên và ảnh món để dựng thẻ ở đầu màn và để gửi snapshot
  // cho công thức Spoonacular; truyền sẵn từ dữ liệu đang hiển thị.
  const openReviews = () => {
    if (!id || !data) return;
    const view = toViewRecipe(data);
    router.push({
      pathname: '/recipe/[id]/reviews',
      params: {
        id,
        source,
        title: view.title,
        ...(view.imageUrl ? { imageUrl: view.imageUrl } : null),
      },
    });
  };

  // UC-09 / UC-11: cập nhật lạc quan, hoàn tác và báo toast khi lỗi.
  // Cache được ghi/xoá bên trong cacheManager, chỉ sau khi server đã nhận.
  const toggleFavorite = async () => {
    if (!data || !favorite || favoritePendingRef.current) return;
    const key = requestKey;
    const previous = favorite;

    if (typeof userId !== 'number') {
      showToast('Không xác định được tài khoản. Vui lòng đăng nhập lại.', 'error');
      return;
    }

    if (previous.saved) {
      // Bản lưu do app cũ ghi không có favorite_id: không biết gọi DELETE dòng nào.
      if (previous.favoriteId === null) {
        showToast(NEED_NETWORK_TO_UNSAVE, 'error');
        return;
      }
      const favoriteId = previous.favoriteId;
      const view = toViewRecipe(data);

      favoritePendingRef.current = true;
      setFavoriteOverride({ key, saved: false, favoriteId: null });
      try {
        await removeFavorite({ userId, favoriteId, recipeId: view.id, source: view.source });
        showToast('Đã bỏ lưu khỏi yêu thích');
      } catch (error) {
        setFavoriteOverride(previous);
        showToast(isNetworkError(error) ? NEED_NETWORK_TO_UNSAVE : getApiErrorMessage(error), 'error');
      } finally {
        favoritePendingRef.current = false;
      }
      return;
    }

    // Lưu cần RecipeDetail đầy đủ từ server để ghi cache, bản lưu trên máy không đủ.
    if (data.origin !== 'network') {
      showToast(NEED_NETWORK_TO_SAVE, 'error');
      return;
    }

    favoritePendingRef.current = true;
    setFavoriteOverride({ key, saved: true, favoriteId: null });
    try {
      const saved = await saveFavorite({ userId, recipe: data.recipe });
      setFavoriteOverride({ key, saved: true, favoriteId: saved.id });
      showToast('Đã lưu vào yêu thích');
    } catch (error) {
      setFavoriteOverride(previous);
      showToast(isNetworkError(error) ? NEED_NETWORK_TO_SAVE : getApiErrorMessage(error), 'error');
    } finally {
      favoritePendingRef.current = false;
    }
  };

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

      {status === 'ready' && data && favorite ? (
        <RecipeBody
          recipe={toViewRecipe(data)}
          isCached={data.origin === 'cache'}
          matchedIds={matchedIds}
          isSaved={favorite.saved}
          // Đã lưu mà thiếu favorite_id (bản lưu cũ khi ngoại tuyến): tắt bỏ lưu.
          unsaveBlocked={favorite.saved && favorite.favoriteId === null}
          onToggleFavorite={() => void toggleFavorite()}
          featuredReview={featuredReview}
          onOpenReviews={openReviews}
        />
      ) : null}

      <Toast toast={toast} />
    </SafeAreaView>
  );
}

type RecipeBodyProps = {
  recipe: ViewRecipe;
  // Đang xem bản lưu trên máy (mất mạng): hiện banner, làm mờ các nút cần mạng.
  isCached: boolean;
  // null khi màn hình không được mở từ luồng tìm kiếm theo nguyên liệu.
  matchedIds: Set<string> | null;
  isSaved: boolean;
  unsaveBlocked: boolean;
  onToggleFavorite: () => void;
  // Đánh giá hiển thị trong khối "Cả nhà nói gì?"; null khi chưa có hoặc mất mạng.
  featuredReview: Review | null;
  onOpenReviews: () => void;
};

function RecipeBody({
  recipe,
  isCached,
  matchedIds,
  isSaved,
  unsaveBlocked,
  onToggleFavorite,
  featuredReview,
  onOpenReviews,
}: RecipeBodyProps) {
  const authorName = recipe.author?.name?.trim();
  const rating = recipe.rating;
  const servingsLabel = recipe.servings !== null ? `${recipe.servings} người` : null;

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
      {/* Frame 2041:25924: đang xem bản lưu ngoại tuyến của công thức yêu thích. */}
      {isCached ? <Notice variant="success" message="Bạn đang xem bản đã lưu trên máy" /> : null}

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
          {/* UC-09 / UC-11: lưu và bỏ lưu yêu thích. Khi bị chặn (thiếu favorite_id)
              vẫn cho bấm để toast giải thích lý do. */}
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved, disabled: unsaveBlocked }}
            accessibilityLabel={isSaved ? 'Bỏ lưu công thức' : 'Lưu công thức vào yêu thích'}
            accessibilityHint={unsaveBlocked ? NEED_NETWORK_TO_UNSAVE : undefined}
            style={[styles.favorite, unsaveBlocked ? styles.favoriteBlocked : null]}
          >
            <Icon icon={icons.heart} style={isSaved ? styles.heartSaved : null} />
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
        {servingsLabel ? <QuickInfoItem icon={icons.users} label={servingsLabel} /> : null}
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
            <Text style={styles.servingText}>{servingsLabel ?? ''}</Text>
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
            disabled={isCached}
          />
          {isCached ? <Text style={styles.needNetwork}>Cần kết nối mạng</Text> : null}
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
          >
            {recipe.servings !== null
              ? `Trên mỗi khẩu phần · ${recipe.servings} khẩu phần / công thức`
              : 'Trên mỗi khẩu phần'}
          </Text>
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
            <Pressable onPress={onOpenReviews} hitSlop={8} accessibilityRole="button">
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
          <Text style={styles.reviewEmpty}>Chưa có đánh giá nào, hãy là người đầu tiên!</Text>
        )}

        {/* Đánh giá nổi bật (frame 2003:10943): tên và sao ở dòng đầu, nhận xét ở dòng sau. */}
        {featuredReview ? (
          <View style={styles.featuredCard}>
            <Text
              style={styles.featuredHeading}
              accessibilityLabel={`${featuredReview.author.name}, ${featuredReview.rating} trên 5 sao`}
            >
              {`${featuredReview.author.name} · ${formatStars(featuredReview.rating)}`}
            </Text>
            {featuredReview.comment?.trim() ? (
              <Text style={styles.featuredComment}>{featuredReview.comment.trim()}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.networkAction}>
          <ActionButton
            title="Viết đánh giá"
            variant="secondary"
            onPress={onOpenReviews}
            disabled={isCached}
          />
          {isCached ? <Text style={styles.needNetwork}>Cần kết nối mạng</Text> : null}
        </View>
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

  // Nút cần mạng khi xem bản lưu (frame 2041:25924): nút mờ 40%, chú thích ngay dưới.
  networkAction: { gap: 7 },
  needNetwork: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textMid,
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
  favoriteBlocked: { opacity: 0.4 },
  heartSaved: { tintColor: colors.primary },
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
  featuredCard: {
    gap: 8,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  featuredHeading: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textDark,
  },
  featuredComment: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textMid,
  },
});
