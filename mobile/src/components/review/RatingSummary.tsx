import { StyleSheet, Text, View } from 'react-native';
import { extraColors } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';
import { formatAverage, formatStars } from './format';

type Props = {
  average: number;
  count: number;
};

// Khối "Điểm trung bình": số điểm lớn, hàng sao, "N đánh giá".
// Thiết kế đã bỏ 5 thanh phân bố sao nên không dựng phần đó.
export function RatingSummary({ average, count }: Props) {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Điểm trung bình ${formatAverage(average)} trên 5, ${count} đánh giá`}
    >
      <Text style={styles.average}>{formatAverage(average)}</Text>
      <Text style={styles.stars}>{formatStars(average)}</Text>
      <Text style={styles.count}>{`${count} đánh giá`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, minWidth: 100 },
  average: { fontFamily: fonts.bold, fontSize: 42, lineHeight: 63, color: colors.textDark },
  stars: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: extraColors.star },
  count: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.textMid },
});
