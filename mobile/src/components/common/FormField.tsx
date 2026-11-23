import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { appColors, appFonts, appRadius } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  // Chữ nhỏ bên phải nhãn, vd "Tối đa 500 ký tự".
  hint?: string;
  error?: string | null;
  // Dòng chú thích dưới ô nhập (vd bộ đếm ký tự).
  helper?: string | null;
};

// "Trường nhập" của bộ thiết kế tông xanh: nhãn + ô trắng viền mảnh bo 10.
export const FormField = forwardRef<TextInput, Props>(function FormField(
  { label, hint, error, helper, multiline, ...inputProps },
  ref,
) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <TextInput
        ref={ref}
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={appColors.textMuted}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          error ? styles.inputError : null,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {helper ? (
        <Text style={[styles.helper, error ? styles.helperError : null]}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 7, alignSelf: 'stretch' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: appFonts.semiBold, fontSize: 12, color: appColors.textDark },
  hint: { fontFamily: appFonts.regular, fontSize: 10, color: appColors.textMuted },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: appRadius.input,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    fontFamily: appFonts.regular,
    fontSize: 14,
    color: appColors.textDark,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: appColors.danger },
  error: { fontFamily: appFonts.regular, fontSize: 11, lineHeight: 16, color: appColors.danger },
  helper: { fontFamily: appFonts.regular, fontSize: 11, color: appColors.textMuted },
  helperError: { color: appColors.danger },
});
