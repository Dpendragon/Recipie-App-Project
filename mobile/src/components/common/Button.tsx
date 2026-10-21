import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type BoxShadowValue,
} from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  rightIcon?: IconAsset; 
  shadow?: BoxShadowValue[];
  letterSpacing?: number;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  rightIcon,
  shadow,
  letterSpacing = 0.14,
}: Props) {
  const isPrimary = variant === 'primary';
  // Khi đang loading cũng khoá nút để người dùng không bấm 2 lần
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        shadow ? { boxShadow: shadow } : null,
        inactive ? styles.inactive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              { letterSpacing },
              isPrimary ? styles.textPrimary : styles.textOutline,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <Icon icon={rightIcon} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: colors.primary },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  inactive: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
  textPrimary: { color: colors.white },
  textOutline: { color: colors.primary },
});
