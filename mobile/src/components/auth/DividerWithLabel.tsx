import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  label: string;
  variant: 'signUp' | 'signIn';
};

export function DividerWithLabel({ label, variant }: Props) {
  const isSignUp = variant === 'signUp';
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.line,
          { borderColor: isSignUp ? 'rgba(222,192,183,0.4)' : 'rgba(138,114,106,0.15)' },
        ]}
      />
      <View style={styles.labelBox}>
        <Text style={isSignUp ? styles.labelSignUp : styles.labelSignIn}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 20, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1 },
  labelBox: { backgroundColor: colors.white, paddingHorizontal: 12 },
  labelSignUp: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.25,
    color: colors.textMuted,
  },
  labelSignIn: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
