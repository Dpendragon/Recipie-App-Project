import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appColors, appFonts, SCREEN_PADDING } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  // Phần tử bên trái tiêu đề, vd nút quay lại.
  left?: ReactNode;
};

// "Tiêu đề màn hình" trong Figma: tiêu đề 24 đậm + dòng mô tả 13.
export function ScreenTitle({ title, subtitle, left }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {left}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 9,
    paddingBottom: 20,
    paddingHorizontal: SCREEN_PADDING,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    flex: 1,
    fontFamily: appFonts.bold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: appColors.textDark,
  },
  subtitle: {
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: appColors.textMuted,
  },
});
