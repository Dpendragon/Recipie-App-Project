import { StyleSheet, Text, View } from 'react-native';
import { icons } from '@/constants/assets';
import { colors, fonts, radius } from '@/constants/theme';
import type { ToastState } from '@/hooks/useToast';
import { Icon } from './Icon';

type Props = {
  toast: ToastState | null;
};

// Toast theo thiết kế: nền xanh đậm, chữ trắng, dấu tick, nổi phía dưới
// màn hình. Biến thể 'error' (hoàn tác khi lưu/bỏ lưu lỗi) không có trong Figma:
// dùng nền màu lỗi của theme và bỏ dấu tick để không gây hiểu nhầm là thành công.
// Đặt làm phần tử cuối của màn hình để nằm trên nội dung.
export function Toast({ toast }: Props) {
  if (!toast) return null;

  const isError = toast.variant === 'error';

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View
        key={toast.id}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.toast, isError ? styles.toastError : null]}
      >
        {isError ? null : <Icon icon={icons.toastCheck} />}
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 24,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    padding: 14,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  toastError: { backgroundColor: colors.error },
  text: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 13, color: colors.white },
});
