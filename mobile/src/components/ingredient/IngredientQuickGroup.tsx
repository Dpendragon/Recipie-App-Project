import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/common/Chip';
import { colors, fonts } from '@/constants/theme';
import type { SelectedIngredient } from '@/types/ingredient.types';

type Props = {
  title: string; 
  items: SelectedIngredient[];
  selectedNames: string[];
  onToggle: (ingredient: SelectedIngredient) => void;
};

// Một nhóm chip chọn nhanh
export function IngredientQuickGroup({ title, items, selectedNames, onToggle }: Props) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chips}>
        {items.map((item) => (
          <Chip
            key={item.nameEn}
            label={item.nameVi}
            variant={selectedNames.includes(item.nameEn) ? 'selected' : 'default'}
            onPress={() => onToggle(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 12, fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, color: colors.textDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
