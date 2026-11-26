import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { icons, type IconAsset } from '@/constants/assets';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/api/authApi';
import type { User } from '@/types/auth.types';

type MenuItem = {
  title: string;
  subtitle: string;
  icon: IconAsset;
  href: Href;
};

// Lối vào các màn của riêng người dùng: công thức đã đăng, đăng món mới, đánh giá đã viết.
const MENU: MenuItem[] = [
  {
    title: 'Công thức của tôi',
    subtitle: 'Xem, sửa hoặc xoá món bạn đã đăng',
    icon: icons.notebookPen,
    href: '/recipe/my-recipes',
  },
  {
    title: 'Đăng công thức mới',
    subtitle: 'Chia sẻ món tủ của nhà bạn',
    icon: icons.formPlus,
    href: '/recipe/create',
  },
  {
    title: 'Đánh giá của tôi',
    subtitle: 'Những món bạn đã chấm sao',
    icon: icons.starFilled,
    href: '/my-reviews',
  },
];

export default function AccountScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  // Tên và email chỉ để hiển thị: lỗi hay mất mạng thì để trống, các nút vẫn dùng được.
  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const confirmSignOut = () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất khỏi Recipe App?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const displayName = user?.name?.trim() || 'Bạn';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AuthScreenHeader
          title="Tài khoản"
          subtitle="Quản lý công thức và đánh giá của bạn."
          onBack={goBack}
        />

        <View style={styles.profile}>
          <View style={styles.avatar}>
            {user ? <Text style={styles.initial}>{initial}</Text> : <Icon icon={icons.user} />}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {user ? (
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.menu}>
          {MENU.map((item, index) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [
                styles.row,
                index > 0 ? styles.rowDivider : null,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={styles.rowIcon}>
                <Icon icon={item.icon} style={styles.rowIconImage} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <Icon icon={icons.chevronRight} style={styles.chevron} />
            </Pressable>
          ))}
        </View>

        <View style={styles.signOut}>
          <ActionButton title="Đăng xuất" variant="danger" onPress={confirmSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32 },

  profile: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: radius.card,
    backgroundColor: colors.softGreen,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  initial: { fontFamily: fonts.bold, fontSize: 22, color: colors.primary },
  profileText: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.textDark },
  email: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMid },

  menu: {
    marginTop: 20,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowPressed: { backgroundColor: colors.background },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
  },
  rowIconImage: { width: 19, height: 19 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textDark },
  rowSubtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  chevron: { width: 18, height: 18 },

  signOut: { marginTop: 28 },
});
