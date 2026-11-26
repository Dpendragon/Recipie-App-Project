import { StyleSheet, Text, View } from 'react-native';
import { extraColors } from '@/constants/layout';
import { colors, fonts } from '@/constants/theme';
import type { Review } from '@/types/review.types';
import { formatReviewDate, formatStars } from './format';

type Props = {
  review: Review;
  // 'mine': thẻ viền xanh trong mục "Đánh giá của bạn".
  // 'other': một dòng trong "Từ những căn bếp khác".
  variant?: 'mine' | 'other';
};

// Tên lấy từ author.name; server đã thay tên rỗng/tài khoản đã xoá bằng "Người dùng".
export function ReviewItem({ review, variant = 'other' }: Props) {
  const comment = review.comment?.trim();
  const date = formatReviewDate(review.updatedAt);

  if (variant === 'mine') {
    return (
      <View style={styles.mineCard}>
        <View style={styles.mineTopRow}>
          <Text style={styles.mineName}>{`${review.author.name} · Bạn`}</Text>
          <Text style={styles.mineDate}>{date}</Text>
        </View>
        <Text style={styles.mineStars} accessibilityLabel={`${review.rating} trên 5 sao`}>
          {formatStars(review.rating)}
        </Text>
        {comment ? <Text style={styles.mineComment}>{comment}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.other}>
      <Text
        style={styles.otherHeading}
        accessibilityLabel={`${review.author.name}, ${review.rating} trên 5 sao`}
      >
        {`${review.author.name} · ${formatStars(review.rating)}`}
      </Text>
      {comment ? <Text style={styles.otherComment}>{comment}</Text> : null}
      <Text style={styles.otherDate}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mineCard: {
    gap: 9,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  mineTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mineName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.textDark,
  },
  mineDate: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMid },
  mineStars: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 27, color: extraColors.star },
  mineComment: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textDark },

  other: { gap: 6 },
  otherHeading: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 18, color: colors.textDark },
  otherComment: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMid },
  otherDate: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, color: colors.textMid },
});
