import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { ActionButton } from '@/components/common/ActionButton';
import { Notice } from '@/components/common/Notice';
import { Toast } from '@/components/common/Toast';
import { DeleteRecipeDialog } from '@/components/recipe/DeleteRecipeDialog';
import { formatReviewDate } from '@/components/review/format';
import { icons } from '@/constants/assets';
import { fontSize } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { mine, remove } from '@/services/api/recipeApi';
import type { MyRecipe } from '@/types/recipe.types';
import { getApiErrorMessage } from '@/utils/helpers';

// Công thức của tôi: xem và xoá công thức đã đăng (có dữ liệu, rỗng, hộp xác
// nhận xoá, toast). Thẻ không
// có điểm sao, chỉ "N phút · N người" lấy từ readyInMinutes và servings.

type Phase = 'loading' | 'ready' | 'error';

const PAGE_SIZE = 10;

// "20 phút · 2 người"; công thức không ghi thời gian thì chỉ còn số người ăn.
function formatMeta(recipe: MyRecipe): string {
  const servings = `${recipe.servings} người`;
  return recipe.readyInMinutes ? `${recipe.readyInMinutes} phút · ${servings}` : servings;
}

// Trang sau có thể trùng dòng với trang trước nếu danh sách vừa đổi trên server.
function appendUnique(current: MyRecipe[], next: MyRecipe[]): MyRecipe[] {
  const seen = new Set(current.map((recipe) => recipe.id));
  return [...current, ...next.filter((recipe) => !seen.has(recipe.id))];
}

export default function MyRecipesScreen() {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<MyRecipe[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Thẻ đang chờ xác nhận xoá (null khi hộp thoại đóng).
  const [pendingDelete, setPendingDelete] = useState<MyRecipe | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mỗi lần tải trang đầu tăng id: kết quả của lượt cũ (kể cả trang sau đang
  // tải dở) bị bỏ qua.
  const requestIdRef = useRef(0);
  // Cờ chặn onEndReached gọi trùng khi trang sau chưa về.
  const loadingRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const result = await mine(undefined, PAGE_SIZE);
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

  // Tải lại mỗi lần quay lại màn này: vừa đăng công thức mới hoặc vừa sửa tên,
  // ảnh ở màn khác.
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
      const result = await mine(nextCursor, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      // Trang kế rỗng bất thường: cursor không còn (công thức đó vừa bị xoá) —
      // tải lại từ đầu.
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

  // Xoá: chỉ bỏ thẻ khỏi danh sách sau khi server đã nhận. 404 nghĩa là công
  // thức đã bị xoá từ thiết bị khác, cũng coi như xoá xong.
  const confirmDelete = async () => {
    const recipe = pendingDelete;
    if (!recipe || deleting) return;

    setDeleting(true);
    try {
      await remove(recipe.id);
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 404) {
        setDeleting(false);
        setPendingDelete(null);
        showToast(getApiErrorMessage(error), 'error');
        return;
      }
    }

    setItems((current) => current.filter((item) => item.id !== recipe.id));
    setDeleting(false);
    setPendingDelete(null);
    showToast('Đã xóa công thức');
  };

  const openRecipe = (recipe: MyRecipe) => {
    router.push({ pathname: '/recipe/[id]', params: { id: String(recipe.id), source: 'LOCAL' } });
  };

  // Mở form sửa của đúng công thức đó.
  const openEdit = (recipe: MyRecipe) => {
    router.push({ pathname: '/recipe/[id]/edit', params: { id: String(recipe.id) } });
  };

  // Danh sách cursor không có tổng số: còn trang sau thì thêm "+".
  const countLabel = `Đã đăng · ${items.length}${hasMore ? '+' : ''}`;

  const renderBody = () => {
    if (phase === 'loading') {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải công thức của bạn…</Text>
        </View>
      );
    }

    if (phase === 'error') {
      return (
        <View style={styles.errorBlock}>
          <Notice
            variant="error"
            title="Không tải được công thức của bạn"
            message={errorMessage ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
          />
          <ActionButton title="Thử lại" onPress={retry} />
        </View>
      );
    }

    const isEmpty = items.length === 0;

    return (
      <FlatList
        data={items}
        keyExtractor={(recipe) => String(recipe.id)}
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
            {/* Danh sách rỗng đã có nút "Đăng công thức đầu tiên" trong khung trống. */}
            {isEmpty ? null : (
              <ActionButton
                title="Đăng công thức mới"
                icon={icons.formPlus}
                onPress={() => router.push('/recipe/create')}
              />
            )}
            <View style={styles.sectionHeading}>
              <Text style={styles.countHeading}>{countLabel}</Text>
              {isEmpty ? null : <Text style={styles.sortLabel}>Mới nhất</Text>}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={icons.notebookPenEmpty}
            title="Chia sẻ món nhà đầu tiên"
            message="Bạn chưa đăng công thức nào. Ghi lại nguyên liệu và cách nấu để chia sẻ món ngon với cộng đồng."
            actionTitle="Đăng công thức đầu tiên"
            onAction={() => router.push('/recipe/create')}
            style={styles.emptyInList}
          />
        }
        renderItem={({ item, index }) => (
          <View style={styles.itemWrap}>
            {index === 0 ? (
              <FeaturedCard recipe={item} onOpen={() => openRecipe(item)} />
            ) : (
              <CompactCard recipe={item} onOpen={() => openRecipe(item)} />
            )}
            <ManageRow
              recipe={item}
              onEdit={() => openEdit(item)}
              onDelete={() => setPendingDelete(item)}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.listFooter}>
            {loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            <Notice
              variant="success"
              icon={icons.notebookPen}
              title="Chia sẻ món nhà, theo cách của bạn"
              message="Không có dữ liệu dinh dưỡng? Bạn vẫn đăng công thức được. Nguyên liệu và cách nấu mới là điều quan trọng."
            />
          </View>
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
          <Text style={styles.headerTitle}>Công thức của tôi</Text>
        </View>
        <Text style={styles.headerSubtitle}>Lưu hương vị riêng, chia sẻ điều thân thuộc.</Text>
      </View>

      {renderBody()}

      <DeleteRecipeDialog
        visible={pendingDelete !== null}
        title={pendingDelete?.title ?? null}
        deleting={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
      <Toast toast={toast} />
    </SafeAreaView>
  );
}

type CardProps = { recipe: MyRecipe; onOpen: () => void };

// Kích thước ảnh thẻ (dùng chung cho expo-image và khung giữ chỗ khi thiếu ảnh).
type ImageBox = { width: DimensionValue; height: number; borderRadius: number };

function RecipeImage({ uri, style }: { uri: string | null; style: ImageBox }) {
  return uri ? (
    <Image source={{ uri }} style={style} contentFit="cover" />
  ) : (
    <View style={[style, styles.imagePlaceholder]} />
  );
}

// Thẻ đầu danh sách: ảnh lớn phía trên, thông tin món bên dưới.
function FeaturedCard({ recipe, onOpen }: CardProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Xem công thức ${recipe.title}`}
      style={({ pressed }) => [styles.featuredCard, pressed ? styles.pressed : null]}
    >
      <RecipeImage uri={recipe.imageUrl} style={styles.featuredImage} />
      <View style={styles.featuredInfo}>
        <Text style={styles.ownerText}>Công thức của bạn</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text style={styles.featuredMeta}>{formatMeta(recipe)}</Text>
      </View>
    </Pressable>
  );
}

// Các thẻ còn lại: ảnh nhỏ bên trái, thông tin món bên phải.
function CompactCard({ recipe, onOpen }: CardProps) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Xem công thức ${recipe.title}`}
      style={({ pressed }) => [styles.compactCard, pressed ? styles.pressed : null]}
    >
      <RecipeImage uri={recipe.imageUrl} style={styles.compactImage} />
      <View style={styles.compactInfo}>
        <Text style={styles.ownerText}>Công thức của bạn</Text>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text style={styles.compactMeta}>{formatMeta(recipe)}</Text>
      </View>
    </Pressable>
  );
}

// Hàng dưới mỗi thẻ: ngày đăng bên trái, "Chỉnh sửa" và "Xóa" bên phải.
function ManageRow({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: MyRecipe;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.manageRow}>
      <Text style={styles.postedDate}>Đăng ngày {formatReviewDate(recipe.createdAt)}</Text>
      <View style={styles.manageActions}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Chỉnh sửa ${recipe.title}`}
          style={styles.editButton}
        >
          <Text style={styles.editText}>Chỉnh sửa</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Xóa ${recipe.title}`}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: { gap: 10, paddingHorizontal: 22, paddingTop: 9, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 28.8,
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
  listHeader: { gap: 22 },
  listFooter: { gap: 14, paddingTop: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countHeading: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textDark },
  sortLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  emptyInList: { paddingHorizontal: 0 },

  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMid },
  errorBlock: { gap: 14, paddingHorizontal: 22 },

  itemWrap: { gap: 13 },
  pressed: { opacity: 0.85 },
  imagePlaceholder: { backgroundColor: colors.softGreen },
  ownerText: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },

  featuredCard: {
    gap: 12,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  featuredImage: { width: '100%', height: 180, borderRadius: 20 },
  featuredInfo: { gap: 6, paddingHorizontal: 4, paddingBottom: 5 },
  featuredTitle: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 27, color: colors.textDark },
  featuredMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMid },

  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  compactImage: { width: 92, height: 98, borderRadius: 20 },
  compactInfo: { flex: 1, gap: 5 },
  compactTitle: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 22.5, color: colors.textDark },
  compactMeta: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.textMid },

  manageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postedDate: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },
  manageActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  editButton: { width: 59, height: 44, alignItems: 'center', justifyContent: 'center' },
  editText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.error },
});
