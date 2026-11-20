import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { BrandLogo } from './BrandLogo';

export function SessionCheckScreen() {
  return (
    <View style={styles.container}>
      <BrandLogo size={26} />
      <Text style={styles.tagline}>Nấu từ những gì mình có.</Text>

      <View style={styles.track}>
        <View style={styles.fill} />
      </View>

      <Text style={styles.title}>Đang kiểm tra phiên đăng nhập...</Text>
      <Text style={styles.subtitle}>Vui lòng chờ trong giây lát để xác thực tài khoản của bạn.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  tagline: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMid },
  track: {
    width: 84,
    height: 4,
    marginVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  fill: { width: 30, height: 4, borderRadius: radius.pill, backgroundColor: colors.primary },
  title: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textDark },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textMid,
  },
});
