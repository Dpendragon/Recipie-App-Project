import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActionButton } from '@/components/common/ActionButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Notice } from '@/components/common/Notice';
import { Toast } from '@/components/common/Toast';
import { formatReviewDate, formatStars } from '@/components/review/format';
import { icons } from '@/constants/assets';
import { extraColors, fontSize, spacing } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { listMine } from '@/services/api/reviewApi';
import type { RecipeSource } from '@/types/recipe.types';
import type { MyReview } from '@/types/review.types';
import { getApiErrorMessage } from '@/utils/helpers';

// UC-14 Xem danh sách đánh giá của mình (frame 2003:10678 có dữ liệu,
// 2041:25851 rỗng). Màn chỉ đọc: sửa (UC-15) và xoá (UC-16) vẫn làm ở màn
// đánh giá của công thức, mở từ chi tiết công thức.

type Phase = 'loading' | 'ready' | 'error';

const PAGE_SIZE = 10;
// Nhận xét lưu đầy đủ ở server, danh sách chỉ hiện vài dòng đầu.
const COMMENT_LINES = 3;

const SOURCE_LABEL: Record<RecipeSource, string> = {
  LOCAL: 'Cộng đồng',
  SPOONACULAR: 'Spoonacular',
};

// Danh sách sắp theo updatedAt giảm dần nên một đánh giá vừa được sửa có thể
// nhảy lên đầu và lọt vào cả hai trang.
function appendUnique(current: MyReview[], next: MyReview[]): MyReview[] {
  const seen = new Set(current.map((review) => review.id));
  return [...current, ...next.filter((review) => !seen.has(review.id))];
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<MyReview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mỗi lần tải trang đầu tăng id: kết quả của lượt cũ (kể cả trang sau đang
  // tải dở) bị bỏ qua.
  const requestIdRef = useRef(0);
  // Cờ chặn onEndReached gọi trùng khi trang sau chưa về.
  const loadingRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const result = await listMine(undefined, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      setItems(result.data);
      setNextCursor(result.meta.nextCursor);
      setHasMore(result.meta.hasMore);
      setErrorMessage(null);
      setPhase('ready');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setErrorMessage(getApiErrorMessage(error));
      setPhase('error');
    }
  }, []);

  // Tải lại từ đầu mỗi lần quay lại màn này: đánh giá có thể vừa được sửa hoặc
  // xoá ở màn đánh giá của công thức.
  useFocusEffect(
    useCallback(() => {
      void loadFirstPage();
    }, [loadFirstPage]),
  );

  const retry = () => {
    setPhase('loading');
    void loadFirstPage();
  };

  const refresh = () => {
    setRefreshing(true);
    void loadFirstPage().finally(() => setRefreshing(false));
  };

  const loadMore = async () => {
    if (loadingRef.current || !hasMore || nextCursor === null) return;

    const requestId = requestIdRef.current;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const result = await listMine(nextCursor, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      // Trang kế rỗng bất thường: cursor không còn (đánh giá đó vừa bị xoá hoặc
      // vừa được sửa nên nhảy lên đầu danh sách) — tải lại từ đầu.
      if (result.data.length === 0) {
        await loadFirstPage();
        return;
      }
      setItems((current) => appendUnique(current, result.data));
      setNextCursor(result.meta.nextCursor);
      setHasMore(result.meta.hasMore);
    } catch (error) {
      if (requestId === requestIdRef.current) showToast(getApiErrorMessage(error), 'error');
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  };

  // Công thức có thể đã bị xoá hoặc không còn khả dụng: dòng vẫn hiện bằng
  // snapshot tên/ảnh, chỉ màn chi tiết mới báo "Không tìm thấy công thức".
  const openRecipe = (review: MyReview) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: review.recipeId, source: review.source },
    });
  };

  // Danh sách cursor không có tổng số: còn trang sau thì thêm "+".
  const countLabel = `Tất cả · ${items.length}${hasMore ? '+' : ''}`;

  const renderBody = () => {
    if (phase === 'loading') {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải đánh giá của bạn…</Text>
        </View>
      );
    }

    if (phase === 'error') {
      return (
        <View style={styles.errorBlock}>
          <Notice
            variant="error"
            title="Không tải được đánh giá của bạn"
            message={errorMessage ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
          />
          <ActionButton title="Thử lại" onPress={retry} />
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(review) => String(review.id)}
        contentContainerStyle={styles.list}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          items.length > 0 ? <Text style={styles.countHeading}>{countLabel}</Text> : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={icons.starOutline}
            title="Bạn chưa đánh giá công thức nào"
            message="Nấu thử một món bạn thích rồi để lại vài dòng nhận xét, đánh giá của bạn sẽ hiện ở đây."
            actionTitle="Khám phá công thức"
            // Chưa có màn khám phá (UC-06/UC-07), tạm đưa về tab chính.
            onAction={() => router.navigate('/(app)/(tabs)')}
            style={styles.emptyInList}
          />
        }
        renderItem={({ item }) => <MyReviewRow review={item} onOpen={() => openRecipe(item)} />}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Icon icon={icons.arrowLeft} />
          </Pressable>
          <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
        </View>
        <Text style={styles.headerSubtitle}>Góp một lời nhận xét, thêm một bữa cơm ngon.</Text>
      </View>

      {renderBody()}

      <Toast toast={toast} />
    </SafeAreaView>
  );
}

// Một đánh giá: thẻ công thức bấm được, hàng sao + ngày, nhận xét rút gọn.
function MyReviewRow({ review, onOpen }: { review: MyReview; onOpen: () => void }) {
  const comment = review.comment?.trim();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Xem công thức ${review.title}`}
        style={({ pressed }) => [styles.recipeCard, pressed ? styles.pressed : null]}
      >
        {review.imageUrl ? (
          <Image source={{ uri: review.imageUrl }} style={styles.recipeImage} contentFit="cover" />
        ) : (
          <View style={[styles.recipeImage, styles.imagePlaceholder]} />
        )}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeSource}>{SOURCE_LABEL[review.source]}</Text>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {review.title}
          </Text>
          <Text style={styles.recipeLink}>Xem công thức →</Text>
        </View>
      </Pressable>

      <View style={styles.ratingRow}>
        <Text style={styles.stars} accessibilityLabel={`${review.rating} trên 5 sao`}>
          {formatStars(review.rating)}
        </Text>
        <Text style={styles.date}>{formatReviewDate(review.updatedAt)}</Text>
      </View>

      {comment ? (
        <Text style={styles.comment} numberOfLines={COMMENT_LINES}>
          {comment}
        </Text>
      ) : null}

      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: { gap: 10, paddingHorizontal: 22, paddingTop: 9, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.textMid,
  },

  list: { paddingHorizontal: 22, paddingBottom: 40, gap: 22 },
  listFooter: { paddingTop: 6 },
  countHeading: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  emptyInList: { paddingHorizontal: 0 },

  center: { alignItems: 'center', gap: spacing.md, paddingVertical: 40 },
  loadingText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMid },
  errorBlock: { gap: 14, paddingHorizontal: 22 },

  row: { gap: 12 },
  pressed: { opacity: 0.85 },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recipeImage: { width: 92, height: 98, borderRadius: 20 },
  imagePlaceholder: { backgroundColor: colors.softGreen },
  recipeInfo: { flex: 1, gap: 5 },
  recipeSource: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },
  recipeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22.5,
    color: colors.textDark,
  },
  recipeLink: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.textMid },

  ratingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stars: { fontFamily: fonts.regular, fontSize: 16, color: extraColors.star },
  date: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },

  comment: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMid },

  separator: { height: 1, backgroundColor: colors.border },
});
