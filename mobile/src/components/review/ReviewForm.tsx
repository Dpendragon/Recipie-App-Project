import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { Notice } from '@/components/common/Notice';
import { extraColors } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { RatingInput } from './RatingInput';

export const COMMENT_MAX_LENGTH = 1000;

// Lời nhận xét ngắn theo số sao, ghép vào dòng gợi ý "5/5 · Rất ngon! …" (frame 2003:10768).
const RATING_LABEL: Record<number, string> = {
  1: 'Chưa hợp khẩu vị.',
  2: 'Tạm được.',
  3: 'Khá ngon.',
  4: 'Ngon.',
  5: 'Rất ngon!',
};

type Props = {
  // 'create': chưa có đánh giá (frame 2003:9237); 'edit': sửa đánh giá đã có (2003:10768).
  mode: 'create' | 'edit';
  rating: number;
  comment: string;
  onChangeRating: (value: number) => void;
  onChangeComment: (value: string) => void;
  // Lỗi tại form khi chưa chọn sao (UC-12 2a).
  ratingError: string | null;
  // Lỗi server trả về khi gửi.
  submitError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ReviewForm({
  mode,
  rating,
  comment,
  onChangeRating,
  onChangeComment,
  ratingError,
  submitError,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const isEdit = mode === 'edit';
  const submitTitle = isEdit ? 'Cập nhật' : 'Gửi đánh giá';

  return (
    <View style={styles.form}>
      <Text style={styles.title}>{isEdit ? 'Chỉnh sửa đánh giá' : 'Chia sẻ cảm nhận của bạn'}</Text>
      <Text style={styles.hint}>
        {isEdit
          ? 'Mỗi người có 1 đánh giá cho mỗi công thức. Lưu sẽ cập nhật đánh giá hiện tại.'
          : 'Bạn chưa đánh giá món này. Chọn từ 1–5 sao để gửi đánh giá.'}
      </Text>

      <Text style={styles.label}>Bạn chấm món này mấy sao? *</Text>
      <RatingInput value={rating} onChange={onChangeRating} disabled={submitting} />
      {ratingError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {ratingError}
        </Text>
      ) : rating > 0 ? (
        <Text style={styles.hint}>{`${rating}/5 · ${RATING_LABEL[rating]} Chọn từ 1–5 sao để gửi.`}</Text>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Nhận xét (không bắt buộc)</Text>
        <TextInput
          value={comment}
          onChangeText={onChangeComment}
          placeholder="Món ăn có hợp khẩu vị của bạn không?"
          placeholderTextColor={colors.textMid}
          multiline
          maxLength={COMMENT_MAX_LENGTH}
          editable={!submitting}
          textAlignVertical="top"
          accessibilityLabel="Nhận xét, không bắt buộc"
          style={[styles.input, isEdit ? styles.inputEdit : styles.inputCreate]}
        />
      </View>

      <Notice variant="error" message={submitError} />

      {submitting ? (
        <View style={[styles.mutedButton, styles.busyButton]} accessibilityLabel="Đang gửi đánh giá">
          <ActivityIndicator color={colors.white} />
        </View>
      ) : rating === 0 ? (
        // Frame 2003:9237: chưa chọn sao thì nút xám. Vẫn bấm được để báo lỗi tại
        // form thay vì im lặng; onSubmit tự chặn không gửi.
        <Pressable
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityHint="Cần chọn ít nhất 1 sao"
          style={styles.mutedButton}
        >
          <Text style={styles.mutedText}>{submitTitle}</Text>
        </Pressable>
      ) : (
        <ActionButton title={submitTitle} onPress={onSubmit} />
      )}

      {isEdit ? (
        <Pressable
          onPress={onCancel}
          disabled={submitting}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>Hủy chỉnh sửa</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 15, padding: 18, borderRadius: 20, backgroundColor: colors.softGreen },
  title: { fontFamily: fonts.semiBold, fontSize: 19, lineHeight: 28.5, color: colors.textDark },
  hint: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.primary },
  label: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, color: colors.textDark },
  error: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.error },
  field: { gap: 7 },
  input: {
    paddingHorizontal: 16,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textDark,
  },
  inputCreate: { minHeight: 110, paddingVertical: 16 },
  inputEdit: { minHeight: 52, paddingVertical: 14 },
  mutedButton: {
    height: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: extraColors.disabledBg,
  },
  busyButton: { backgroundColor: colors.primary, opacity: 0.85 },
  mutedText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textMid },
  cancel: { alignSelf: 'center' },
  cancelText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.primary,
  },
});
