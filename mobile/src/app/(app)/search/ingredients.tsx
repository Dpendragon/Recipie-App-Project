import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { SearchBar } from '@/components/common/SearchBar';
import { IngredientQuickGroup } from '@/components/ingredient/IngredientQuickGroup';
import { IngredientSuggestionList } from '@/components/ingredient/IngredientSuggestionList';
import { icons } from '@/constants/assets';
import { QUICK_INGREDIENT_GROUPS } from '@/constants/quickIngredients';
import { colors, fonts } from '@/constants/theme';
import { useSearch } from '@/hooks/useSearch';

// Màn "Bếp bạn đang có gì?": chọn nguyên liệu bằng ô tìm kiếm có gợi ý hoặc các chip chọn nhanh.
export default function IngredientsScreen() {
  const router = useRouter();
  const { ingredients, addIngredient, removeIngredient, toggleIngredient, clearIngredients } = useSearch();
  const [query, setQuery] = useState(''); 

  const selectedNames = ingredients.map((i) => i.nameEn);
  const count = ingredients.length;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function search() {
    if (count > 0) router.navigate('/search');
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.scroll}>
      <AuthScreenHeader
        title="Bếp bạn đang có gì?"
        subtitle="Chọn nguyên liệu, tìm món vừa vặn với căn bếp."
        onBack={goBack}
      />

      {/* Ô tìm nguyên liệu + danh sách gợi ý thả xuống */}
      <View style={styles.searchBlock}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          placeholder="Tìm nguyên liệu tiếng Việt..."
        />
        <IngredientSuggestionList
          query={query}
          selectedNames={selectedNames}
          onSelect={(ingredient) => {
            addIngredient(ingredient);
            setQuery('');
          }}
        />
      </View>

      {/* Nguyên liệu đã chọn */}
      <View style={styles.selectedHeader}>
        <Text style={styles.selectedTitle}>{`Đã chọn · ${count}`}</Text>
        {count > 0 ? (
          <Pressable onPress={clearIngredients} hitSlop={8} accessibilityRole="button">
            <Text style={styles.clearAll}>Xóa tất cả</Text>
          </Pressable>
        ) : null}
      </View>
      {count > 0 ? (
        <>
          <View style={styles.chips}>
            {ingredients.map((ingredient) => (
              <Chip
                key={ingredient.nameEn}
                label={ingredient.nameVi}
                variant="selected"
                showClose
                onPress={() => removeIngredient(ingredient.nameEn)}
              />
            ))}
          </View>
          <Text style={styles.hint}>Cần ít nhất 1 nguyên liệu để tìm món. Chạm × để bỏ chọn.</Text>
        </>
      ) : (
        <View style={styles.emptyHint}>
          <Text style={styles.hint}>Chưa chọn nguyên liệu nào. Chạm vào nguyên liệu bên dưới để bắt đầu.</Text>
          <Text style={styles.required}>Vui lòng chọn ít nhất 1 nguyên liệu</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Các nhóm chọn nhanh */}
      <View style={styles.groups}>
        {QUICK_INGREDIENT_GROUPS.map((group) => (
          <IngredientQuickGroup
            key={group.title}
            title={group.title}
            items={group.items}
            selectedNames={selectedNames}
            onToggle={toggleIngredient}
          />
        ))}
      </View>

      <View style={styles.submit}>
        <Button
          title={count > 0 ? `Tìm món với ${count} nguyên liệu` : 'Tìm công thức'}
          leftIcon={icons.arrowRight}
          disabled={count === 0}
          onPress={search}
        />
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 28 },

  searchBlock: { gap: 8, marginTop: 18 },

  selectedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  selectedTitle: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.textDark },
  clearAll: { fontFamily: fonts.semiBold, fontSize: 12.5, lineHeight: 16, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  emptyHint: { gap: 10, marginTop: 10 },
  hint: { marginTop: 10, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  required: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.error },

  divider: { height: 1, marginVertical: 22, backgroundColor: colors.border },
  groups: { gap: 24 },
  submit: { marginTop: 28 },
});
