import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appColors, appFonts, SCREEN_PADDING } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string | null;
  onChange: () => void;
  onRemove: () => void;
  onClose: () => void;
};

// "Overlay · Menu món kế hoạch": Đổi món (UC-23) / Xoá khỏi kế hoạch (UC-24) / Huỷ.
export function MealActionMenu({ visible, title, onChange, onRemove, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Đóng menu"
      >
        <View style={[styles.menu, { marginBottom: insets.bottom + 40 }]}>
          {title ? (
            <Text style={styles.menuTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          <Pressable onPress={onChange} style={styles.item} accessibilityRole="button">
            <Text style={styles.changeText}>Đổi món</Text>
          </Pressable>
          <Pressable onPress={onRemove} style={styles.item} accessibilityRole="button">
            <Text style={styles.removeText}>Xoá khỏi kế hoạch</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.item} accessibilityRole="button">
            <Text style={styles.cancelText}>Huỷ</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SCREEN_PADDING,
    backgroundColor: appColors.overlay,
  },
  menu: {
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 9, color: 'rgba(0,0,0,0.12)' }],
  },
  menuTitle: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    fontFamily: appFonts.regular,
    fontSize: 11,
    color: appColors.textMuted,
  },
  item: { height: 44, justifyContent: 'center', paddingHorizontal: 12 },
  changeText: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.primary },
  removeText: { fontFamily: appFonts.regular, fontSize: 12, color: appColors.danger },
  cancelText: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.textMuted },
});
