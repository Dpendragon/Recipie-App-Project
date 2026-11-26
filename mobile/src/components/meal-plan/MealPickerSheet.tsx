import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAxiosError } from 'axios';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { NoticeBox } from '@/components/common/NoticeBox';
import { ScreenTitle } from '@/components/common/ScreenTitle';
import { icons } from '@/constants/assets';
import { appColors, appFonts, appRadius, SCREEN_PADDING } from '@/constants/theme';
import * as favoriteApi from '@/services/api/favoriteApi';
import { addMealPlanEntry, changeMealPlanEntry } from '@/services/api/mealPlanApi';
import type { Favorite, FavoriteListResponse } from '@/types/favorite.types';
import type { MealPlanEntry, MealSlot } from '@/types/mealPlan.types';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  dayFull,
  MEAL_SLOT_LABELS,
  MEAL_SLOTS,
  toDateOnly,
  weekRangeShort,
} from '@/utils/mealPlanDates';
import { RecipeThumb } from './RecipeThumb';
import { SOURCE_LABELS } from './MealSlotSection';

const PAGE_SIZE = 20;

// add: thêm món mới vào 1 buổi (UC-21). change: thay đúng 1 món đã gán (UC-23).
export type PickerMode =
  | { type: 'add'; date: Date; slot: MealSlot }
  | { type: 'change'; date: Date; entry: MealPlanEntry };

type Props = {
  mode: PickerMode | null;
  weekStart: Date;
  // Các món đã có trong ngày đang chọn (cả 3 buổi).
  dayEntries: MealPlanEntry[];
  onClose: () => void;
  // Gọi sau khi lưu thành công (hoặc khi cần làm mới kế hoạch).
  onSaved: () => void;
};

// Sheet chỉ được mount khi đang mở, nên mỗi lần mở là một trạng thái mới tinh.
export function MealPickerSheet({ mode, ...rest }: Props) {
  if (!mode) return null;
  return <PickerContent mode={mode} {...rest} />;
}

function PickerContent({
  mode,
  weekStart,
  dayEntries,
  onClose,
  onSaved,
}: Omit<Props, 'mode'> & { mode: PickerMode }) {
  const [slot, setSlot] = useState<MealSlot>(
    mode.type === 'add' ? mode.slot : mode.entry.mealSlot,
  );
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loadingRef = useRef(true);

  const applyPage = useCallback((page: FavoriteListResponse, append: boolean) => {
    setFavorites((prev) => (append ? [...prev, ...page.data] : page.data));
    setCursor(page.meta.nextCursor);
    setHasMore(page.meta.hasMore);
  }, []);

  // Tải trang đầu danh sách Yêu thích khi mở sheet.
  useEffect(() => {
    let active = true;
    favoriteApi.list(undefined, PAGE_SIZE)
      .then((page) => {
        if (active) applyPage(page, false);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(getApiErrorMessage(error));
      })
      .finally(() => {
        loadingRef.current = false;
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyPage]);

  // Tải trang kế tiếp khi cuộn gần cuối, hoặc thử lại sau lỗi.
  const loadPage = async (nextCursor: number | null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      applyPage(await favoriteApi.list(nextCursor ?? undefined, PAGE_SIZE), nextCursor !== null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const isChange = mode.type === 'change';
  const slotLabel = MEAL_SLOT_LABELS[slot].title;
  const slotEntries = dayEntries.filter((e) => e.mealSlot === slot);
  const selected = favorites.find((f) => f.id === selectedId) ?? null;

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    const recipe = {
      recipeId: selected.recipeId,
      source: selected.source,
      // Snapshot chỉ được backend dùng với SPOONACULAR; LOCAL server tự lấy.
      titleSnapshot: selected.title,
      imageSnapshot: selected.imageUrl ?? undefined,
    };
    try {
      if (mode.type === 'change') {
        await changeMealPlanEntry(mode.entry.id, recipe);
      } else {
        await addMealPlanEntry({ ...recipe, date: toDateOnly(mode.date), mealSlot: slot });
      }
      onSaved();
      onClose();
    } catch (error) {
      if (mode.type === 'change' && isAxiosError(error) && error.response?.status === 404) {
        // Món cần đổi không còn trong kế hoạch (vd đã xoá ở thiết bị khác).
        setSubmitError('Món này không còn trong kế hoạch. Kế hoạch sẽ được làm mới.');
        onSaved();
      } else {
        setSubmitError(getApiErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <View style={styles.headerContent}>
      {/* Bối cảnh: tuần, ngày và buổi đang thêm món */}
      <View style={styles.contextCard}>
        <View style={styles.weekRow}>
          <Icon icon={icons.calendarSmall} />
          <Text style={styles.weekText}>Tuần {weekRangeShort(weekStart)}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ngày thêm món</Text>
          <View style={styles.fieldValue}>
            <Text style={styles.fieldText}>{dayFull(mode.date)}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          {MEAL_SLOTS.map((s) => {
            const active = s === slot;
            return (
              <Pressable
                key={s}
                onPress={() => setSlot(s)}
                // Đổi món thì ngày và buổi giữ nguyên.
                disabled={isChange}
                style={[
                  styles.chip,
                  active ? styles.chipActive : null,
                  isChange && !active ? styles.chipDisabled : null,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled: isChange }}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                  {MEAL_SLOT_LABELS[s].short}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Các món đang có trong buổi này */}
      {slotEntries.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>
            {slotLabel} đang có · {slotEntries.length}
          </Text>
          {slotEntries.map((entry) => {
            const replacing = isChange && entry.id === mode.entry.id;
            return (
              <View key={entry.id} style={[styles.currentRow, replacing ? styles.currentRowActive : null]}>
                <Text style={styles.currentTitle} numberOfLines={1}>
                  {entry.title ?? 'Món không tên'}
                </Text>
                <Text style={[styles.currentState, replacing ? styles.currentStateActive : null]}>
                  {replacing ? 'Sẽ được thay' : 'Giữ nguyên'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Chọn từ Yêu thích</Text>
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      {loading ? <ActivityIndicator color={appColors.primary} /> : null}
      {loadError ? (
        <View style={styles.block}>
          <Text style={styles.errorText}>{loadError}</Text>
          <ActionButton
            title="Thử lại"
            variant="secondary"
            onPress={() => loadPage(favorites.length > 0 ? cursor : null)}
          />
        </View>
      ) : null}
      {!loading && !loadError && favorites.length === 0 ? (
        <Text style={styles.emptyText}>
          Bạn chưa lưu công thức yêu thích nào. Hãy lưu công thức ở màn chi tiết để thêm vào kế
          hoạch.
        </Text>
      ) : null}
    </View>
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScreenTitle
          title={isChange ? 'Đổi món trong bữa' : 'Thêm món vào bữa'}
          left={
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Icon icon={icons.arrowLeft} />
            </Pressable>
          }
        />

        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loading && !loadError) loadPage(cursor);
          }}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            const card = (
              <Pressable
                onPress={() => setSelectedId(isSelected ? null : item.id)}
                style={styles.recipeCard}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.title}
              >
                <RecipeThumb imageUrl={item.imageUrl} width={92} height={98} radius={appRadius.cardLarge} />
                <View style={styles.recipeTexts}>
                  <Text style={styles.recipeSource}>{SOURCE_LABELS[item.source]}</Text>
                  <Text style={styles.recipeTitle} numberOfLines={3}>
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            );
            if (!isSelected) return card;
            return (
              <View style={styles.selectedWrap}>
                {card}
                <View style={styles.selectedRow}>
                  <Icon icon={icons.circleCheckSmall} />
                  <Text style={styles.selectedText}>
                    {isChange ? 'Món mới sẽ thay vào bữa này' : 'Đã chọn để thêm · 1 món'}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.bottomBar}>
          <NoticeBox
            icon={icons.infoGreen}
            message={
              isChange
                ? 'Chỉ món đang chọn được thay, các món khác trong bữa giữ nguyên.'
                : 'Bạn đang thêm món mới, không thay thế món đã có. Mỗi bữa có thể thêm nhiều món.'
            }
          />
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <ActionButton
            title={
              isChange
                ? 'Đổi sang món này'
                : `Thêm 1 món vào ${slotLabel.toLowerCase()}`
            }
            icon={isChange ? undefined : icons.plusWhite}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!selected}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  listContent: { paddingHorizontal: SCREEN_PADDING, paddingBottom: 16 },
  headerContent: { gap: 22, paddingBottom: 12 },
  contextCard: {
    gap: 14,
    padding: 18,
    borderRadius: appRadius.cardLarge,
    backgroundColor: appColors.primarySoft,
  },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekText: { fontFamily: appFonts.regular, fontSize: 11, color: appColors.primary },
  field: { gap: 7 },
  fieldLabel: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.textDark },
  fieldValue: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: appRadius.input,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  fieldText: { fontFamily: appFonts.regular, fontSize: 14, color: appColors.textDark },
  chips: { flexDirection: 'row', gap: 7 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: appRadius.pill,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  chipActive: { borderColor: appColors.primary, backgroundColor: appColors.primarySoft },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontFamily: appFonts.regular, fontSize: 12, color: appColors.textDark },
  chipTextActive: { fontFamily: appFonts.semiBold, color: appColors.primary },
  block: { gap: 12 },
  sectionTitle: { fontFamily: appFonts.semiBold, fontSize: 18, color: appColors.textDark },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: appColors.surface,
  },
  currentRowActive: { borderWidth: 1, borderColor: appColors.primary },
  currentTitle: { flex: 1, fontFamily: appFonts.regular, fontSize: 12, color: appColors.textDark },
  currentState: { fontFamily: appFonts.regular, fontSize: 10, color: appColors.textMuted },
  currentStateActive: { fontFamily: appFonts.semiBold, color: appColors.primary },
  separator: { height: 12 },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 10,
    borderRadius: appRadius.cardLarge,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  recipeTexts: { flex: 1, gap: 5 },
  recipeSource: { fontFamily: appFonts.regular, fontSize: 10, color: appColors.textMuted },
  recipeTitle: { fontFamily: appFonts.semiBold, fontSize: 15, lineHeight: 22, color: appColors.textDark },
  selectedWrap: {
    gap: 8,
    padding: 8,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, paddingBottom: 5 },
  selectedText: { fontFamily: appFonts.semiBold, fontSize: 11, color: appColors.primary },
  footer: { paddingTop: 16, gap: 12 },
  emptyText: {
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: appColors.textMuted,
    textAlign: 'center',
  },
  errorText: { fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18, color: appColors.danger },
  bottomBar: {
    gap: 12,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
    backgroundColor: appColors.background,
  },
});
