import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'soft'; 
  loading?: boolean; 
  disabled?: boolean;
  leftIcon?: IconAsset; 
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
}: Props) {
  const isPrimary = variant === 'primary';
  const variantStyle =
    variant === 'primary' ? styles.primary : variant === 'outline' ? styles.outline : styles.soft;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        inactive ? styles.inactive : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <>
          {leftIcon ? <Icon icon={leftIcon} /> : null}
          <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textOutline]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  soft: { backgroundColor: colors.softGreen },
  inactive: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  text: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20 },
  textPrimary: { color: colors.white },
  textOutline: { color: colors.primary },
});
