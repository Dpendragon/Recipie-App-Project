import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { colors, fonts } from '@/constants/theme';
import { useIngredientAutocomplete } from '@/hooks/useIngredientAutocomplete';
import type { SelectedIngredient } from '@/types/ingredient.types';

type Props = {
  query: string; 
  selectedNames?: string[];
  onSelect: (ingredient: SelectedIngredient) => void;
};

// Danh sách gợi ý thả xuống dưới ô tìm nguyên liệu
export function IngredientSuggestionList({ query, selectedNames = [], onSelect }: Props) {
  const { suggestions, loading } = useIngredientAutocomplete(query);

  // Chưa gõ gì thì không hiện khung
  if (!query.trim()) return null;

  const visible = suggestions.filter((s) => !selectedNames.includes(s.nameEn));

  return (
    <View style={styles.box}>
      {visible.map((ingredient) => (
        <Pressable
          key={ingredient.id}
          onPress={() => onSelect({ nameVi: ingredient.nameVi, nameEn: ingredient.nameEn })}
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${ingredient.nameVi}`}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          <Text style={styles.name}>{ingredient.nameVi}</Text>
          <Icon icon={icons.plus} />
        </Pressable>
      ))}

      {visible.length === 0 ? (
        <Text style={styles.status}>{loading ? 'Đang tìm...' : 'Không tìm thấy nguyên liệu phù hợp'}</Text>
      ) : (
        <Text style={styles.footnote}>Gợi ý từ danh mục nguyên liệu tiếng Việt</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  pressed: { opacity: 0.6 },
  name: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.textDark },
  status: { paddingVertical: 14, fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  footnote: { paddingTop: 4, paddingBottom: 10, fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
});
