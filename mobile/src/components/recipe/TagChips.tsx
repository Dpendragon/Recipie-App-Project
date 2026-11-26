import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/constants/layout';
import type { RecipeTag } from '@/constants/recipeTags';
import { colors, fonts, radius } from '@/constants/theme';

// Nhóm chip chọn nhiều giá trị cho form đăng/sửa công thức (UC-17, UC-19),
// theo Figma frame 2003:10409: lớp Form/DietTags (2352:1448) và
// Form/DishTypeTags (2352:1463). Cả hai nhóm đều không bắt buộc.

type Props = {
  label: string;
  options: readonly RecipeTag[];
  // Các value đang được chọn.
  selected: string[];
  disabled?: boolean;
  onToggle: (value: string) => void;
};

export function TagChips({ label, options, selected, disabled, onToggle }: Props) {
  return (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.labelOptional}>(không bắt buộc)</Text>
      </View>
      <View style={styles.chips}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => onToggle(option.value)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: Boolean(disabled) }}
              style={[styles.chip, isSelected ? styles.chipOn : styles.chipOff]}
            >
              <Text style={isSelected ? styles.chipTextOn : styles.chipTextOff}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 7 },
  labelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textDark },
  labelOptional: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.textMid },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 33,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  chipOn: { backgroundColor: colors.softGreen, borderColor: colors.primary },
  chipTextOff: { fontFamily: fonts.regular, fontSize: 12, color: colors.textDark },
  chipTextOn: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
});
