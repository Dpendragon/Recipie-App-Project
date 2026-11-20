import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandLogo } from '@/components/auth/BrandLogo';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { Icon } from '@/components/common/Icon';
import { Input } from '@/components/common/Input';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { Notice } from '@/components/common/Notice';
import { icons, images } from '@/constants/assets';
import { colors, fonts, radius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { login } from '@/services/api/authApi';
import { getApiErrorMessage } from '@/utils/helpers';
import { validateEmail } from '@/utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, sessionExpired } = useAuth();
  const { notice, email: emailParam } = useLocalSearchParams<{ notice?: string; email?: string }>();

  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [wrongLogin, setWrongLogin] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Kiểm tra trước khi gọi server
    const emailErr = validateEmail(email);
    const passwordErr = password ? null : 'Vui lòng nhập mật khẩu';
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setWrongLogin(false);
    setOtherError(null);
    if (emailErr || passwordErr) return;

    // Gọi API đăng nhập.
    setSubmitting(true);
    try {
      const { accessToken } = await login({ email: email.trim(), password });
      await signIn(accessToken, remember);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setWrongLogin(true);
      } else {
        setOtherError(getApiErrorMessage(error));
      }
      setSubmitting(false);
    }
  }

  const noticeMessage =
    notice === 'registered'
      ? 'Đăng ký thành công. Vui lòng đăng nhập.'
      : notice === 'reset'
        ? 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.'
        : null;

  return (
    <KeyboardScreen contentContainerStyle={styles.scroll}>
      <View style={styles.logoRow}>
        <BrandLogo />
      </View>

      <View>
        <Image source={images.loginHero} style={styles.hero} contentFit="cover" />
        {sessionExpired ? (
          <View style={styles.sessionBanner}>
            <Icon icon={icons.info} />
            <Text style={styles.sessionText}>Phiên đăng nhập đã hết hạn</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{'Bếp có gì,\nnấu ngon từ đó.'}</Text>
        <Text style={styles.subtitle}>
          {sessionExpired
            ? 'Vui lòng đăng nhập lại để tiếp tục với công thức, kế hoạch và danh sách mua sắm của bạn.'
            : 'Đăng nhập để tìm món từ nguyên liệu sẵn có và bớt lãng phí mỗi ngày.'}
        </Text>
      </View>

      <View style={styles.form}>
        <Notice variant="success" message={noticeMessage} />

        <Input
          label="Email"
          icon={icons.mail}
          value={email}
          onChangeText={setEmail}
          error={emailError}
          invalid={wrongLogin}
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
          invalid={wrongLogin}
          placeholder="Nhập mật khẩu của bạn"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
        />

        <View style={styles.optionsRow}>
          <Pressable style={styles.rememberRow} onPress={() => setRemember((v) => !v)}>
            <Checkbox checked={remember} onToggle={() => setRemember((v) => !v)} />
            <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
            <Text style={styles.forgot}>Quên mật khẩu?</Text>
          </Pressable>
        </View>

        {wrongLogin ? (
          <Notice
            title="Email hoặc mật khẩu không đúng"
            message="Vui lòng kiểm tra lại thông tin đăng nhập và thử lại."
          />
        ) : null}
        <Notice message={otherError} />

        <Button
          title="Đăng nhập"
          leftIcon={icons.arrowRight}
          loading={submitting}
          onPress={handleSubmit}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Chưa có tài khoản?</Text>
        <Pressable onPress={() => router.replace('/register')} hitSlop={8}>
          <Text style={styles.footerLink}>Đăng ký ngay</Text>
        </Pressable>
      </View>

      <View style={styles.note}>
        <Icon icon={icons.shieldCheck} />
        <Text style={styles.noteText}>Căn bếp riêng của bạn bắt đầu từ một tài khoản.</Text>
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24 },

  logoRow: { paddingTop: 12, paddingBottom: 14 },
  hero: { height: 240, borderRadius: radius.hero },
  sessionBanner: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.input,
    backgroundColor: colors.textDark,
  },
  sessionText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.white },

  titleBlock: { gap: 8, marginTop: 24, marginBottom: 22 },
  title: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, color: colors.textDark },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textMid },

  form: { gap: 14 },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rememberText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMid },
  forgot: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: colors.primary },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 20,
  },
  footerText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMid },
  footerLink: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: colors.primary },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  noteText: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 14, color: colors.textMuted },
});
