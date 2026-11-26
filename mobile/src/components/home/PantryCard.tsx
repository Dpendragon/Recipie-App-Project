import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/common/Button';
import { Chip } from '@/components/common/Chip';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { colors, fonts, radius } from '@/constants/theme';
import type { SelectedIngredient } from '@/types/ingredient.types';

const MAX_CHIPS = 3;

type Props = {
  ingredients: SelectedIngredient[]; 
  onPress: () => void; 
};

// Thẻ "Bếp bạn đang có gì?" trên Trang chủ.
export function PantryCard({ ingredients, onPress }: Props) {
  const shown = ingredients.slice(0, MAX_CHIPS);
  const hidden = ingredients.length - shown.length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Bếp bạn đang có gì?</Text>
        <Icon icon={icons.leaf} />
      </View>
      <Text style={styles.description}>
        Chọn nguyên liệu sẵn có. Recipe App sẽ tìm món phù hợp, ưu tiên công thức cộng đồng.
      </Text>

      {shown.length > 0 ? (
        <View style={styles.chips}>
          {shown.map((ingredient) => (
            <Chip key={ingredient.nameEn} label={ingredient.nameVi} variant="selected" />
          ))}
          {hidden > 0 ? <Chip label={`+${hidden}`} variant="default" /> : null}
        </View>
      ) : null}

      <View style={styles.button}>
        <Button title="Tìm món từ nguyên liệu" leftIcon={icons.searchWhite} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: radius.hero, backgroundColor: colors.softGreen },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 26, color: colors.textDark },
  description: { marginTop: 10, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textMid },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  button: { marginTop: 16 },
});
