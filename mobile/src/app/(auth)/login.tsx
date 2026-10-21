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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { DividerWithLabel } from '@/components/auth/DividerWithLabel';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Icon } from '@/components/common/Icon';
import { Input } from '@/components/common/Input';
import { icons } from '@/constants/assets';
import { colors, fonts, radius, shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { login } from '@/services/api/authApi';
import { getApiErrorMessage, showComingSoon } from '@/utils/helpers';
import { validateEmail } from '@/utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const { registered, email: emailParam } = useLocalSearchParams<{
    registered?: string;
    email?: string;
  }>();

  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Kiểm tra trước khi gọi server.
    const emailErr = validateEmail(email);
    const passwordErr = password ? null : 'Vui lòng nhập mật khẩu';
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setFormError(null);
    if (emailErr || passwordErr) return;

    setSubmitting(true);
    try {
      const { accessToken } = await login({ email: email.trim(), password });
      // signIn lưu token rồi đổi trạng thái sang "signedIn"
      await signIn(accessToken, remember);
    } catch (error) {
      // 401 -> "Email hoặc mật khẩu không đúng"; mất mạng -> "Không thể kết nối tới máy chủ...".
      setFormError(getApiErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHeader />

          <View style={styles.main}>
            <View style={styles.greeting}>
              {/* Huy hiệu nhỏ "BẾP NHÀ THÂN QUEN" */}
              <View style={styles.badge}>
                <Icon icon={icons.badgePot} />
                <Text style={styles.badgeText}>BẾP NHÀ THÂN QUEN</Text>
              </View>
              <Text style={styles.title}>Chào mừng trở lại!</Text>
              <Text style={styles.subtitle}>
                {'Đăng nhập để tiếp tục biến nguyên liệu có sẵn thành\nbữa ăn hấp dẫn.'}
              </Text>
            </View>

            {registered === '1' ? (
              <View style={styles.notice}>
                <ErrorMessage
                  variant="success"
                  message="Đăng ký thành công. Vui lòng đăng nhập."
                />
              </View>
            ) : null}

            <View style={styles.card}>
              <Input
                variant="square"
                label="Email"
                icon={icons.mailSignIn}
                value={email}
                onChangeText={setEmail}
                error={emailError}
                placeholder="Nhập địa chỉ email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              <Input
                variant="square"
                label="Mật khẩu"
                icon={icons.lockSignIn}
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                placeholder="Nhập mật khẩu của bạn"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                passwordToggle={{ hiddenIcon: icons.eye, shownIcon: icons.eyeOff }}
              />

              {/* Hàng phụ: "Ghi nhớ đăng nhập" bên trái, "Quên mật khẩu?" bên phải */}
              <View style={styles.auxRow}>
                <Pressable style={styles.rememberRow} onPress={() => setRemember((v) => !v)}>
                  <Checkbox shape="square" checked={remember} onToggle={() => setRemember((v) => !v)} />
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </Pressable>
                <Pressable onPress={() => showComingSoon('Chức năng quên mật khẩu')} hitSlop={8}>
                  <Text style={styles.forgot}>Quên mật khẩu?</Text>
                </Pressable>
              </View>

              <ErrorMessage message={formError} />

              <Button
                title="Đăng nhập"
                rightIcon={icons.arrowRightSignIn}
                shadow={shadows.ctaSignIn}
                loading={submitting}
                onPress={handleSubmit}
              />

              <DividerWithLabel label="Hoặc tiếp tục với" variant="signIn" />
              <SocialButtons
                variant="signIn"
                onPressGoogle={() => showComingSoon('Đăng nhập bằng Google')}
                onPressApple={() => showComingSoon('Đăng nhập bằng Apple')}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản?</Text>
            <Pressable onPress={() => router.replace('/register')} hitSlop={8}>
              <Text style={styles.footerLink}>Đăng ký</Text>
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

  greeting: { gap: 5.4, marginBottom: 24 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.inputFill,
    borderWidth: 1,
    borderColor: 'rgba(222,192,183,0.3)',
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.25,
    color: colors.brand,
  },
  title: {
    paddingTop: 2.6,
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.65,
    color: colors.textDark,
  },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22.75, color: colors.textMid },

  notice: { marginBottom: 16 },

  card: {
    gap: 16,
    padding: 25,
    borderRadius: 48,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(138,114,106,0.1)',
    boxShadow: shadows.soft,
  },

  auxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 8,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMid },
  forgot: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
    color: colors.primary,
  },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 8 },
  footerText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textMid },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, letterSpacing: 0.14, color: colors.primary },
});
