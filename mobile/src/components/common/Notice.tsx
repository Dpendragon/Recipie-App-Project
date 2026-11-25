import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { extraColors } from '@/constants/layout';
import { Icon } from './Icon';

type Props = {
  title?: string; 
  message?: string | null; 
  variant?: 'error' | 'success' | 'warning';
  icon?: IconAsset;
};

// Khung thông báo: dùng cho lỗi đăng nhập, "Đã gửi mã xác thực", "Đăng ký thành công"...
// 'warning' là banner "Bạn đang ngoại tuyến" của màn Yêu thích (nền vàng nhạt).
export function Notice({ title, message, variant = 'error', icon }: Props) {
  if (!title && !message) return null;

  const isError = variant === 'error';
  const isWarning = variant === 'warning';
  const textColor = isError ? colors.error : isWarning ? extraColors.warningText : colors.primary;
  const messageColor = isError || isWarning ? textColor : colors.textMid;
  const backgroundColor = isError
    ? colors.errorBg
    : isWarning
      ? extraColors.warningBg
      : colors.softGreen;

  return (
    <View style={[styles.box, { backgroundColor }]}>
      {icon ? <Icon icon={icon} style={styles.icon} /> : null}
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: textColor }]}>{title}</Text> : null}
        {message ? (
          <Text style={[styles.message, { color: messageColor }]}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radius.input,
  },
  icon: { marginTop: 1 },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 17 },
  message: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
});
