import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  title: string;
  actionLabel?: string; 
  onPressAction?: () => void;
};

// Dòng tiêu đề một khối trên Trang chủ
export function SectionHeader({ title, actionLabel, onPressAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onPressAction ? (
        <Pressable onPress={onPressAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.textDark },
  action: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.primary },
});
