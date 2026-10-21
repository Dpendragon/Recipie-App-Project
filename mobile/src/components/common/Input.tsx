import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import type { IconAsset } from '@/constants/assets';
import { Icon } from './Icon';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  icon: IconAsset;
  variant?: 'pill' | 'square';
  error?: string | null;
  passwordToggle?: { hiddenIcon: IconAsset; shownIcon: IconAsset };
};

const VARIANTS = {
  pill: {
    labelSize: 12,
    labelLineHeight: 16,
    labelSpacing: 0.24,
    gap: 4,
    radius: radius.pill,
    fill: colors.inputFill,
    border: 'rgba(222,192,183,0.5)',
    paddingLeft: 41,
    iconLeft: 14,
    rightIconRight: 12,
    paddingRightWithToggle: 45,
  },
  square: {
    labelSize: 14,
    labelLineHeight: 20,
    labelSpacing: 0.14,
    gap: 6,
    radius: 0,
    fill: colors.inputFillSoft,
    border: 'rgba(138,114,106,0.2)',
    paddingLeft: 49,
    iconLeft: 16,
    rightIconRight: 14,
    paddingRightWithToggle: 49,
  },
} as const;

export function Input({
  label,
  icon,
  variant = 'pill',
  error,
  passwordToggle,
  ...inputProps
}: Props) {
  const v = VARIANTS[variant];
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={{ gap: v.gap }}>
      <Text
        style={[
          styles.label,
          { fontSize: v.labelSize, lineHeight: v.labelLineHeight, letterSpacing: v.labelSpacing },
        ]}
      >
        {label}
      </Text>

      {/* Khung chứa: icon được đặt "nổi" (absolute) lên trên ô nhập, nằm bên trái. */}
      <View>
        <TextInput
          {...inputProps}
          secureTextEntry={passwordToggle ? !passwordVisible : inputProps.secureTextEntry}
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            {
              backgroundColor: v.fill,
              borderColor: error ? colors.error : v.border,
              borderRadius: v.radius,
              paddingLeft: v.paddingLeft,
              paddingRight: passwordToggle ? v.paddingRightWithToggle : 17,
            },
          ]}
        />

        {/* pointerEvents="none": icon chỉ để trang trí, chạm xuyên qua xuống ô nhập. */}
        <View
          pointerEvents="none"
          style={[styles.iconLeft, { left: v.iconLeft }]}
        >
          <Icon icon={icon} />
        </View>

        {passwordToggle ? (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            style={[styles.iconRight, { right: v.rightIconRight }]}
          >
            <Icon
              icon={passwordVisible ? passwordToggle.shownIcon : passwordToggle.hiddenIcon}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.semiBold, color: colors.textDark },
  input: {
    height: 48,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    paddingVertical: 0, 
  },
  iconLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  iconRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
  },
});
