import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { Image } from 'expo-image';
import { isAxiosError } from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActionButton } from '@/components/common/ActionButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Notice } from '@/components/common/Notice';
import { Toast } from '@/components/common/Toast';
import { icons } from '@/constants/assets';
import { extraColors, fontSize } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useNetwork } from '@/hooks/useNetwork';
import { useToast } from '@/hooks/useToast';
import {
  listFavorites,
  OfflineEmptyCacheError,
  removeFavorite,
  type FavoriteListResult,
} from '@/services/cache/cacheManager';
import type { RecipeSource } from '@/types/recipe.types';
import { getApiErrorMessage } from '@/utils/helpers';

// UC-10 Xem danh sách yêu thích (frame 2003:8848 có dữ liệu, 2003:8968 rỗng,
// 2041:25858 ngoại tuyến, 2003:9028 đang tải) và UC-11 bỏ lưu ngay trên thẻ.

type Phase = 'loading' | 'ready' | 'offlineEmpty' | 'error';

// Một dòng yêu thích dựng được từ cả response server lẫn bản lưu trên máy.
// favoriteId null: dòng cache do bản app cũ ghi, chưa biết id để gọi DELETE.
type FavoriteItem = {
  key: string;
  favoriteId: number | null;
  recipeId: string;
  source: RecipeSource;
  title: string;
  imageUrl: string | null;
};

const SOURCE_LABEL: Record<RecipeSource, string> = {
  LOCAL: 'Cộng đồng',
  SPOONACULAR: 'Spoonacular',
};

const PAGE_SIZE = 10;
const NEED_NETWORK_TO_UNSAVE = 'Cần kết nối mạng để bỏ lưu';
// Màu khung xương ở frame đang tải: đậm hơn cho khối chính, nhạt hơn cho dòng phụ.
const SKELETON_STRONG = colors.border;
const SKELETON_SOFT = extraColors.skeletonSoft;

// Tính năng chưa nối API: báo cho người dùng thay vì để nút bấm không phản hồi.
function comingSoon() {
  Alert.alert('Sắp có', 'Tính năng này đang được hoàn thiện.');
}

function itemKey(recipeId: string, source: RecipeSource): string {
  return `${source}:${recipeId}`;
}

function toItems(result: FavoriteListResult): FavoriteItem[] {
  if (result.origin === 'network') {
    return result.data.map((favorite) => ({
      key: itemKey(favorite.recipeId, favorite.source),
      favoriteId: favorite.id,
      recipeId: favorite.recipeId,
      source: favorite.source,
      title: favorite.title,
      imageUrl: favorite.imageUrl,
    }));
  }
  return result.data.map((cached) => ({
    key: itemKey(cached.recipeId, cached.source),
    favoriteId: cached.favoriteId,
    recipeId: cached.recipeId,
    source: cached.source,
    title: cached.title ?? 'Công thức đã lưu',
    imageUrl: cached.imageUrl,
  }));
}

// Trang sau có thể trùng dòng với trang trước nếu danh sách vừa đổi trên server.
function appendUnique(current: FavoriteItem[], next: FavoriteItem[]): FavoriteItem[] {
  const seen = new Set(current.map((item) => item.key));
  return [...current, ...next.filter((item) => !seen.has(item.key))];
}

// Không gọi tới được server (mất mạng, timeout): khác lỗi có response từ server.
function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { isOnline } = useNetwork();
  const userId = useCurrentUserId();
  const { toast, showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [origin, setOrigin] = useState<'network' | 'cache'>('network');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mỗi lần tải trang đầu tăng id: kết quả của lượt cũ (kể cả trang sau đang
  // tải dở) bị bỏ qua, tránh trộn danh sách mạng với danh sách cache.
  const requestIdRef = useRef(0);
  // Cờ chặn onEndReached gọi trùng khi trang sau chưa về.
  const loadingRef = useRef(false);
  // Thẻ đang bỏ lưu, chặn bấm hai lần.
  const removingRef = useRef(new Set<string>());

  const loadFirstPage = useCallback(async () => {
    if (typeof userId !== 'number') return;
    const requestId = ++requestIdRef.current;

    try {
      // Có mạng: cacheManager làm mới title/ảnh của các dòng cache đã có (quy tắc 3).
      // Mất mạng: đọc bản lưu trên máy của đúng user_id này.
      const result = await listFavorites({ userId, isOnline, limit: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      setItems(toItems(result));
      setOrigin(result.origin);
      setNextCursor(result.meta.nextCursor);
      setHasMore(result.meta.hasMore);
      setErrorMessage(null);
      setPhase('ready');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      if (error instanceof OfflineEmptyCacheError) {
        setPhase('offlineEmpty');
      } else {
        setErrorMessage(getApiErrorMessage(error));
        setPhase('error');
      }
    }
  }, [isOnline, userId]);

  // Tải lại mỗi khi quay lại tab (vừa lưu/bỏ lưu ở màn chi tiết) và khi đổi mạng
  // (loadFirstPage đổi theo isOnline). Danh sách cũ vẫn hiển thị trong lúc chờ.
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
    // Bản lưu trên máy không có cursor của server: chỉ phân trang khi có mạng.
    if (loadingRef.current || !hasMore || nextCursor === null || origin !== 'network') return;
    if (typeof userId !== 'number') return;

    const requestId = requestIdRef.current;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const result = await listFavorites({ userId, isOnline, cursor: nextCursor, limit: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      setItems((current) => appendUnique(current, toItems(result)));
      setNextCursor(result.meta.nextCursor);
      setHasMore(result.meta.hasMore);
    } catch (error) {
      if (requestId === requestIdRef.current) showToast(getApiErrorMessage(error), 'error');
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  };

  // UC-11: gỡ thẻ ngay (lạc quan), trả lại đúng vị trí cũ nếu server không nhận.
  // Cache chỉ bị xoá trong cacheManager sau khi server đã trả 204.
  const unsave = async (item: FavoriteItem) => {
    if (typeof userId !== 'number' || removingRef.current.has(item.key)) return;
    if (item.favoriteId === null) {
      showToast(NEED_NETWORK_TO_UNSAVE, 'error');
      return;
    }

    const favoriteId = item.favoriteId;
    const index = items.findIndex((current) => current.key === item.key);
    removingRef.current.add(item.key);
    setItems((current) => current.filter((entry) => entry.key !== item.key));

    try {
      await removeFavorite({ userId, favoriteId, recipeId: item.recipeId, source: item.source });
      showToast('Đã bỏ lưu khỏi yêu thích');
    } catch (error) {
      setItems((current) => {
        if (current.some((entry) => entry.key === item.key)) return current;
        const position = index < 0 ? current.length : Math.min(index, current.length);
        return [...current.slice(0, position), item, ...current.slice(position)];
      });
      showToast(isNetworkError(error) ? NEED_NETWORK_TO_UNSAVE : getApiErrorMessage(error), 'error');
    } finally {
      removingRef.current.delete(item.key);
    }
  };

  const openRecipe = (item: FavoriteItem) => {
    router.push({ pathname: '/recipe/[id]', params: { id: item.recipeId, source: item.source } });
  };

  const isOffline = origin === 'cache';
  // Danh sách cursor không có tổng số: còn trang sau thì thêm "+".
  const countLabel = `${items.length}${hasMore ? '+' : ''}`;

  const renderBody = () => {
    // Không đọc được tài khoản: không được đụng vào cache (phân vùng theo user_id).
    if (userId === null) {
      return (
        <EmptyState
          icon={icons.recipeNotFound}
          title="Không xác định được tài khoản"
          message="Vui lòng đăng nhập lại để xem danh sách yêu thích."
          actionTitle="Về trang chủ"
          onAction={() => router.replace('/(app)/(tabs)')}
        />
      );
    }

    if (userId === undefined || phase === 'loading') return <FavoritesSkeleton />;

    if (phase === 'offlineEmpty') {
      return (
        <EmptyState
          icon={icons.recipeOffline}
          title="Chưa có công thức nào để xem khi mất mạng"
          message="Khi có mạng, chạm biểu tượng trái tim ở công thức bạn thích để lưu bản xem ngoại tuyến trên máy."
          actionTitle="Thử lại"
          onAction={retry}
        />
      );
    }

    if (phase === 'error') {
      return (
        <EmptyState
          icon={icons.recipeNotFound}
          title="Không tải được danh sách yêu thích"
          message={errorMessage ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
          actionTitle="Thử lại"
          onAction={retry}
        />
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
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
          <View style={styles.listHeader}>
            {isOffline ? (
              <Notice
                variant="warning"
                icon={icons.wifiOff}
                title="Bạn đang ngoại tuyến"
                message={`${items.length} công thức yêu thích có Bản lưu ngoại tuyến trên thiết bị. Chỉ các bản này dùng được khi mất mạng, không phải toàn bộ ứng dụng.`}
              />
            ) : null}
            <Text style={styles.countHeading}>
              {isOffline ? `Bản lưu ngoại tuyến · ${countLabel}` : `Yêu thích · ${countLabel}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={icons.heartEmpty}
            title="Chưa có công thức yêu thích"
            message="Khám phá công thức bạn thích và chạm biểu tượng trái tim để thêm vào Yêu thích."
            actionTitle="Khám phá món ngon"
            // Chưa có màn khám phá (UC-06/UC-07), tạm đưa về tab chính.
            onAction={() => router.navigate('/(app)/(tabs)')}
            footnote="Một nơi để giữ những hương vị bạn muốn nấu lại."
            style={styles.emptyInList}
          />
        }
        renderItem={({ item, index }) =>
          index === 0 ? (
            <FeaturedCard
              item={item}
              isOffline={isOffline}
              onOpen={() => openRecipe(item)}
              onUnsave={() => void unsave(item)}
            />
          ) : (
            <CompactCard item={item} isOffline={isOffline} onOpen={() => openRecipe(item)} />
          )
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            {loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            {isOffline ? (
              <>
                <Notice
                  variant="success"
                  icon={icons.cloudOff}
                  title="Kết nối mạng để dùng thêm"
                  message="Tìm món mới, gửi đánh giá, cập nhật kế hoạch và đồng bộ mua sắm tạm thời không khả dụng."
                />
                <Text style={styles.footnote}>
                  Bỏ lưu sẽ xóa cả Bản lưu ngoại tuyến trên thiết bị. Kết nối lại để cập nhật nội
                  dung mới nhất.
                </Text>
              </>
            ) : items.length > 0 ? (
              // TODO(Kế hoạch bữa ăn): nối API thêm món vào kế hoạch, bỏ comingSoon().
              <ActionButton
                title="Thêm món vào kế hoạch"
                variant="secondary"
                icon={icons.calendarGreen}
                onPress={comingSoon}
              />
            ) : null}
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <Text style={styles.headerSubtitle}>Những món ngon bạn muốn nấu lại.</Text>
      </View>

      {renderBody()}

      <Toast toast={toast} />
    </SafeAreaView>
  );
}

type CardProps = {
  item: FavoriteItem;
  isOffline: boolean;
  onOpen: () => void;
};

// Kích thước ảnh thẻ (dùng chung cho expo-image và khung giữ chỗ khi thiếu ảnh).
type ImageBox = { width: DimensionValue; height: number; borderRadius: number };

function RecipeImage({ uri, style }: { uri: string | null; style: ImageBox }) {
  return uri ? (
    <Image source={{ uri }} style={style} contentFit="cover" />
  ) : (
    <View style={[style, styles.imagePlaceholder]} />
  );
}

// Thẻ đầu danh sách: ảnh lớn, nút tim để bỏ lưu, hàng hành động bên dưới.
function FeaturedCard({ item, isOffline, onOpen, onUnsave }: CardProps & { onUnsave: () => void }) {
  // Dòng cache thiếu favorite_id: vẫn cho bấm để toast giải thích, nhưng làm mờ.
  const unsaveBlocked = item.favoriteId === null;

  return (
    <View style={styles.featuredWrap}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Xem công thức ${item.title}`}
        style={({ pressed }) => [styles.featuredCard, pressed ? styles.pressed : null]}
      >
        <View>
          <RecipeImage uri={item.imageUrl} style={styles.featuredImage} />
          <Pressable
            onPress={onUnsave}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Bỏ lưu ${item.title}`}
            accessibilityState={{ disabled: unsaveBlocked }}
            accessibilityHint={unsaveBlocked ? NEED_NETWORK_TO_UNSAVE : undefined}
            style={[styles.heartButton, unsaveBlocked ? styles.blocked : null]}
          >
            <Icon icon={icons.heartCard} />
          </Pressable>
        </View>
        <View style={styles.featuredInfo}>
          <Text style={styles.sourceText}>{SOURCE_LABEL[item.source]}</Text>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {isOffline ? (
            <Text style={styles.offlineReady}>Bản lưu ngoại tuyến · sẵn sàng xem</Text>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.featuredActions}>
        <Pressable onPress={onOpen} hitSlop={8} accessibilityRole="button">
          <Text style={styles.featuredLink}>Xem nguyên liệu & cách làm →</Text>
        </Pressable>
        <Pressable
          onPress={onUnsave}
          accessibilityRole="button"
          accessibilityLabel={`Bỏ lưu ${item.title}`}
          accessibilityState={{ disabled: unsaveBlocked }}
          style={[styles.unsaveButton, unsaveBlocked ? styles.blocked : null]}
        >
          <Text style={styles.unsaveText}>Bỏ lưu</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Các thẻ còn lại: ảnh nhỏ bên trái, nguồn và tên món bên phải.
function CompactCard({ item, isOffline, onOpen }: CardProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Xem công thức ${item.title}`}
      style={({ pressed }) => [styles.compactCard, pressed ? styles.pressed : null]}
    >
      <RecipeImage uri={item.imageUrl} style={styles.compactImage} />
      <View style={[styles.compactInfo, isOffline ? styles.compactInfoOffline : null]}>
        <Text style={styles.sourceText}>{SOURCE_LABEL[item.source]}</Text>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {isOffline ? <Text style={styles.offlineLabel}>Bản lưu ngoại tuyến</Text> : null}
      </View>
    </Pressable>
  );
}

function Bar({
  width,
  height,
  color = SKELETON_SOFT,
  radius: barRadius = 5,
}: {
  width: DimensionValue;
  height: number;
  color?: string;
  radius?: number;
}) {
  return <View style={{ width, height, borderRadius: barRadius, backgroundColor: color }} />;
}

// Frame đang tải 2003:9028: khung xương theo đúng bố cục thẻ lớn + hai thẻ nhỏ.
function FavoritesSkeleton() {
  return (
    <View
      style={styles.list}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải danh sách yêu thích"
    >
      <Bar width={150} height={18} color={SKELETON_STRONG} />

      <View style={styles.featuredWrap}>
        <View style={[styles.featuredCard, styles.skeletonFeatured]}>
          <Bar width="100%" height={180} color={SKELETON_STRONG} radius={20} />
          <View style={styles.skeletonFeaturedInfo}>
            <Bar width={82} height={10} />
            <Bar width={230} height={20} color={SKELETON_STRONG} radius={6} />
            <Bar width={170} height={12} />
            <Bar width={210} height={12} />
          </View>
        </View>
        <View style={styles.featuredActions}>
          <Bar width={154} height={12} />
          <Bar width={44} height={44} radius={radius.input} />
        </View>
      </View>

      {[0, 1].map((key) => (
        <View key={key} style={[styles.compactCard, styles.skeletonCompact]}>
          <Bar width={92} height={98} color={SKELETON_STRONG} radius={20} />
          <View style={styles.skeletonCompactInfo}>
            <Bar width={70} height={10} />
            <Bar width={184} height={18} color={SKELETON_STRONG} />
            <Bar width={130} height={10} />
          </View>
        </View>
      ))}

      <Bar width="100%" height={52} color={SKELETON_STRONG} radius={radius.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: { gap: 10, paddingHorizontal: 22, paddingTop: 9, paddingBottom: 20 },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: colors.textDark,
  },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMid },

  list: { paddingHorizontal: 22, paddingBottom: 40, gap: 22 },
  listHeader: { gap: 22 },
  listFooter: { gap: 14 },
  countHeading: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textDark },
  emptyInList: { paddingHorizontal: 0, paddingTop: 24 },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textMid,
  },

  pressed: { opacity: 0.85 },
  blocked: { opacity: 0.4 },
  imagePlaceholder: { backgroundColor: colors.softGreen },

  sourceText: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },

  featuredWrap: { gap: 12 },
  featuredCard: {
    gap: 12,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  featuredImage: { width: '100%', height: 180, borderRadius: 20 },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  featuredInfo: { gap: 6, paddingHorizontal: 4, paddingBottom: 5 },
  featuredTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textDark },
  offlineReady: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  featuredActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  featuredLink: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  unsaveButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  unsaveText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMid },

  compactCard: {
    flexDirection: 'row',
    gap: 13,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  compactImage: { width: 92, height: 98, borderRadius: 20 },
  compactInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  compactInfoOffline: { gap: 5 },
  compactTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textDark },
  offlineLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMid },

  skeletonFeatured: { height: 318, gap: 16 },
  skeletonFeaturedInfo: { gap: 10, paddingHorizontal: 4 },
  skeletonCompact: { height: 118 },
  skeletonCompactInfo: { flex: 1, gap: 13, paddingTop: 8 },
});
