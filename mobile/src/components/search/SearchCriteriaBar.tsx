import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/common/Chip';
import { SearchBar } from '@/components/common/SearchBar';
import { getActiveFilterChips, hasActiveFilters } from '@/constants/searchFilters';
import { colors, fonts } from '@/constants/theme';
import { useSearch } from '@/hooks/useSearch';

type Props = {
  onPressAddIngredient: () => void; 
  onPressFilter: () => void; 
  onSubmitName?: (name: string) => void;
  autoFocus?: boolean;
};

// Phần đầu màn kết quả: ô tìm tên món, hàng chip nguyên liệu và hàng chip bộ lọc đang bật.
export function SearchCriteriaBar({ onPressAddIngredient, onPressFilter, onSubmitName, autoFocus }: Props) {
  const { name, setName, ingredients, removeIngredient, filters, removeFilter, resetFilters } = useSearch();
  const filterChips = getActiveFilterChips(filters);

  return (
    <View style={styles.container}>
      <SearchBar
        value={name}
        onChangeText={setName}
        onSubmit={() => onSubmitName?.(name)}
        onClear={() => {
          setName('');
          onSubmitName?.('');
        }}
        onPressFilter={onPressFilter}
        filterActive={hasActiveFilters(filters)}
        autoFocus={autoFocus}
      />

      {/* Nguyên liệu đã chọn: chạm để bỏ. Nút "+ Nguyên liệu" luôn hiện ở cuối. */}
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
        <Chip label="Nguyên liệu" variant="add" onPress={onPressAddIngredient} />
      </View>

      {/* Bộ lọc đang bật: chạm để bỏ từng cái, hoặc "Xóa tất cả" */}
      {filterChips.length > 0 ? (
        <View style={styles.chips}>
          {filterChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              variant="selected"
              showClose
              onPress={() => removeFilter(chip.key)}
            />
          ))}
          <Pressable onPress={resetFilters} hitSlop={8} accessibilityRole="button">
            <Text style={styles.clearAll}>Xóa tất cả</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  clearAll: { fontFamily: fonts.semiBold, fontSize: 12.5, lineHeight: 16, color: colors.primary },
});
