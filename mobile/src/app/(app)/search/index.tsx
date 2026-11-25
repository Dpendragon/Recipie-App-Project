import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/common/Icon';
import { Notice } from '@/components/common/Notice';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton';
import { FilterSheet } from '@/components/search/FilterSheet';
import { SearchCriteriaBar } from '@/components/search/SearchCriteriaBar';
import { icons } from '@/constants/assets';
import { hasActiveFilters } from '@/constants/searchFilters';
import { colors, fonts, radius } from '@/constants/theme';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import { useSearch } from '@/hooks/useSearch';
import { showComingSoon } from '@/utils/helpers';

// Màn tìm kiếm gộp: tìm theo tên món và/hoặc nguyên liệu, kèm bộ lọc, trong cùng một màn hình.
export default function SearchScreen() {
  const router = useRouter();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { name, ingredients, filters, resetFilters } = useSearch();
  const [submittedName, setSubmittedName] = useState(name.trim());
  const { recipes, meta, status, error, loadingMore, loadMore, retry } = useRecipeSearch({
    name: submittedName,
    ingredients,
    filters,
  });

  const [filterOpen, setFilterOpen] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  const goIngredients = () => router.navigate('/search/ingredients');

  // Số món theo nguồn, đếm trên toàn bộ danh sách đã tải
  const spoonacularCount = recipes.filter((r) => r.source === 'SPOONACULAR').length;
  const localCount = recipes.length - spoonacularCount;

  // Nội dung hiện khi danh sách rỗng: tuỳ trạng thái tìm kiếm
  const emptyContent =
    status === 'idle' ? (
      <EmptyState
        icon={icons.searchLarge}
        title="Bạn muốn nấu món gì?"
        message="Nhập tên món rồi bấm nút Tìm trên bàn phím, hoặc chọn nguyên liệu đang có."
        primaryAction={{ label: 'Chọn nguyên liệu', onPress: goIngredients }}
      />
    ) : status === 'loading' ? (
      <View style={styles.skeletons}>
        <RecipeCardSkeleton variant="compact" />
        <RecipeCardSkeleton variant="compact" />
        <RecipeCardSkeleton variant="compact" />
      </View>
    ) : status === 'error' ? (
      <View style={styles.errorBox}>
        <Notice message={error} />
        <Button title="Thử lại" variant="soft" onPress={retry} />
      </View>
    ) : (
      <EmptyState
        icon={icons.basket}
        title="Chưa tìm thấy món phù hợp"
        message="Thử đổi từ khoá, bỏ bớt nguyên liệu hoặc nới lỏng bộ lọc để xem thêm món."
        primaryAction={{ label: 'Thay đổi nguyên liệu', onPress: goIngredients }}
        secondaryAction={hasActiveFilters(filters) ? { label: 'Xóa bộ lọc', onPress: resetFilters } : undefined}
      />
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AuthScreenHeader
          title="Tìm món ngon"
          subtitle="Gõ tên món hoặc chọn nguyên liệu bạn đang có."
          onBack={goBack}
        />
      </View>

      <FlatList
        // Chỉ đưa danh sách vào khi tìm xong; các trạng thái khác dùng ListEmptyComponent
        data={status === 'success' ? recipes : []}
        keyExtractor={(recipe) => `${recipe.source}:${recipe.id}`}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            variant="compact"
            onPress={() => showComingSoon('Xem chi tiết công thức')}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SearchCriteriaBar
              onPressAddIngredient={goIngredients}
              onPressFilter={() => setFilterOpen(true)}
              onSubmitName={(value) => setSubmittedName(value.trim())}
              autoFocus={focus === '1'}
            />
            {status === 'success' && recipes.length > 0 ? (
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryText}>
                    <Text style={styles.summaryTitle}>{`${recipes.length}${meta?.hasMore ? '+' : ''} món phù hợp`}</Text>
                    <Text style={styles.summarySub}>
                      {ingredients.length > 0 ? 'Sắp theo số nguyên liệu khớp' : 'Sắp theo độ phù hợp'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setFilterOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Bộ lọc"
                    style={styles.filterButton}
                  >
                    <Icon icon={icons.filterGreen} />
                    <Text style={styles.filterButtonText}>Bộ lọc</Text>
                  </Pressable>
                </View>
                {spoonacularCount > 0 ? (
                  <Text style={styles.sources}>
                    {`${localCount} món từ cộng đồng, bổ sung ${spoonacularCount} món từ Spoonacular để bạn có thêm lựa chọn.`}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={emptyContent}
        ListFooterComponent={
          status === 'success' && recipes.length > 0 ? (
            loadingMore ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : error ? (
              <Text style={[styles.footer, styles.footerError]}>
                Không tải thêm được. Kéo xuống cuối danh sách để thử lại.
              </Text>
            ) : null
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
      />

      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} />
    </SafeAreaView>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 22 },
  listContent: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 32 },
  listHeader: { gap: 18, marginBottom: 14 },
  separator: { height: 12 },
  skeletons: { gap: 12 },
  errorBox: { gap: 12 },

  summary: { gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  summaryText: { flex: 1 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 26, color: colors.textDark },
  summarySub: { marginTop: 2, fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16, color: colors.textMuted },
  filterButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.softGreen,
  },
  filterButtonText: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: colors.primary },
  sources: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMuted },

  footer: { paddingVertical: 18, textAlign: 'center' },
  footerError: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.error },
});
