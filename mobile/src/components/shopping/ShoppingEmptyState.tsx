import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/common/ActionButton';
import { Icon } from '@/components/common/Icon';
import { NoticeBox } from '@/components/common/NoticeBox';
import { icons } from '@/constants/assets';
import { appColors, appFonts } from '@/constants/theme';

type Props = {
  onAddPress: () => void;
};

// Trạng thái "Mua sắm – Rỗng" trong Figma.
export function ShoppingEmptyState({ onAddPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Icon icon={icons.basketEmpty} />
        </View>
        <Text style={styles.title}>Danh sách đang trống</Text>
        <Text style={styles.message}>
          Thêm những nguyên liệu bạn muốn mua để không bỏ sót món nào khi đi chợ.
        </Text>
        <ActionButton title="Thêm nguyên liệu riêng" onPress={onAddPress} />
      </View>
      <NoticeBox
        icon={icons.sprout}
        title="Lên danh sách từ công thức"
        message="Mở một công thức và chọn “Thêm tất cả nguyên liệu vào giỏ” để chuẩn bị cho bữa ngon."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 22 },
  hero: { alignItems: 'center', gap: 20, paddingTop: 64, paddingBottom: 28 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: appColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: appFonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    color: appColors.textDark,
    textAlign: 'center',
  },
  message: {
    fontFamily: appFonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: appColors.textMuted,
    textAlign: 'center',
  },
});
