import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconAsset } from '@/constants/assets';
import { fontSize } from '@/constants/layout';
import { colors, fonts, radius } from '@/constants/theme';
import { ActionButton } from './ActionButton';
import { Icon } from './Icon';

type Props = {
  icon: IconAsset;
  title: string;
  message: string;
  actionTitle: string;
  onAction: () => void;
  // Liên kết "Quay lại" dưới nút (màn chi tiết công thức).
  onBack?: () => void;
  // Dòng chú thích cuối khung (màn Yêu thích rỗng).
  footnote?: string;
  style?: StyleProp<ViewStyle>;
};

// Khung trạng thái trống/ngoại lệ: vòng tròn xanh nhạt chứa icon, tiêu đề, mô tả,
// nút chính. Dùng cho UC-08 (2003:9313, 2003:9341) và UC-10 rỗng (2003:8968).
export function EmptyState({
  icon,
  title,
  message,
  actionTitle,
  onAction,
  onBack,
  footnote,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Icon icon={icon} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.action}>
        <ActionButton title={actionTitle} onPress={onAction} />
      </View>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
          <Text style={styles.back}>Quay lại</Text>
        </Pressable>
      ) : null}
      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    lineHeight: 30,
    textAlign: 'center',
    color: colors.textDark,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textMid,
  },
  action: { width: '100%' },
  back: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.primary,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textMid,
  },
});
