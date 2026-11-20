import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  current: 1 | 2 | 3;
};

const LABELS = ['Email', 'Mã OTP', 'Mật khẩu mới'];

// Thanh 3 bước của màn Quên mật khẩu
export function StepIndicator({ current }: Props) {
  return (
    <View style={styles.row}>
      {LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const reached = stepNumber <= current;
        const done = stepNumber < current;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.bar, reached ? styles.barOn : null]} />
            <Text style={[styles.label, reached ? styles.labelOn : null]}>
              {done ? `✓ ${label}` : label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, gap: 6 },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.border },
  barOn: { backgroundColor: colors.primary },
  label: { fontFamily: fonts.semiBold, fontSize: 10, lineHeight: 14, color: colors.textMuted },
  labelOn: { color: colors.primary },
});
