import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors, appFonts, appRadius } from '@/constants/theme';
import { relativeWeekName, weekRangeLabel } from '@/utils/mealPlanDates';

type Props = {
  weekStart: Date;
  plannedCount: number;
  onPrev: () => void;
  onNext: () => void;
};

// Thẻ "Chọn tuần": chuyển xem tuần trước / tuần sau (UC-22 bước 2).
export function WeekSwitcher({ weekStart, plannedCount, onPrev, onNext }: Props) {
  const relative = relativeWeekName(weekStart);
  const countText = `${plannedCount} món đã lên kế hoạch`;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPrev}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Tuần trước"
      >
        <Icon icon={icons.chevronLeft} />
      </Pressable>
      <View style={styles.center} accessibilityLiveRegion="polite">
        <Text style={styles.range}>{weekRangeLabel(weekStart)}</Text>
        <Text style={styles.caption}>{relative ? `${relative} · ${countText}` : countText}</Text>
      </View>
      <Pressable
        onPress={onNext}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Tuần sau"
      >
        <Icon icon={icons.chevronRight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: appRadius.card,
    backgroundColor: appColors.primarySoft,
  },
  center: { alignItems: 'center', gap: 3 },
  range: { fontFamily: appFonts.regular, fontSize: 15, color: appColors.primary },
  caption: { fontFamily: appFonts.regular, fontSize: 10, color: appColors.primary },
});
