import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { BrandLogo } from '@/components/auth/BrandLogo';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Input } from '@/components/common/Input';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { Notice } from '@/components/common/Notice';
import { icons } from '@/constants/assets';
import { colors, fonts, radius } from '@/constants/theme';
import { register } from '@/services/api/authApi';
import { getApiErrorMessage } from '@/utils/helpers';
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '@/utils/validators';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  }

  async function handleSubmit() {
    // Kiểm tra dữ liệu ngay trên app
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirm);
    const termsErr = agreed ? null : 'Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật';
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmError(confirmErr);
    setTermsError(termsErr);
    setFormError(null);
    if (nameErr || emailErr || passwordErr || confirmErr || termsErr) return;

    // Gọi API đăng ký
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });

      router.replace({
        pathname: '/login',
        params: { notice: 'registered', email: email.trim() },
      });
    } catch (error) {
      // 409 = email đã có người dùng
      if (isAxiosError(error) && error.response?.status === 409) {
        setEmailError('Email này đã được đăng ký');
      } else {
        setFormError(getApiErrorMessage(error));
      }
      setSubmitting(false);
    }
  }

  return (
    <KeyboardScreen contentContainerStyle={styles.scroll}>
      <AuthScreenHeader
        title="Tạo tài khoản"
        subtitle="Một căn bếp gọn hơn. Một bữa ăn ngon hơn."
        onBack={handleBack}
      />

      <View style={styles.banner}>
        <BrandLogo />
        <Text style={styles.bannerText}>{'Cùng nhau nấu ngon,\nđừng để nguyên liệu thừa.'}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Họ và tên"
          icon={icons.user}
          value={name}
          onChangeText={setName}
          error={nameError}
          placeholder="Nguyễn Thùy Linh"
          autoComplete="name"
        />
        <Input
          label="Email"
          icon={icons.mail}
          value={email}
          onChangeText={setEmail}
          error={emailError}
          placeholder="ten@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
        <Input
          label="Mật khẩu"
          isPassword
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          hint="Ít nhất 8 ký tự, gồm chữ và số."
          placeholder="Nhập mật khẩu"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
        />
        <Input
          label="Nhập lại mật khẩu"
          isPassword
          value={confirm}
          onChangeText={setConfirm}
          error={confirmError}
          placeholder="Nhập lại mật khẩu"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
        />

        <View style={styles.termsRow}>
          <Checkbox checked={agreed} onToggle={() => setAgreed((v) => !v)} />
          <Text style={styles.termsText}>
            Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Recipe App.
          </Text>
        </View>
        {termsError ? <Text style={styles.termsError}>{termsError}</Text> : null}

        <Notice message={formError} />

        <Button
          title="Tạo tài khoản"
          leftIcon={icons.arrowRight}
          loading={submitting}
          onPress={handleSubmit}
        />
      </View>

      <Pressable style={styles.footer} onPress={() => router.replace('/login')} hitSlop={8}>
        <Text style={styles.footerText}>Đã có tài khoản? Đăng nhập</Text>
      </Pressable>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24 },

  banner: {
    gap: 14,
    marginTop: 18,
    marginBottom: 22,
    padding: 22,
    borderRadius: radius.hero,
    backgroundColor: colors.softGreen,
  },
  bannerText: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.textDark },

  form: { gap: 14 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  termsText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textMid,
  },
  termsError: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.error },

  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: colors.primary },
});
