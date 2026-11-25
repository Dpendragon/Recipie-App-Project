import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { extraColors } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';

type Props = {
  visible: boolean;
  // Đang gọi DELETE: khoá hai nút, không cho đóng giữa chừng.
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Hộp xác nhận xoá đánh giá (frame 2020:1028): lớp phủ đen 40%, hộp trắng giữa màn hình.
export function DeleteReviewDialog({ visible, deleting, onCancel, onConfirm }: Props) {
  const cancel = () => {
    if (!deleting) onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        {/* Chạm ra ngoài hộp thoại để đóng. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityLabel="Đóng" />
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>Xóa đánh giá của bạn?</Text>
          <Text style={styles.message}>
            Đánh giá và nhận xét sẽ bị xóa. Bạn có thể viết lại một đánh giá mới sau đó.
          </Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <ActionButton title="Hủy" variant="secondary" onPress={cancel} disabled={deleting} />
            </View>
            <View style={styles.action}>
              <ActionButton
                title={deleting ? 'Đang xóa…' : 'Xóa đánh giá'}
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
    gap: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontFamily: fonts.semiBold, fontSize: 19, lineHeight: 28.5, color: colors.textDark },
  message: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19.5, color: colors.textMid },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
