import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  message?: string | null;
  variant?: 'error' | 'success';
};

export function ErrorMessage({ message, variant = 'error' }: Props) {
  if (!message) return null;
  const isError = variant === 'error';
  return (
    <View style={[styles.box, isError ? styles.errorBox : styles.successBox]}>
      <Text style={[styles.text, { color: isError ? colors.error : colors.green }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  errorBox: { backgroundColor: colors.errorBg },
  successBox: { backgroundColor: colors.successBg },
  text: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
});
