import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { icons, images } from '@/constants/assets';
import { colors, fonts, radius, shadows } from '@/constants/theme';

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
        {/* ----- Nửa trên: ảnh bìa ----- */}
        <View style={{ height: heroHeight }}>
          <Image
            source={images.welcomeHero}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,248,245,0)', 'rgba(255,248,245,0.4)', colors.background]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Huy hiệu "Bếp nhà thơm lừng" ở góc trên bên trái */}
          <View style={[styles.badge, { top: overlayTop }]}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Bếp nhà thơm lừng</Text>
          </View>

          {/* Nút tròn ở góc trên bên phải */}
          <View style={[styles.roundButton, { top: overlayTop }]}>
            <Icon icon={icons.utensils} />
          </View>
        </View>

        {/* ----- Nửa dưới: nội dung */}
        <View style={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
          {/* Khối thương hiệu */}
          <View style={styles.brandBlock}>
            <View style={styles.emblem}>
              <Icon icon={icons.logoEmblem} />
            </View>
            <Text style={styles.title}>Recipe Finder</Text>
            <Text style={styles.tagline}>{'Tìm món ngon từ nguyên liệu có sẵn\ntrong bếp'}</Text>

            <View style={styles.pills}>
              <FeaturePill emoji="🥑" text="Tận dụng nguyên liệu sẵn có" />
              <FeaturePill emoji="⏱️" text="Nấu nhanh mỗi ngày" />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Đăng ký"
              rightIcon={icons.arrowRightWelcome}
              shadow={shadows.ctaWelcome}
              letterSpacing={0.35}
              onPress={() => router.push('/register')}
            />
            <Button
              title="Đăng nhập"
              variant="outline"
              letterSpacing={0.35}
              onPress={() => router.push('/login')}
            />
            <Text style={styles.footnote}>
              Bắt đầu hành trình ẩm thực tinh tế chỉ trong 30 giây
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Một "viên thuốc" tính năng: emoji + dòng chữ.
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
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(222,192,183,0.3)',
  },
  badgeDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.green },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.25,
    color: colors.textMid,
  },
  roundButton: {
    position: 'absolute',
    right: 24,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(222,192,183,0.3)',
  },

  content: {
    flexGrow: 1,
    marginTop: -32,
    paddingTop: 8,
    paddingHorizontal: 24,
    justifyContent: 'space-between', 
  },
  brandBlock: { alignItems: 'center' },
  emblem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputFill,
    borderWidth: 1,
    borderColor: 'rgba(222,192,183,0.4)',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: colors.brand,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22.75,
    textAlign: 'center',
    color: colors.textMid,
  },
  pills: { marginTop: 24, gap: 10, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(222,192,183,0.3)',
    boxShadow: shadows.pill,
  },
  pillEmoji: { fontSize: 14, lineHeight: 20, color: colors.textDark },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
    color: colors.textDark,
  },

  actions: { paddingTop: 32, gap: 12 },
  footnote: {
    paddingTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
