import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { icons } from '@/constants/assets';
import { appColors, appFonts, appRadius } from '@/constants/theme';

type TitleProps = {
  title: string;
  // Nút / liên kết bên phải tiêu đề (nút + ở "Của tôi", "Thu gọn" ở "Đã mua").
  right?: ReactNode;
};

// Tiêu đề khu vực "Của tôi · 2", "Đã mua · 2".
export function SectionTitle({ title, right }: TitleProps) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

type RecipeProps = {
  title: string;
  caption: string;
};

// Đầu khu vực theo công thức. Bảng shopping_items không lưu ảnh công thức
// nên ô ảnh dùng icon minh hoạ thay cho ảnh món.
export function RecipeGroupHeader({ title, caption }: RecipeProps) {
  return (
    <View style={styles.recipeRow}>
      <View style={styles.thumb}>
        <Icon icon={icons.salad} />
      </View>
      <View style={styles.recipeTexts}>
        <Text style={styles.recipeTitle} accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.recipeCaption}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontFamily: appFonts.semiBold, fontSize: 18, color: appColors.textDark },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: appRadius.cardLarge,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTexts: { flex: 1, gap: 3 },
  recipeTitle: { fontFamily: appFonts.semiBold, fontSize: 17, lineHeight: 25, color: appColors.textDark },
  recipeCaption: { fontFamily: appFonts.regular, fontSize: 10, lineHeight: 15, color: appColors.textMuted },
});
