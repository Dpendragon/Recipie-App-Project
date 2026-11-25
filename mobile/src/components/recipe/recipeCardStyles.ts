import { StyleSheet } from 'react-native';
import { colors, radius } from '@/constants/theme';

// Kích thước và khung chung của thẻ món
export const cardStyles = StyleSheet.create({
  card: {
    padding: 10,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardCarousel: { width: 168, padding: 8, borderRadius: 20 },
  imageLarge: { height: 176, borderRadius: 16 },
  imageCompact: { width: 92, height: 92, borderRadius: 16 },
  imageCarousel: { height: 112, borderRadius: 14 },
});
