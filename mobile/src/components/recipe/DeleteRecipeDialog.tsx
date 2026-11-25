import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { extraColors } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';

type Props = {
  visible: boolean;
  // Tên món hiện trong câu hỏi xác nhận; null khi chưa chọn thẻ nào.
  title: string | null;
  // Đang gọi DELETE: khoá hai nút, không cho đóng giữa chừng.
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Hộp xác nhận xoá công thức đã đăng (UC-20, frame 2020:1035): lớp phủ đen 40%,
// hộp trắng giữa màn hình, nút "Giữ lại" và "Xóa công thức".
export function DeleteRecipeDialog({ visible, title, deleting, onCancel, onConfirm }: Props) {
  const cancel = () => {
    if (!deleting) onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        {/* Chạm ra ngoài hộp thoại để đóng. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityLabel="Đóng" />
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>Xóa “{title ?? 'công thức này'}”?</Text>
          <Text style={styles.message}>
            Công thức sẽ không còn trong cộng đồng. Ảnh và tên đã lưu ở kế hoạch, mua sắm vẫn được
            giữ lại.
          </Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <ActionButton
                title="Giữ lại"
                variant="secondary"
                onPress={cancel}
                disabled={deleting}
              />
            </View>
            <View style={styles.action}>
              <ActionButton
                title={deleting ? 'Đang xóa…' : 'Xóa công thức'}
                variant="danger"
                onPress={onConfirm}
                disabled={deleting}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: extraColors.overlay,
  },
  dialog: {
    gap: 13,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 25.5, color: colors.textDark },
  message: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMid },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
