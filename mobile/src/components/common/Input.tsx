import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { icons, type IconAsset } from '@/constants/assets';
import { Icon } from './Icon';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null; 
  invalid?: boolean; 
  hint?: string; 
  icon?: IconAsset; 
  isPassword?: boolean; 
};

export function Input({ label, error, invalid, hint, icon, isPassword, ...inputProps }: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hasError = Boolean(error) || Boolean(invalid);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.box, hasError ? styles.boxError : null]}>
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword ? !passwordVisible : inputProps.secureTextEntry}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Icon icon={passwordVisible ? icons.eye : icons.eyeOff} />
          </Pressable>
        ) : icon ? (
          <Icon icon={icon} />
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: colors.textDark },
  box: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxError: { borderColor: colors.error },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
  },
  error: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.error },
  hint: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textMuted },
});
