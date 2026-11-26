import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/common/Icon';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { Toast } from '@/components/common/Toast';
import { RecipeForm, type RecipeFormSubmit } from '@/components/recipe/RecipeForm';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { create } from '@/services/api/recipeApi';
import type { CreateRecipeRequest } from '@/types/recipe.types';
import { getApiErrorMessage } from '@/utils/helpers';

// Màn đăng công thức cá nhân: form, trạng thái đang đăng, toast và trường hợp
// tải ảnh thất bại.

// Giữ toast "Đã đăng công thức" hiện một nhịp trước khi sang màn chi tiết.
const REDIRECT_DELAY_MS = 900;

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Id công thức vừa tạo khi ảnh tải lên hỏng: ở lại màn này, người dùng tự
  // bấm "Xem công thức".
  const [savedId, setSavedId] = useState<string | null>(null);

  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (redirectRef.current) clearTimeout(redirectRef.current);
    },
    [],
  );

  const openRecipe = (id: string) => {
    router.replace({ pathname: '/recipe/[id]', params: { id, source: 'LOCAL' } });
  };

  const submit = async (value: RecipeFormSubmit) => {
    if (submitting || savedId !== null) return;

    // POST /recipes không nhận null: trường để trống thì bỏ hẳn khỏi body.
    const body: CreateRecipeRequest = {
      title: value.title,
      servings: value.servings,
      steps: value.steps,
      ingredients: value.ingredients,
    };
    if (value.readyInMinutes !== null) body.readyInMinutes = value.readyInMinutes;
    if (value.videoUrl !== null) body.videoUrl = value.videoUrl;
    // Ảnh được form upload trước khi gọi vào đây; upload lỗi thì imageUrl là
    // undefined và công thức vẫn được lưu không có ảnh.
    if (value.imageUrl) body.imageUrl = value.imageUrl;

    setSubmitError(null);
    setSubmitting(true);
    try {
      const created = await create(body);
      // Công thức đã lưu kể cả khi chưa ước tính được dinh dưỡng:
      // màn chi tiết tự ẩn phần dinh dưỡng khi coverage là NONE.
      showToast('Đã đăng công thức');
      if (value.imageUploadFailed) {
        // Đã lưu nhưng thiếu ảnh — giữ nguyên màn hình, form ẩn
        // nút đăng và hiện thông báo kèm nút "Xem công thức".
        setSavedId(String(created.id));
        setSubmitting(false);
        return;
      }
      // Vẫn để submitting = true tới lúc chuyển màn để không gửi lần hai.
      redirectRef.current = setTimeout(() => openRecipe(String(created.id)), REDIRECT_DELAY_MS);
    } catch (error) {
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
            <Text style={styles.headerTitle}>Đăng công thức mới</Text>
          </View>
          <Text style={styles.headerSubtitle}>Một món ngon, một câu chuyện từ bếp nhà.</Text>
        </View>

        <RecipeForm
          mode="create"
          submitting={submitting}
          submitError={submitError}
          onViewSaved={savedId === null ? undefined : () => openRecipe(savedId)}
          onSubmit={(value) => void submit(value)}
        />
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
});
