import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { appColors, appFonts, appRadius } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  // Theo component "Nút" trong Figma: Chính (nền xanh) / Phụ (nền xanh nhạt).
  variant?: 'primary' | 'secondary';
  icon?: IconAsset;
  loading?: boolean;
  disabled?: boolean;
};

// Nút hành động của bộ thiết kế tông xanh (cao 52, bo tròn hoàn toàn).
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

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        inactive ? styles.inactive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? appColors.white : appColors.primary} />
      ) : (
        <>
          {icon ? <Icon icon={icon} /> : null}
          <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    alignSelf: 'stretch',
    borderRadius: appRadius.pill,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primary: { backgroundColor: appColors.primary },
  secondary: { backgroundColor: appColors.primarySoft },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: appFonts.semiBold, fontSize: 14 },
  textPrimary: { color: appColors.white },
  textSecondary: { color: appColors.primary },
});
