import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { Notice } from '@/components/common/Notice';
import { Toast } from '@/components/common/Toast';
import { DeleteReviewDialog } from '@/components/review/DeleteReviewDialog';
import { RatingSummary } from '@/components/review/RatingSummary';
import { ReviewForm } from '@/components/review/ReviewForm';
import { ReviewItem } from '@/components/review/ReviewItem';
import { icons } from '@/constants/assets';
import { fontSize, spacing } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { getById } from '@/services/api/recipeApi';
import { listByRecipe, remove, upsert } from '@/services/api/reviewApi';
import type { RecipeSource } from '@/types/recipe.types';
import type { Review, ReviewSummary, UpsertReviewRequest } from '@/types/review.types';
import { getApiErrorMessage } from '@/utils/helpers';

// UC-12 gửi đánh giá, UC-13 xem danh sách, UC-15 sửa, UC-16 xoá.
// Frame: 2003:10768 (form + tổng quan), 2003:9171 (đã đánh giá),
// 2003:9237 (chưa đánh giá), 2020:1028 (hộp xoá), 2075:1506 (toast).

type Phase = 'loading' | 'ready' | 'error';

const PAGE_SIZE = 10;
const EMPTY_SUMMARY: ReviewSummary = { average: 0, count: 0 };
const RATING_REQUIRED = 'Hãy chọn từ 1 đến 5 sao trước khi gửi.';
// Giới hạn cột snapshot của backend; cắt ở client để không bị 400 vì quá dài.
const TITLE_SNAPSHOT_MAX = 255;
const IMAGE_SNAPSHOT_MAX = 500;

const SOURCE_LABEL: Record<RecipeSource, string> = {
  LOCAL: 'Cộng đồng',
  SPOONACULAR: 'Spoonacular',
};

// Route param là string tuỳ ý, chỉ nhận đúng hai giá trị API chấp nhận.
function toSource(value: string | undefined): RecipeSource {
  return value === 'SPOONACULAR' ? 'SPOONACULAR' : 'LOCAL';
}

function trimmedParam(value: string | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

// Trang sau có thể trùng dòng với trang trước nếu có người vừa sửa đánh giá
// (danh sách sắp theo updatedAt giảm dần nên dòng vừa sửa nhảy lên đầu).
function appendUnique(current: Review[], next: Review[]): Review[] {
  const seen = new Set(current.map((review) => review.id));
  return [...current, ...next.filter((review) => !seen.has(review.id))];
}

export default function RecipeReviewsScreen() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const {
    id,
    source: sourceParam,
    title: titleParam,
    imageUrl: imageUrlParam,
  } = useLocalSearchParams<{
    id: string;
    source?: string;
    title?: string;
    imageUrl?: string;
  }>();
  const source = toSource(sourceParam);

  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);
  const [mine, setMine] = useState<Review | null>(null);
  const [others, setOthers] = useState<Review[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Thẻ món ở đầu màn: ưu tiên dữ liệu màn chi tiết truyền sang, thiếu thì gọi getById.
  const [fetched, setFetched] = useState<{ title: string; imageUrl: string | null } | null>(null);
  const paramTitle = trimmedParam(titleParam);
  const recipeTitle = paramTitle ?? fetched?.title ?? null;
  const recipeImage = trimmedParam(imageUrlParam) ?? fetched?.imageUrl ?? null;

  // Form: rating 0 là chưa chọn sao.
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mỗi lần tải trang đầu tăng id: kết quả của lượt cũ (kể cả trang sau đang
  // tải dở) bị bỏ qua.
  const requestIdRef = useRef(0);
  // Cờ chặn bấm "Xem thêm" khi trang sau chưa về.
  const loadingRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    if (!id) return;
    const requestId = ++requestIdRef.current;

    try {
      const result = await listByRecipe(id, source, undefined, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      setSummary(result.summary);
      setMine(result.mine);
      setOthers(result.data);
      setNextCursor(result.meta.nextCursor);
      setHasMore(result.meta.hasMore);
      setErrorMessage(null);
      setPhase('ready');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setErrorMessage(getApiErrorMessage(error));
      setPhase('error');
    }
  }, [id, source]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    // Chỉ gọi chi tiết khi màn trước không truyền tên món sang.
    if (!id || paramTitle) return;

    let cancelled = false;
    void getById(id, source)
      .then((recipe) => {
        if (!cancelled) setFetched({ title: recipe.title, imageUrl: recipe.imageUrl });
      })
      .catch(() => {
        // Thiếu thẻ món không chặn việc đọc và gửi đánh giá; chỉ nguồn
        // SPOONACULAR cần tên món để gửi, trường hợp đó báo lỗi ngay tại form.
      });

    return () => {
      cancelled = true;
    };
  }, [id, paramTitle, source]);

  const retry = () => {
    setPhase('loading');
    void loadFirstPage();
  };

  const loadMore = async () => {
    if (!id || loadingRef.current || !hasMore || nextCursor === null) return;

    const requestId = requestIdRef.current;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const result = await listByRecipe(id, source, nextCursor, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      // Trang kế rỗng bất thường: cursor không còn (đánh giá đó vừa bị xoá hoặc
      // vừa được sửa nên nhảy lên đầu danh sách) — tải lại từ đầu.
      if (result.data.length === 0) {
        await loadFirstPage();
        return;
      }
      setOthers((current) => appendUnique(current, result.data));
      setNextCursor(result.meta.nextCursor);
      setHasMore(result.meta.hasMore);
    } catch (error) {
      if (requestId === requestIdRef.current) showToast(getApiErrorMessage(error), 'error');
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  };

  // UC-15: "Sửa" mở form ở chế độ cập nhật và điền sẵn đánh giá hiện tại.
  const startEdit = () => {
    if (!mine) return;
    setRating(mine.rating);
    setComment(mine.comment ?? '');
    setRatingError(null);
    setSubmitError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setRating(0);
    setComment('');
    setRatingError(null);
    setSubmitError(null);
  };

  const changeRating = (value: number) => {
    setRating(value);
    setRatingError(null);
  };

  // UC-12 / UC-15 dùng chung một endpoint upsert, POST trả { review, summary }
  // nên cập nhật tổng quan và "Đánh giá của bạn" ngay, không tải lại danh sách.
  const submit = async () => {
    if (!id || submitting) return;

    if (rating < 1 || rating > 5) {
      setRatingError(RATING_REQUIRED);
      setSubmitError(null);
      return;
    }

    // Công thức Spoonacular không có trong cơ sở dữ liệu: backend trả 400 nếu
    // thiếu titleSnapshot, nên luôn gửi kèm dữ liệu đang hiển thị.
    if (source === 'SPOONACULAR' && !recipeTitle) {
      setRatingError(null);
      setSubmitError('Chưa tải được thông tin món ăn. Vui lòng thử lại.');
      return;
    }

    const isEdit = editing;
    const body: UpsertReviewRequest = { rating };
    const text = comment.trim();
    if (text) body.comment = text;
    if (source === 'SPOONACULAR' && recipeTitle) {
      body.titleSnapshot = recipeTitle.slice(0, TITLE_SNAPSHOT_MAX);
      if (recipeImage) body.imageSnapshot = recipeImage.slice(0, IMAGE_SNAPSHOT_MAX);
    }

    setRatingError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await upsert(id, source, body);
      setSummary(result.summary);
      setMine(result.review);
      // Đóng form và xoá nháp: lần sau bấm "Sửa" sẽ điền lại từ đánh giá mới.
      setEditing(false);
      setRating(0);
      setComment('');
      showToast(isEdit ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // UC-16: 204 là đã xoá; 404 nghĩa là không còn gì để xoá (có thể đã xoá từ
  // thiết bị khác) nên cũng coi như xoá xong. Cả hai nhánh tải lại tổng quan.
  const confirmDelete = async () => {
    if (!id || deleting) return;

    setDeleting(true);
    try {
      await remove(id, source);
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 404) {
        setDeleting(false);
        setDeleteVisible(false);
        showToast(getApiErrorMessage(error), 'error');
        return;
      }
    }

    setDeleting(false);
    setDeleteVisible(false);
    setMine(null);
    cancelEdit();
    showToast('Đã xóa đánh giá');
    await loadFirstPage();
  };

  const showForm = phase === 'ready' && (mine === null || editing);

  return (
    <View style={styles.screen}>
      <KeyboardScreen contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Icon icon={icons.arrowLeft} />
          </Pressable>
          <Text style={styles.headerTitle}>Đánh giá món ăn</Text>
        </View>

        <View style={styles.content}>
          {recipeTitle ? (
            <View style={styles.recipeCard}>
              {recipeImage ? (
                <Image source={{ uri: recipeImage }} style={styles.recipeImage} contentFit="cover" />
              ) : (
                <View style={[styles.recipeImage, styles.imagePlaceholder]} />
              )}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeSource}>{SOURCE_LABEL[source]}</Text>
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {recipeTitle}
                </Text>
              </View>
            </View>
          ) : null}

          {phase === 'loading' ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải đánh giá…</Text>
            </View>
          ) : null}

          {phase === 'error' ? (
            <View style={styles.errorBlock}>
              <Notice
                variant="error"
                title="Không tải được đánh giá"
                message={errorMessage ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
              />
              <ActionButton title="Thử lại" onPress={retry} />
            </View>
          ) : null}

          {phase === 'ready' ? (
            <>
              <RatingSummary average={summary.average} count={summary.count} />

              {mine ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
                    <View style={styles.sectionActions}>
                      <Pressable
                        onPress={startEdit}
                        disabled={editing}
                        accessibilityRole="button"
                        accessibilityLabel="Sửa đánh giá của bạn"
                        style={styles.sectionAction}
                      >
                        <Text style={styles.editText}>Sửa</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setDeleteVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Xóa đánh giá của bạn"
                        style={styles.sectionAction}
                      >
                        <Text style={styles.deleteText}>Xóa</Text>
                      </Pressable>
                    </View>
                  </View>
                  <ReviewItem review={mine} variant="mine" />
                </View>
              ) : null}

              {showForm ? (
                <ReviewForm
                  mode={editing ? 'edit' : 'create'}
                  rating={rating}
                  comment={comment}
                  onChangeRating={changeRating}
                  onChangeComment={setComment}
                  ratingError={ratingError}
                  submitError={submitError}
                  submitting={submitting}
                  onSubmit={() => void submit()}
                  onCancel={cancelEdit}
                />
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Từ những căn bếp khác</Text>
                {others.length > 0 ? (
                  others.map((review) => <ReviewItem key={review.id} review={review} />)
                ) : (
                  <Text style={styles.emptyText}>
                    {mine
                      ? 'Chưa có đánh giá nào khác cho món này.'
                      : 'Chưa có đánh giá nào, hãy là người đầu tiên!'}
                  </Text>
                )}

                {hasMore ? (
                  loadingMore ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <ActionButton
                      title="Xem thêm đánh giá"
                      variant="secondary"
                      onPress={() => void loadMore()}
                    />
                  )
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      </KeyboardScreen>

      <DeleteReviewDialog
        visible={deleteVisible}
        deleting={deleting}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => void confirmDelete()}
      />
      <Toast toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 70 },

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

  content: { paddingHorizontal: 22, gap: 22 },

  center: { alignItems: 'center', gap: spacing.md, paddingVertical: 40 },
  loadingText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMid },
  errorBlock: { gap: 14 },

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

  section: { gap: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: colors.textDark },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sectionAction: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.primary },
  deleteText: { fontFamily: fonts.semiBold, fontSize: fontSize.xs, color: colors.error },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textMid },
});
