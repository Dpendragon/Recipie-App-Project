import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { isAxiosError } from 'axios';
import { ActionButton } from '@/components/common/ActionButton';
import { ScreenTitle } from '@/components/common/ScreenTitle';
import { DayStrip } from '@/components/meal-plan/DayStrip';
import { MealActionMenu } from '@/components/meal-plan/MealActionMenu';
import { MealPickerSheet, type PickerMode } from '@/components/meal-plan/MealPickerSheet';
import { MealSlotSection } from '@/components/meal-plan/MealSlotSection';
import { WeekSwitcher } from '@/components/meal-plan/WeekSwitcher';
import { appColors, appFonts, SCREEN_PADDING } from '@/constants/theme';
import { getMealPlan, removeMealPlanEntry } from '@/services/api/mealPlanApi';
import type { MealPlanEntry } from '@/types/mealPlan.types';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  addDays,
  dayHeading,
  isSameDay,
  MEAL_SLOTS,
  startOfWeek,
  today,
  toDateOnly,
  weekDays,
} from '@/utils/mealPlanDates';

export default function MealPlanScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today()));
  const [selectedDate, setSelectedDate] = useState(() => today());
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuEntry, setMenuEntry] = useState<MealPlanEntry | null>(null);
  const [picker, setPicker] = useState<PickerMode | null>(null);
  // Bỏ qua kết quả của request cũ khi người dùng chuyển tuần liên tục.
  const requestId = useRef(0);

  const load = useCallback(async (week: Date) => {
    const id = ++requestId.current;
    setLoadError(null);
    try {
      const data = await getMealPlan(toDateOnly(week), toDateOnly(addDays(week, 6)));
      if (id === requestId.current) setEntries(data);
    } catch (error) {
      if (id === requestId.current) setLoadError(getApiErrorMessage(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Tải khi mở tab và mỗi khi đổi tuần.
  useFocusEffect(
    useCallback(() => {
      load(weekStart);
    }, [load, weekStart]),
  );

  const changeWeek = (offsetWeeks: number) => {
    const next = addDays(weekStart, offsetWeeks * 7);
    const now = today();
    setWeekStart(next);
    // Tuần chứa hôm nay thì chọn hôm nay, còn lại chọn Thứ Hai.
    setSelectedDate(isSameDay(startOfWeek(now), next) ? now : next);
    setEntries([]);
    setLoading(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(weekStart);
    setRefreshing(false);
  };

  // Xoá món — gỡ ngay trên giao diện, lỗi thì trả lại.
  const handleRemove = async (entry: MealPlanEntry) => {
    setMenuEntry(null);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await removeMealPlanEntry(entry.id);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        // Đã bị xoá ở nơi khác — coi như xong, chỉ làm mới cho đồng bộ.
        load(weekStart);
        return;
      }
      setEntries((prev) => [...prev, entry]);
      Alert.alert('Không xoá được món', getApiErrorMessage(error));
    }
  };

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const plannedDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const selectedKey = toDateOnly(selectedDate);
  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedKey),
    [entries, selectedKey],
  );
  const isToday = isSameDay(selectedDate, today());

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={appColors.primary}
            colors={[appColors.primary]}
          />
        }
      >
        <ScreenTitle title="Tuần này ăn gì?" subtitle="Chủ động bữa ngon, nhẹ đầu mỗi ngày." />

        <View style={styles.content}>
          <WeekSwitcher
            weekStart={weekStart}
            plannedCount={entries.length}
            onPrev={() => changeWeek(-1)}
            onNext={() => changeWeek(1)}
          />
          <DayStrip
            days={days}
            selected={selectedDate}
            plannedDates={plannedDates}
            onSelect={setSelectedDate}
          />

          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle} accessibilityRole="header">
              {dayHeading(selectedDate)}
            </Text>
            {isToday ? <Text style={styles.todayText}>Hôm nay</Text> : null}
          </View>

          {loading ? (
            <ActivityIndicator color={appColors.primary} style={styles.loader} />
          ) : loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loadError}</Text>
              <ActionButton
                title="Thử lại"
                variant="secondary"
                onPress={() => {
                  setLoading(true);
                  load(weekStart);
                }}
              />
            </View>
          ) : (
            <>
              {MEAL_SLOTS.map((slot) => (
                <MealSlotSection
                  key={slot}
                  slot={slot}
                  entries={dayEntries.filter((e) => e.mealSlot === slot)}
                  onEntryPress={setMenuEntry}
                  onAdd={() => setPicker({ type: 'add', date: selectedDate, slot })}
                />
              ))}
              <Text style={styles.footnote}>
                Mỗi bữa có thể có nhiều món. Đổi hoặc xoá một món không ảnh hưởng các món còn lại.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <MealActionMenu
        visible={menuEntry !== null}
        title={menuEntry?.title ?? null}
        onClose={() => setMenuEntry(null)}
        onChange={() => {
          if (!menuEntry) return;
          const entry = menuEntry;
          setMenuEntry(null);
          setPicker({ type: 'change', date: selectedDate, entry });
        }}
        onRemove={() => {
          if (menuEntry) handleRemove(menuEntry);
        }}
      />

      <MealPickerSheet
        mode={picker}
        weekStart={weekStart}
        dayEntries={dayEntries}
        onClose={() => setPicker(null)}
        onSaved={() => load(weekStart)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  scrollContent: { paddingBottom: 28 },
  content: { paddingHorizontal: SCREEN_PADDING, gap: 22 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayTitle: { fontFamily: appFonts.semiBold, fontSize: 18, color: appColors.textDark },
  todayText: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.primary },
  loader: { paddingVertical: 40 },
  errorBox: { gap: 16, paddingVertical: 24 },
  errorText: {
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: appColors.textMuted,
    textAlign: 'center',
  },
  footnote: { fontFamily: appFonts.regular, fontSize: 11, lineHeight: 17, color: appColors.textMuted },
});
