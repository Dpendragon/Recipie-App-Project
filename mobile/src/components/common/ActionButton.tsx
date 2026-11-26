import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { IconAsset } from '@/constants/assets';
import { extraColors, spacing } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { Icon } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  // 'danger': kiểu nút "Xóa" (vd nút "Xóa đánh giá" trong hộp xác nhận).
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconAsset;
  // Đang gửi request: hiện vòng quay thay cho chữ và chặn bấm lại.
  loading?: boolean;
  // Nút cần mạng khi đang xem bản lưu ngoại tuyến: mờ 40%.
  disabled?: boolean;
};

// Nút hành động theo thiết kế: cao 52, bo tròn, chữ 14, gap 9.
// Không dùng components/common/Button vì nút đó đang dùng chữ 15 và chỉ có biến
// thể viền trắng, còn các màn công thức cần cả biến thể nền xanh nhạt.
export function ActionButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
}: Props) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const textColor = isPrimary
    ? styles.textPrimary
    : variant === 'danger'
      ? styles.textDanger
      : styles.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : variant === 'danger' ? styles.danger : styles.secondary,
        disabled ? styles.disabled : pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <>
          {icon ? <Icon icon={icon} /> : null}
          <Text style={[styles.text, textColor]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.softGreen },
  danger: { backgroundColor: extraColors.dangerBg },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  text: { fontFamily: fonts.semiBold, fontSize: 14 },
  textPrimary: { color: colors.white },
  textSecondary: { color: colors.primary },
  textDanger: { color: colors.error },
});
