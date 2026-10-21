import { Pressable, StyleSheet, Text, View } from 'react-native';
import { icons } from '@/constants/assets';
import { colors, fonts, radius, shadows } from '@/constants/theme';
import { Icon } from '@/components/common/Icon';

type Props = {
  variant: 'signUp' | 'signIn';
  onPressGoogle: () => void;
  onPressApple: () => void;
};

export function SocialButtons({ variant, onPressGoogle, onPressApple }: Props) {
  const isSignUp = variant === 'signUp';
  const buttonStyle = [
    styles.button,
    isSignUp
      ? { height: 44, gap: 8, borderColor: 'rgba(222,192,183,0.4)' }
      : {
          height: 48,
          gap: 10,
          borderColor: 'rgba(138,114,106,0.2)',
          boxShadow: shadows.soft,
        },
  ];

  return (
    <View style={styles.row}>
      <Pressable onPress={onPressGoogle} accessibilityRole="button" style={buttonStyle}>
        <Icon icon={isSignUp ? icons.googleSignUp : icons.googleSignIn} />
        <Text style={styles.text}>Google</Text>
      </Pressable>
      <Pressable onPress={onPressApple} accessibilityRole="button" style={buttonStyle}>
        <Icon icon={isSignUp ? icons.appleSignUp : icons.appleSignIn} />
        <Text style={styles.text}>Apple</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
    color: colors.textDark,
  },
});
