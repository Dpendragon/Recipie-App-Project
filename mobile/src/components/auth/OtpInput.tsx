import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  hasError?: boolean;
};

export function OtpInput({ value, onChange, length = 6, hasError = false }: Props) {
  const [focused, setFocused] = useState(false);

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index];
          const isActive = focused && index === activeIndex && !hasError;
          return (
            <View
              key={index}
              style={[
                styles.box,
                isActive ? styles.boxActive : null,
                hasError ? styles.boxError : null,
              ]}
            >
              <Text style={[styles.digit, hasError ? styles.digitError : null]}>{digit ?? ''}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden // ẩn con trỏ nhấp nháy
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.overlayInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 54 },
  row: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    height: 54,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxActive: { borderWidth: 1.5, borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  digit: { fontFamily: fonts.bold, fontSize: 24, color: colors.textDark },
  digitError: { color: colors.error },
  overlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'rgba(0,0,0,0.01)',
    backgroundColor: 'transparent',
  },
});
