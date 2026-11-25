import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { Icon } from '@/components/common/Icon';
import { NoticeBox } from '@/components/common/NoticeBox';
import { ScreenTitle } from '@/components/common/ScreenTitle';
import { AddItemForm } from '@/components/shopping/AddItemForm';
import { NoteEditor } from '@/components/shopping/NoteEditor';
import { ShoppingEmptyState } from '@/components/shopping/ShoppingEmptyState';
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow';
import {
  RecipeGroupHeader,
  SectionTitle,
} from '@/components/shopping/ShoppingSectionHeader';
import { icons } from '@/constants/assets';
import { appColors, appFonts, SCREEN_PADDING } from '@/constants/theme';
import {
  createShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem,
} from '@/services/api/shoppingApi';
import type { ShoppingItem } from '@/types/shopping.types';
import { getApiErrorMessage } from '@/utils/helpers';
import { groupShoppingItems } from '@/utils/shoppingGroups';

type LoadStatus = 'loading' | 'error' | 'ready';

const isNotFound = (error: unknown) =>
  isAxiosError(error) && error.response?.status === 404;

export default function ShoppingScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [boughtCollapsed, setBoughtCollapsed] = useState(false);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await getShoppingItems();
      setItems(data);
      setStatus('ready');
      hasLoadedOnce.current = true;
    } catch (error) {
      // Đã có dữ liệu thì giữ nguyên trên màn hình, chỉ báo lỗi.
      if (hasLoadedOnce.current) {
        Alert.alert('Không tải được danh sách', getApiErrorMessage(error));
      } else {
        setLoadError(getApiErrorMessage(error));
        setStatus('error');
      }
    }
  }, []);

  // Tải lại mỗi lần mở tab, vì dòng có thể được thêm từ màn chi tiết công thức (UC-26).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const replaceItem = (updated: ShoppingItem) =>
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));

  // UC-27 — đổi trên giao diện trước, lỗi thì trả lại như cũ.
  const handleToggle = async (item: ShoppingItem) => {
    const nextChecked = !item.checked;
    replaceItem({ ...item, checked: nextChecked });
    try {
      replaceItem(await updateShoppingItem(item.id, { checked: nextChecked }));
    } catch (error) {
      if (isNotFound(error)) {
        // 2a: dòng đã bị xoá ở thiết bị khác -> làm mới danh sách.
        await load();
        return;
      }
      replaceItem(item);
      Alert.alert('Không cập nhật được', getApiErrorMessage(error));
    }
  };

  // UC-29 — xoá ngay trên giao diện; DELETE luôn trả 204 nên 2a không báo lỗi.
  const handleDelete = async (item: ShoppingItem) => {
    if (expandedId === item.id) setExpandedId(null);
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    try {
      await deleteShoppingItem(item.id);
    } catch (error) {
      setItems((prev) => [...prev, item]);
      Alert.alert('Không xoá được', getApiErrorMessage(error));
    }
  };

  // UC-28
  const handleSaveNote = async (item: ShoppingItem, note: string) => {
    try {
      replaceItem(await updateShoppingItem(item.id, { note: note.trim() || null }));
      setExpandedId(null);
      return null;
    } catch (error) {
      if (isNotFound(error)) {
        setExpandedId(null);
        Alert.alert('Không tìm thấy', 'Dòng này đã bị xoá. Danh sách sẽ được làm mới.');
        await load();
        return null;
      }
      return getApiErrorMessage(error);
    }
  };

  // UC-25
  const handleAdd = async (name: string, quantity: string) => {
    try {
      const created = await createShoppingItem({ name, quantity: quantity || undefined });
      setItems((prev) => [created, ...prev]);
      setShowAddForm(false);
      return null;
    } catch (error) {
      return getApiErrorMessage(error);
    }
  };

  const grouped = useMemo(() => groupShoppingItems(items), [items]);
  const pendingCount = items.length - grouped.bought.length;

  const renderRow = (
    item: ShoppingItem,
    groupLabel: string,
    caption: string | null,
    captionTone: 'muted' | 'accent' = 'muted',
  ) => (
    <View key={item.id}>
      <ShoppingItemRow
        item={item}
        caption={caption}
        captionTone={captionTone}
        onToggle={() => handleToggle(item)}
        onOpen={() => setExpandedId((id) => (id === item.id ? null : item.id))}
        onDelete={() => handleDelete(item)}
      />
      {expandedId === item.id ? (
        <NoteEditor
          item={item}
          groupLabel={groupLabel}
          onSave={(note) => handleSaveNote(item, note)}
          onDelete={() => handleDelete(item)}
          onCancel={() => setExpandedId(null)}
        />
      ) : null}
    </View>
  );

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScreenTitle title="Đi chợ thôi!" />
        <View style={styles.center}>
          <ActivityIndicator color={appColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScreenTitle title="Đi chợ thôi!" />
        <View style={[styles.center, styles.errorBox]}>
          <Text style={styles.errorText}>{loadError}</Text>
          <ActionButton
            title="Thử lại"
            variant="secondary"
            onPress={() => {
              setStatus('loading');
              load();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = items.length === 0;
  const subtitle =
    grouped.bought.length > 0
      ? `${pendingCount} nguyên liệu cần mua · ${grouped.bought.length} đã mua`
      : `${pendingCount} nguyên liệu cần mua`;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={appColors.primary}
            colors={[appColors.primary]}
          />
        }
      >
        <ScreenTitle title="Đi chợ thôi!" subtitle={subtitle} />

        <View style={styles.content}>
          {isEmpty && !showAddForm ? (
            <ShoppingEmptyState onAddPress={() => setShowAddForm(true)} />
          ) : (
            <>
              {/* Khu vực "Của tôi" — luôn ở trên cùng */}
              <View style={styles.group}>
                <SectionTitle
                  title={`Của tôi · ${grouped.mine.length}`}
                  right={
                    <Pressable
                      onPress={() => setShowAddForm((open) => !open)}
                      hitSlop={8}
                      style={styles.addButton}
                      accessibilityRole="button"
                      accessibilityLabel="Thêm nguyên liệu vào Của tôi"
                      accessibilityState={{ expanded: showAddForm }}
                    >
                      <Icon icon={icons.plusGreen} />
                    </Pressable>
                  }
                />
                {showAddForm ? (
                  <AddItemForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
                ) : null}
                {grouped.mine.length === 0 && !showAddForm ? (
                  <Text style={styles.emptyGroup}>
                    Bấm “+” để thêm nguyên liệu không thuộc công thức nào.
                  </Text>
                ) : null}
                {grouped.mine.map((item) => renderRow(item, 'Của tôi', item.note))}
              </View>

              {/* Mỗi công thức một khu vực */}
              {grouped.recipes.map((group) => (
                <View key={group.key} style={styles.group}>
                  <RecipeGroupHeader
                    title={group.title}
                    caption={`${group.pending.length} cần mua / ${group.total} nguyên liệu`}
                  />
                  {group.pending.map((item) => renderRow(item, group.title, item.note))}
                </View>
              ))}

              {/* "Đã mua" ở cuối màn hình */}
              {grouped.bought.length > 0 ? (
                <View style={styles.group}>
                  <SectionTitle
                    title={`Đã mua · ${grouped.bought.length}`}
                    right={
                      <Pressable
                        onPress={() => setBoughtCollapsed((c) => !c)}
                        hitSlop={8}
                        accessibilityRole="button"
                      >
                        <Text style={styles.link}>
                          {boughtCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        </Text>
                      </Pressable>
                    }
                  />
                  {boughtCollapsed ? null : (
                    <>
                      {grouped.bought.map((item) =>
                        item.sourceRecipeId
                          ? renderRow(
                              item,
                              item.recipeTitleSnapshot ?? 'Công thức',
                              `Từ ${item.recipeTitleSnapshot ?? 'công thức'}`,
                              'accent',
                            )
                          : renderRow(item, 'Của tôi', item.note),
                      )}
                      <Text style={styles.footnote}>
                        Bỏ đánh dấu để đưa nguyên liệu về đúng nhóm ban đầu.
                      </Text>
                    </>
                  )}
                </View>
              ) : null}

              {!isEmpty ? (
                <NoticeBox
                  icon={icons.listChecks}
                  message="Các dòng trùng tên được giữ riêng theo nhóm. Không tự gộp nguyên liệu hay cộng dồn số lượng."
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  scrollContent: { paddingBottom: 28 },
  content: { paddingHorizontal: SCREEN_PADDING, gap: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBox: { paddingHorizontal: SCREEN_PADDING, gap: 16 },
  errorText: {
    fontFamily: appFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: appColors.textMuted,
    textAlign: 'center',
  },
  group: { gap: 5 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGroup: {
    paddingVertical: 8,
    fontFamily: appFonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: appColors.textMuted,
  },
  link: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.primary },
  footnote: {
    paddingTop: 3,
    fontFamily: appFonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: appColors.textMuted,
  },
});
