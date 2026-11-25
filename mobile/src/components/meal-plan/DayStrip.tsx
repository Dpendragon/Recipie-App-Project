import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appColors, appFonts, appRadius } from '@/constants/theme';
import { dayHeading, isSameDay, toDateOnly, weekdayShort } from '@/utils/mealPlanDates';

type Props = {
  days: Date[];
  selected: Date;
  // Các ngày (YYYY-MM-DD) đã có ít nhất 1 món — hiện chấm nhỏ dưới số ngày.
  plannedDates: Set<string>;
  onSelect: (day: Date) => void;
};

// Hàng 7 ngày trong tuần; chọn 1 ngày để xem 3 buổi của ngày đó.
export function DayStrip({ days, selected, plannedDates, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const active = isSameDay(day, selected);
        const planned = plannedDates.has(toDateOnly(day));
        return (
          <Pressable
            key={toDateOnly(day)}
            onPress={() => onSelect(day)}
            style={[styles.day, active ? styles.dayActive : null]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${dayHeading(day)}${planned ? ', đã có món' : ''}`}
          >
            <Text style={[styles.weekday, active ? styles.textActive : null]}>
              {weekdayShort(day)}
            </Text>
            <Text style={[styles.date, active ? styles.textActive : null]}>{day.getDate()}</Text>
            <View
              style={[
                styles.dot,
                planned ? (active ? styles.dotActive : styles.dotPlanned) : null,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: appRadius.pill,
    backgroundColor: appColors.surface,
  },
  dayActive: { backgroundColor: appColors.primary },
  weekday: { fontFamily: appFonts.regular, fontSize: 10, color: appColors.textMuted },
  date: { fontFamily: appFonts.semiBold, fontSize: 17, color: appColors.textDark },
  textActive: { color: appColors.white },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotPlanned: { backgroundColor: appColors.primary },
  dotActive: { backgroundColor: appColors.white },
});
