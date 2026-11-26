import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors, appFonts } from '@/constants/theme';
import type { ShoppingItem } from '@/types/shopping.types';

const DELETE_WIDTH = 80;

type Props = {
  item: ShoppingItem;
  // Dòng chữ nhỏ dưới tên: ghi chú, hoặc "Từ <công thức>" ở khu vực Đã mua.
  caption?: string | null;
  captionTone?: 'muted' | 'accent';
  onToggle: () => void;
  // Bấm vào dòng hoặc nút ⋮ để mở phần sửa ghi chú.
  onOpen: () => void;
  // Vuốt trái rồi bấm thùng rác để xoá.
  onDelete: () => void;
};

export function ShoppingItemRow({
  item,
  caption,
  captionTone = 'muted',
  onToggle,
  onOpen,
  onDelete,
}: Props) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const renderDeleteAction = () => (
    <Pressable
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Xoá ${item.name}`}
      style={styles.deleteAction}
    >
      <Icon icon={icons.trash} />
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={DELETE_WIDTH / 2}
      overshootRight={false}
      renderRightActions={renderDeleteAction}
    >
      <View style={styles.row}>
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.checked }}
          accessibilityLabel={item.checked ? `Bỏ đánh dấu ${item.name}` : `Đánh dấu đã mua ${item.name}`}
        >
          <Icon icon={item.checked ? icons.circleCheck : icons.circle} />
        </Pressable>

        <Pressable
          onPress={onOpen}
          style={styles.body}
          accessibilityRole="button"
          accessibilityHint="Mở để sửa ghi chú"
        >
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, item.checked ? styles.nameChecked : null]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.quantity ? <Text style={styles.quantity}>{item.quantity}</Text> : null}
          </View>
          {caption ? (
            <Text
              style={[styles.caption, captionTone === 'accent' ? styles.captionAccent : null]}
              numberOfLines={2}
            >
              {caption}
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          onPress={onOpen}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Tuỳ chọn cho ${item.name}`}
        >
          <Icon icon={icons.ellipsisVertical} />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
    backgroundColor: appColors.background,
  },
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flexShrink: 1, fontFamily: appFonts.regular, fontSize: 14, color: appColors.textDark },
  nameChecked: { color: appColors.textMuted, textDecorationLine: 'line-through' },
  quantity: { fontFamily: appFonts.regular, fontSize: 12, color: appColors.textMuted },
  caption: { fontFamily: appFonts.regular, fontSize: 10, lineHeight: 15, color: appColors.textMuted },
  captionAccent: { color: appColors.primary },
  deleteAction: {
    width: DELETE_WIDTH,
    backgroundColor: appColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
