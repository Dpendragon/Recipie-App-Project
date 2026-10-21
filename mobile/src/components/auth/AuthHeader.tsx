import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from '@/constants/assets';
import { colors, fonts, radius, shadows } from '@/constants/theme';
import { Icon } from '@/components/common/Icon';

export function AuthHeader() {
  const router = useRouter();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        style={styles.backButton}
      >
        <Icon icon={icons.back} />
      </Pressable>

      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <Icon icon={icons.logoHeader} />
        </View>
        <Text style={styles.brandName}>Recipe Finder</Text>
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.soft,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoBox: { width: 24, height: 24, justifyContent: 'center' },
  brandName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.55,
    color: colors.brand,
  },
  spacer: { width: 44, height: 44 },
});
