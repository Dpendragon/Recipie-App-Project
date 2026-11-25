import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors, appFonts, appRadius } from '@/constants/theme';
import type { MealPlanEntry, MealSlot } from '@/types/mealPlan.types';
import { MEAL_SLOT_LABELS } from '@/utils/mealPlanDates';
import { RecipeThumb } from './RecipeThumb';

const EMPTY_MESSAGES: Record<MealSlot, string> = {
  breakfast: 'Thêm món bạn thích để bắt đầu một ngày đủ đầy.',
  lunch: 'Thêm món cho bữa trưa để không phải nghĩ khi đến giờ ăn.',
  dinner: 'Thêm món cho bữa tối để cả nhà quây quần.',
};

export const SOURCE_LABELS = { LOCAL: 'Cộng đồng', SPOONACULAR: 'Spoonacular' } as const;

type Props = {
  slot: MealSlot;
  entries: MealPlanEntry[];
  // Bấm 1 món đã gán -> mở menu "Đổi món" / "Xoá khỏi kế hoạch".
  onEntryPress: (entry: MealPlanEntry) => void;
  onAdd: () => void;
};

// 1 buổi ăn: danh sách các món đã gán + luôn có nút "Thêm món" (UC-22).
export function MealSlotSection({ slot, entries, onEntryPress, onAdd }: Props) {
  const label = MEAL_SLOT_LABELS[slot].title;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {label}
        </Text>
        <Text style={styles.count}>
          {entries.length > 0 ? `${entries.length} món` : 'Chưa có món'}
        </Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon icon={slot === 'breakfast' ? icons.coffee : icons.salad} />
          <Text style={styles.emptyTitle}>{label} còn trống</Text>
          <Text style={styles.emptyText}>{EMPTY_MESSAGES[slot]}</Text>
        </View>
      ) : (
        entries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => onEntryPress(entry)}
            style={({ pressed }) => [styles.dishCard, pressed ? styles.pressed : null]}
            accessibilityRole="button"
            accessibilityLabel={entry.title ?? 'Món không tên'}
            accessibilityHint="Mở menu đổi món hoặc xoá khỏi kế hoạch"
          >
            <RecipeThumb imageUrl={entry.imageUrl} width={64} height={64} radius={appRadius.cardLarge} />
            <View style={styles.dishTexts}>
              <Text style={styles.dishTitle} numberOfLines={2}>
                {entry.title ?? 'Món không tên'}
              </Text>
              <Text style={styles.dishCaption}>{SOURCE_LABELS[entry.source]}</Text>
            </View>
            <Icon icon={icons.ellipsis} />
          </Pressable>
        ))
      )}

      <ActionButton
        title={`Thêm món ${label.toLowerCase()}`}
        variant="secondary"
        icon={icons.plusGreen}
        onPress={onAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: appFonts.semiBold, fontSize: 18, color: appColors.textDark },
  count: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.primary },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    padding: 22,
    borderRadius: 18,
    backgroundColor: appColors.surface,
  },
  emptyTitle: {
    fontFamily: appFonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
    color: appColors.textDark,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: appFonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: appColors.textMuted,
    textAlign: 'center',
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: appRadius.card,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  pressed: { opacity: 0.85 },
  dishTexts: { flex: 1, gap: 3 },
  dishTitle: { fontFamily: appFonts.semiBold, fontSize: 14, lineHeight: 21, color: appColors.textDark },
  dishCaption: { fontFamily: appFonts.regular, fontSize: 10, lineHeight: 15, color: appColors.textMuted },
});
