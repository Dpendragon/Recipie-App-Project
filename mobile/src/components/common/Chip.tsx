import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { icons } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  label: string;
  variant?: 'selected' | 'default' | 'add';
  size?: 'sm' | 'lg'; 
  showClose?: boolean;
  onPress?: () => void;
};

// Viên thuốc nhỏ dùng cho nguyên liệu, bộ lọc, nhãn...
export function Chip({ label, variant = 'default', size = 'sm', showClose = false, onPress }: Props) {
  const isLarge = size === 'lg';
  const textColor = variant === 'default' ? colors.textDark : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={showClose ? `Bỏ ${label}` : label}
      aria-selected={variant === 'selected'}
      style={({ pressed }) => [
        styles.chip,
        isLarge ? styles.large : styles.small,
        variant === 'selected' ? styles.selected : null,
        variant === 'default' ? styles.default : null,
        variant === 'add' ? styles.add : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {variant === 'add' ? <Icon icon={icons.plus} /> : null}
      <Text style={[styles.text, isLarge ? styles.textLarge : null, { color: textColor }]}>{label}</Text>
      {showClose ? <Icon icon={icons.close} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  small: { height: 32, paddingHorizontal: 13 },
  large: { height: 38, paddingHorizontal: 17 },
  selected: { backgroundColor: colors.softGreen, borderColor: colors.primary },
  default: { backgroundColor: colors.white, borderColor: colors.border },
  add: { backgroundColor: 'transparent', borderColor: colors.primary, borderStyle: 'dashed' },
  pressed: { opacity: 0.7 },
  text: { fontFamily: fonts.semiBold, fontSize: 12.5, lineHeight: 16 },
  textLarge: { fontSize: 13 },
});
