import { StyleSheet, Text, View } from 'react-native';
import { appColors, appFonts, appRadius } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { Icon } from './Icon';

type Props = {
  icon: IconAsset;
  title?: string;
  message: string;
  variant?: 'info' | 'warning';
};

// "Thông báo ngữ cảnh" trong Figma: hộp nền nhạt, icon bên trái.
export function NoticeBox({ icon, title, message, variant = 'info' }: Props) {
  const isWarning = variant === 'warning';
  const textColor = isWarning ? appColors.warningText : appColors.primary;
  return (
    <View style={[styles.box, { backgroundColor: isWarning ? appColors.warningBg : appColors.primarySoft }]}>
      <Icon icon={icon} />
      <View style={styles.texts}>
        {title ? <Text style={[styles.title, { color: textColor }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: appRadius.input,
    alignSelf: 'stretch',
  },
  texts: { flex: 1, gap: 3 },
  title: { fontFamily: appFonts.semiBold, fontSize: 12, lineHeight: 18 },
  message: { fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18 },
});
