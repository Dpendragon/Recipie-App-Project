import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { Button } from './Button';
import { Icon } from './Icon';

type Action = { label: string; onPress: () => void };

type Props = {
  icon: IconAsset; 
  title: string;
  message?: string;
  primaryAction?: Action; 
  secondaryAction?: Action;
};

// Màn "không có gì để hiển thị": chưa tìm thấy món, danh sách trống...
export function EmptyState({ icon, title, message, primaryAction, secondaryAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Icon icon={icon} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {primaryAction || secondaryAction ? (
        <View style={styles.actions}>
          {primaryAction ? <Button title={primaryAction.label} onPress={primaryAction.onPress} /> : null}
          {secondaryAction ? (
            <Button title={secondaryAction.label} variant="soft" onPress={secondaryAction.onPress} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 8, paddingTop: 56 },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
    marginBottom: 22,
  },
  title: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 28, textAlign: 'center', color: colors.textDark },
  message: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMid,
  },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 24 },
});
