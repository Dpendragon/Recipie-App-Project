import { StyleSheet, Text, View } from 'react-native';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import { Icon } from '@/components/common/Icon';

export function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Icon icon={icons.sprout} />
      <Text style={[styles.name, { fontSize: size }]}>Recipe App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.bold, color: colors.primary },
});
