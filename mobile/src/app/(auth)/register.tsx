import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { DividerWithLabel } from '@/components/auth/DividerWithLabel';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Input } from '@/components/common/Input';
import { icons } from '@/constants/assets';
import { colors, fonts, shadows } from '@/constants/theme';
import { register } from '@/services/api/authApi';
import { getApiErrorMessage, showComingSoon } from '@/utils/helpers';
import { validateEmail, validateName, validatePassword } from '@/utils/validators';

export default function RegisterScreen() {
  const router = useRouter();

  // state của các ô nhập và checkbox, cùng lỗi tương ứng (nếu có)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false); 
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null); 
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Kiểm tra dữ liệu ngay trên app
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const termsErr = agreed ? null : 'Vui lòng đồng ý với Điều khoản và Chính sách bảo mật';
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setTermsError(termsErr);
    setFormError(null);
    if (nameErr || emailErr || passwordErr || termsErr) return;

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
        params: { registered: '1', email: email.trim() },
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      // 409 = email đã có người dùng
      if (isAxiosError(error) && error.response?.status === 409) {
        setEmailError(message);
      } else {
        setFormError(message);
      }
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* KeyboardAvoidingView: đẩy form lên khi bàn phím hiện ra */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHeader />

          <View style={styles.main}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Tạo tài khoản mới</Text>
              <Text style={styles.subtitle}>
                {'Tham gia cộng đồng để khám phá hàng ngàn\ncông thức theo nguyên liệu của bạn.'}
              </Text>
            </View>

            <View style={styles.card}>
              <Input
                label="Họ và tên"
                icon={icons.user}
                value={name}
                onChangeText={setName}
                error={nameError}
                placeholder="Nhập họ và tên của bạn"
                autoComplete="name"
              />
              <Input
                label="Email"
                icon={icons.mailSignUp}
                value={email}
                onChangeText={setEmail}
                error={emailError}
                placeholder="vidu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              <Input
                label="Mật khẩu"
                icon={icons.lockSignUp}
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                placeholder="Ít nhất 8 ký tự"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                passwordToggle={{ hiddenIcon: icons.eyeOff, shownIcon: icons.eye }}
              />

              <View style={styles.termsRow}>
                <View style={styles.termsCheckbox}>
                  <Checkbox shape="round" checked={agreed} onToggle={() => setAgreed((v) => !v)} />
                </View>
                <Text style={styles.termsText}>
                  {'Tôi đồng ý với '}
                  <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
                  {' và '}
                  <Text style={styles.termsLink}>Chính sách bảo mật</Text>
                </Text>
              </View>
              {termsError ? <Text style={styles.termsError}>{termsError}</Text> : null}

              <ErrorMessage message={formError} />

              <Button
                title="Đăng ký"
                rightIcon={icons.arrowRightSignUp}
                shadow={shadows.soft}
                loading={submitting}
                onPress={handleSubmit}
              />

              <DividerWithLabel label="HOẶC ĐĂNG KÝ VỚI" variant="signUp" />
              <SocialButtons
                variant="signUp"
                onPressGoogle={() => showComingSoon('Đăng ký bằng Google')}
                onPressApple={() => showComingSoon('Đăng ký bằng Apple')}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản?</Text>
            {/* replace (thay vì push) để không chất đống màn hình khi qua lại giữa Đăng ký/Đăng nhập */}
            <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
              <Text style={styles.footerLink}>Đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 16 },
  main: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },

  titleBlock: { alignItems: 'center', gap: 5, marginBottom: 24 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.26,
    color: colors.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22.75,
    color: colors.textMid,
    textAlign: 'center',
  },

  card: {
    gap: 16,
    padding: 25,
    borderRadius: 32,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(222,192,183,0.3)',
    boxShadow: shadows.soft,
  },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 2, paddingBottom: 8 },
  termsCheckbox: { paddingTop: 2 },
  termsText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textMid,
  },
  termsLink: { fontFamily: fonts.medium, color: colors.brand },
  termsError: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.error, marginTop: -8 },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 4, paddingVertical: 16 },
  footerText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textMid },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 22, color: colors.brand },
});
