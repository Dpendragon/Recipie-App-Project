import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { icons, images } from '@/constants/assets';
import { colors, fonts, radius } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const heroHeight = Math.min(420, Math.max(340, screenHeight * 0.475));
  const overlayTop = Math.max(24, insets.top + 8);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: heroHeight }}>
          <Image source={images.welcomeHero} style={StyleSheet.absoluteFill} contentFit="cover" />

          <LinearGradient
            pointerEvents="none"
            colors={['rgba(248,246,239,0)', 'rgba(248,246,239,0.45)', colors.background]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.badge, { top: overlayTop }]}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Bếp nhà thơm lừng</Text>
          </View>

          <View style={[styles.roundButton, { top: overlayTop }]}>
            <Icon icon={icons.utensils} />
          </View>
        </View>

        <View style={[styles.content, { paddingBottom: Math.max(28, insets.bottom + 16) }]}>
          <View style={styles.brandBlock}>
            <View style={styles.emblem}>
              <Icon icon={icons.sprout} />
            </View>
            <Text style={styles.title}>Recipe App</Text>
            <Text style={styles.tagline}>{'Tìm món ngon từ nguyên liệu có sẵn\ntrong bếp'}</Text>

            <View style={styles.pills}>
              <FeaturePill emoji="🥑" text="Tận dụng nguyên liệu sẵn có" />
              <FeaturePill emoji="⏱️" text="Nấu nhanh mỗi ngày" />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Đăng ký"
              leftIcon={icons.arrowRight}
              onPress={() => router.push('/register')}
            />
            <Button title="Đăng nhập" variant="outline" onPress={() => router.push('/login')} />
            <Text style={styles.footnote}>
              Bắt đầu hành trình ẩm thực tinh tế chỉ trong 30 giây
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function FeaturePill({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },

  badge: {
    position: 'absolute',
    left: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 15, color: colors.textMid },
  roundButton: {
    position: 'absolute',
    right: 22,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: colors.border,
  },

  content: {
    flexGrow: 1,
    marginTop: -28,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  brandBlock: { alignItems: 'center' },
  emblem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.textMid,
  },
  pills: { marginTop: 22, gap: 10, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillEmoji: { fontSize: 14, lineHeight: 20 },
  pillText: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: colors.textDark },

  actions: { paddingTop: 30, gap: 12 },
  footnote: {
    paddingTop: 4,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
