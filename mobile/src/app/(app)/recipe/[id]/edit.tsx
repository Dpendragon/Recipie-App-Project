import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { Notice } from '@/components/common/Notice';
import { Toast } from '@/components/common/Toast';
import {
  emptyIngredient,
  emptyStep,
  RecipeForm,
  type RecipeFormSubmit,
  type RecipeFormValue,
} from '@/components/recipe/RecipeForm';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { getById, update } from '@/services/api/recipeApi';
import type { RecipeDetail, UpdateRecipeRequest } from '@/types/recipe.types';
import { getApiErrorMessage } from '@/utils/helpers';

// Màn sửa công thức đã đăng: dùng lại form đăng ở chế độ "chỉnh sửa"
// (banner nhắc nằm trong RecipeForm) kèm toast.

type Phase = 'loading' | 'ready' | 'error';

// Giữ toast hiện một nhịp trước khi rời màn hình.
const REDIRECT_DELAY_MS = 900;

const NOT_FOUND = 'Không tìm thấy công thức';
const FORBIDDEN = 'Bạn không có quyền sửa công thức này';

// Hai lỗi không có cách sửa tại chỗ (không phải tác giả, công thức đã bị xoá):
// báo rồi trả người dùng về màn trước, khác với lỗi mạng còn thử lại được.
function fatalMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  if (error.response?.status === 403) return FORBIDDEN;
  if (error.response?.status === 404) return NOT_FOUND;
  return null;
}

// Số thập phân hiển thị theo kiểu Việt như màn chi tiết; form nhận lại cả dấu
// phẩy lẫn dấu chấm nên người dùng sửa kiểu nào cũng được.
function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

// Chi tiết công thức -> giá trị điền sẵn của form. Mỗi dòng lấy một key mới để
// React giữ đúng ô khi thêm/xoá ở giữa danh sách.
function toFormValue(recipe: RecipeDetail): RecipeFormValue {
  const ingredients = recipe.ingredients.map((item) => ({
    ...emptyIngredient(),
    nameVi: item.nameVi,
    nameEn: item.nameEn ?? '',
    quantity: item.quantity === null ? '' : formatQuantity(item.quantity),
    unit: item.unit ?? '',
  }));
  const steps = recipe.steps.map((text) => ({ ...emptyStep(), text }));

  return {
    title: recipe.title,
    servings: String(recipe.servings),
    readyInMinutes: recipe.readyInMinutes === null ? '' : String(recipe.readyInMinutes),
    // Dữ liệu cũ thiếu nguyên liệu hoặc bước thì vẫn phải có một ô trống để nhập.
    ingredients: ingredients.length > 0 ? ingredients : [emptyIngredient()],
    steps: steps.length > 0 ? steps : [emptyStep()],
    videoUrl: recipe.videoUrl ?? '',
    imageUrl: recipe.imageUrl,
  };
}

export default function EditRecipeScreen() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Chỉ công thức LOCAL mới sửa được, và id của bảng recipes luôn là số.
  const recipeId = id && /^\d+$/.test(id) ? Number(id) : null;

  const [phase, setPhase] = useState<Phase>('loading');
  const [initialValue, setInitialValue] = useState<RecipeFormValue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Số lần bấm "Thử lại": đổi giá trị để effect tải lại.
  const [attempt, setAttempt] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Đã lưu thay đổi nhưng ảnh tải lên hỏng: ở lại màn này thay vì tự sang
  // màn chi tiết.
  const [imageFailed, setImageFailed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const leave = useCallback(
    (message: string) => {
      showToast(message, 'error');
      timerRef.current = setTimeout(() => router.back(), REDIRECT_DELAY_MS);
    },
    [router, showToast],
  );

  // Luồng chính bước 2: mở lại form đăng công thức kèm cả danh sách nguyên liệu.
  useEffect(() => {
    if (recipeId === null) {
      leave(NOT_FOUND);
      return;
    }

    let cancelled = false;
    setPhase('loading');
    void getById(String(recipeId), 'LOCAL')
      .then((recipe) => {
        if (cancelled) return;
        setInitialValue(toFormValue(recipe));
        setPhase('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const fatal = fatalMessage(error);
        if (fatal) {
          leave(fatal);
          return;
        }
        setLoadError(getApiErrorMessage(error));
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, leave, recipeId]);

  const openRecipe = useCallback(() => {
    // replace để màn chi tiết dựng lại và tải dữ liệu vừa cập nhật.
    router.replace({ pathname: '/recipe/[id]', params: { id: String(recipeId), source: 'LOCAL' } });
  }, [recipeId, router]);

  // Luồng chính bước 4-7. Gửi cả danh sách nguyên liệu: server đồng bộ lại
  // recipe_ingredients trong một transaction và chỉ tính lại dinh dưỡng khi
  // nguyên liệu hoặc số khẩu phần thực sự đổi.
  const submit = async (value: RecipeFormSubmit) => {
    if (submitting || recipeId === null) return;

    // PATCH nhận null ở ba cột nullable: bỏ trống nghĩa là xoá giá trị cũ.
    const body: UpdateRecipeRequest = {
      title: value.title,
      servings: value.servings,
      readyInMinutes: value.readyInMinutes,
      steps: value.steps,
      videoUrl: value.videoUrl,
      ingredients: value.ingredients,
    };
    // Chỉ gửi imageUrl khi ảnh thực sự đổi: chuỗi là ảnh mới vừa upload, null
    // là người dùng bấm "Gỡ ảnh", undefined là giữ nguyên ảnh cũ.
    if (value.imageUrl !== undefined) body.imageUrl = value.imageUrl;

    setSubmitError(null);
    setImageFailed(false);
    setSubmitting(true);
    try {
      await update(recipeId, body);
      showToast('Đã lưu thay đổi');
      if (value.imageUploadFailed) {
        // Thay đổi đã lưu nhưng ảnh chưa lên được — giữ nguyên
        // màn hình để người dùng lưu lại hoặc tự mở công thức.
        setImageFailed(true);
        setSubmitting(false);
        return;
      }
      // Vẫn để submitting = true tới lúc chuyển màn để không gửi lần hai.
      timerRef.current = setTimeout(openRecipe, REDIRECT_DELAY_MS);
    } catch (error) {
      const fatal = fatalMessage(error);
      if (fatal) {
        setSubmitting(false);
        leave(fatal);
        return;
      }
      setSubmitError(getApiErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardScreen contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              disabled={submitting}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Icon icon={icons.arrowLeft} />
            </Pressable>
            <Text style={styles.headerTitle}>Chỉnh sửa công thức</Text>
          </View>
          <Text style={styles.headerSubtitle}>Một món ngon, một câu chuyện từ bếp nhà.</Text>
        </View>

        {phase === 'loading' ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải công thức…</Text>
          </View>
        ) : null}

        {phase === 'error' ? (
          <View style={styles.errorBlock}>
            <Notice
              variant="error"
              title="Không tải được công thức"
              message={loadError ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
            />
            <ActionButton title="Thử lại" onPress={() => setAttempt((value) => value + 1)} />
          </View>
        ) : null}

        {phase === 'ready' && initialValue ? (
          <RecipeForm
            mode="edit"
            initialValue={initialValue}
            submitting={submitting}
            submitError={submitError}
            onViewSaved={imageFailed ? openRecipe : undefined}
            onSubmit={(value) => void submit(value)}
          />
        ) : null}
      </KeyboardScreen>

      <Toast toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 22, paddingBottom: 70, gap: 22 },
  header: { paddingTop: 9, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28.8,
    letterSpacing: -0.7,
    color: colors.textDark,
  },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19.5, color: colors.textMid },

  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMid },
  errorBlock: { gap: 14 },
});
