import { Pressable, StyleSheet, Text } from 'react-native';
import type { IconAsset } from '@/constants/assets';
import { extraColors, spacing } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { Icon } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  // 'danger': kiểu "Xóa" của thành phần Nút (nút "Xóa đánh giá", frame 2020:1028).
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconAsset;
  // Nút cần mạng khi đang xem bản lưu ngoại tuyến: mờ 40% như frame 2041:25924.
  disabled?: boolean;
};

// Thành phần "Nút hành động" của Figma (2014:784): cao 52, bo tròn, chữ 14, gap 9.
// Không dùng components/common/Button vì nút đó đang dùng chữ 15 và chỉ có biến
// thể viền trắng, còn các màn công thức cần cả biến thể nền xanh nhạt.
export function ActionButton({ title, onPress, variant = 'primary', icon, disabled = false }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : variant === 'danger' ? styles.danger : styles.secondary,
        disabled ? styles.disabled : pressed ? styles.pressed : null,
      ]}
    >
      {icon ? <Icon icon={icon} /> : null}
      <Text
        style={[
          styles.text,
          isPrimary ? styles.textPrimary : variant === 'danger' ? styles.textDanger : styles.textSecondary,
        ]}
      >
        {title}
      </Text>
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
