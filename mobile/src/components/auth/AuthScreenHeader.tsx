import { Pressable, StyleSheet, Text, View } from 'react-native';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import { Icon } from '@/components/common/Icon';

type Props = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export function AuthScreenHeader({ title, subtitle, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Quay lại">
          <Icon icon={icons.arrowLeft} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.textDark },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textMid },
});
