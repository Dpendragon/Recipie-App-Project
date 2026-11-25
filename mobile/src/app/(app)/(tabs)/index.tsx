import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/auth/BrandLogo';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { Notice } from '@/components/common/Notice';
import { SearchBar } from '@/components/common/SearchBar';
import { PantryCard } from '@/components/home/PantryCard';
import { SectionHeader } from '@/components/home/SectionHeader';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { useSearch } from '@/hooks/useSearch';
import { showComingSoon } from '@/utils/helpers';

// Trang chủ (tab Khám phá): ô tìm tên món, thẻ "Bếp bạn đang có gì?" và "Món nổi tiếng".
export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { ingredients } = useSearch(); 
  const { popular, status, error, reload } = useHomeFeed();

  // TẠM THỜI: bấm vào hình tròn góc phải để đăng xuất
  function confirmSignOut() {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất khỏi Recipe App?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hàng trên cùng: logo + nút tài khoản */}
        <View style={styles.topRow}>
          <BrandLogo size={22} />
          <Pressable
            onPress={confirmSignOut}
            accessibilityRole="button"
            accessibilityLabel="Tài khoản, đăng xuất"
            style={styles.avatar}
          >
            <Icon icon={icons.user} />
          </Pressable>
        </View>

        <Text style={styles.hello}>HÔM NAY MÌNH NẤU GÌ?</Text>
        <Text style={styles.headline}>{'Từ bếp nhà,\nđến bữa ngon.'}</Text>

        {/* Ô tìm tên món: chỉ là nút, bấm vào để sang màn tìm kiếm (và mở sẵn bàn phím) */}
        <View style={styles.block}>
          <SearchBar
            placeholder="Tìm tên món ăn..."
            onPress={() => router.push({ pathname: '/search', params: { focus: '1' } })}
            onPressFilter={() => router.push({ pathname: '/search', params: { focus: '1' } })}
          />
        </View>

        <View style={styles.block}>
          <PantryCard ingredients={ingredients} onPress={() => router.push('/search/ingredients')} />
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeader title="Món nổi tiếng" />

          {status === 'loading' ? (
            <HorizontalList>
              <RecipeCardSkeleton variant="carousel" />
              <RecipeCardSkeleton variant="carousel" />
              <RecipeCardSkeleton variant="carousel" />
            </HorizontalList>
          ) : status === 'error' ? (
            <View style={styles.errorBox}>
              <Notice message={error} />
              <Button title="Thử lại" variant="soft" onPress={reload} />
            </View>
          ) : popular.length === 0 ? (
            <Text style={styles.empty}>Chưa có công thức nào để hiển thị.</Text>
          ) : (
            <HorizontalList>
              {popular.map((recipe) => (
                <RecipeCard
                  key={`${recipe.source}:${recipe.id}`}
                  recipe={recipe}
                  variant="carousel"
                  onPress={() => showComingSoon('Xem chi tiết công thức')}
                />
              ))}
            </HorizontalList>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Hàng thẻ cuộn ngang
function HorizontalList({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontal}
      contentContainerStyle={styles.horizontalContent}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 22, paddingBottom: 32 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
  },
  hello: {
    marginTop: 22,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.textMid,
  },
  headline: { marginTop: 8, fontFamily: fonts.bold, fontSize: 31, lineHeight: 36, letterSpacing: -0.7, color: colors.textDark },

  block: { marginTop: 20 },
  sectionBlock: { marginTop: 28, gap: 14 },
  horizontal: { marginHorizontal: -22 },
  horizontalContent: { paddingHorizontal: 22, gap: 12 },
  errorBox: { gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textMuted },
});
