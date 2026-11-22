import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { OtpInput } from '@/components/auth/OtpInput';
import { StepIndicator } from '@/components/auth/StepIndicator';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { KeyboardScreen } from '@/components/common/KeyboardScreen';
import { Notice } from '@/components/common/Notice';
import { icons } from '@/constants/assets';
import { OTP_LENGTH, OTP_VALID_MINUTES, RESEND_COOLDOWN_SECONDS } from '@/constants/auth';
import { colors, fonts } from '@/constants/theme';
import { forgotPassword, resetPassword, verifyResetOtp } from '@/services/api/authApi';
import { getApiErrorCode, getApiErrorMessage } from '@/utils/helpers';
import { validateConfirmPassword, validateEmail, validatePassword } from '@/utils/validators';

type Step = 1 | 2 | 3;

// Đổi số giây thành dạng "00:45".
function formatSeconds(seconds: number): string {
  return `00:${String(seconds).padStart(2, '0')}`;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Step 2
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null); 
  const [otpExpired, setOtpExpired] = useState(false); 
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sendError, setSendError] = useState<string | null>(null); 
  const [resetToken, setResetToken] = useState('');

  // Step 3
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);


  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function goToLogin() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  }

  function handleBack() {
    if (step === 1) {
      goToLogin();
    } else {
      setOtp('');
      setOtpError(null);
      setOtpExpired(false);
      setSendError(null);
      setStep(1);
    }
  }

  async function sendCode() {
    setLoading(true);
    setEmailError(null);
    setSendError(null);
    try {
      await forgotPassword(email.trim());
      setOtp('');
      setOtpError(null);
      setOtpExpired(false);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (error) {
      if (step === 1) setEmailError(getApiErrorMessage(error));
      else setSendError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  // Step 1 -> bấm "Gửi mã xác thực"
  function handleSendEmail() {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    sendCode();
  }

  // Step 2 -> bấm "Xác thực OTP" (hoặc "Gửi lại mã" khi mã đã hết hạn)
  async function handleVerifyOtp() {
    if (otpExpired) {
      sendCode();
      return;
    }
    if (otp.length < OTP_LENGTH) {
      setOtpError(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số`);
      return;
    }

    setLoading(true);
    setOtpError(null);
    try {
      const result = await verifyResetOtp(email.trim(), otp);
      setResetToken(result.resetToken);
      setStep(3);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'OTP_WRONG') {
        setOtpError('Mã không đúng');
      } else if (code === 'OTP_EXPIRED') {
        setOtpExpired(true);
        setOtpError('Mã OTP đã hết hạn');
      } else if (code === 'OTP_LOCKED') {
        setOtpExpired(true);
        setOtpError(getApiErrorMessage(error));
      } else {
        setOtpError(getApiErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }

  // Step 3 -> bấm "Lưu mật khẩu mới"
  async function handleResetPassword() {
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirm);
    setPasswordError(passwordErr);
    setConfirmError(confirmErr);
    setFormError(null);
    if (passwordErr || confirmErr) return;

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      router.replace({ pathname: '/login', params: { notice: 'reset', email: email.trim() } });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setLoading(false);
    }
  }

  const canResend = secondsLeft <= 0 && !loading;

  return (
    <KeyboardScreen contentContainerStyle={styles.scroll}>
      <AuthScreenHeader
        title="Lấy lại mật khẩu"
        subtitle="Xác thực email để trở lại căn bếp của bạn."
        onBack={handleBack}
      />

      <View style={styles.steps}>
        <StepIndicator current={step} />
      </View>

      {/* BƯỚC 1: nhập email */}
      {step === 1 ? (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>1. Email khôi phục</Text>
          <Input
            label="Email đã đăng ký"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            placeholder="Nhập email đã đăng ký..."
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <Button title="Gửi mã xác thực" loading={loading} onPress={handleSendEmail} />
        </View>
      ) : null}

      {/* BƯỚC 2: nhập mã OTP */}
      {step === 2 ? (
        <View style={styles.form}>
          {otpExpired ? (
            <Notice
              title="Mã xác thực đã hết hạn"
              message={`Chọn “Gửi lại mã” để nhận mã mới tại ${email.trim()}.`}
              icon={icons.mailCheckRed}
            />
          ) : sendError ? null : (
            <Notice
              variant="success"
              title="Đã gửi mã xác thực"
              message={`Mã đã được gửi đến ${email.trim()}. Kiểm tra hộp thư và thư rác. Mã có hiệu lực trong ${OTP_VALID_MINUTES} phút.`}
              icon={icons.mailCheck}
            />
          )}

          <Notice message={sendError} />

          <Text style={styles.stepTitle}>2. Mã xác thực</Text>
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (!otpExpired) setOtpError(null);
            }}
            hasError={otpError !== null && !otpExpired}
          />

          <View style={styles.otpFooter}>
            <Text style={[styles.otpHint, otpError ? styles.otpHintError : null]}>
              {otpError ?? `Nhập mã gồm ${OTP_LENGTH} chữ số`}
            </Text>
            {secondsLeft > 0 ? (
              <Text style={styles.otpHint}>{`Gửi lại sau ${formatSeconds(secondsLeft)}`}</Text>
            ) : (
              <Pressable onPress={sendCode} disabled={!canResend} hitSlop={8}>
                <Text style={styles.resendLink}>Gửi lại mã</Text>
              </Pressable>
            )}
          </View>

          <Button
            title={otpExpired ? 'Gửi lại mã' : 'Xác thực OTP'}
            loading={loading}
            onPress={handleVerifyOtp}
          />
        </View>
      ) : null}

      {/* BƯỚC 3: mật khẩu mới */}
      {step === 3 ? (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>3. Đặt mật khẩu mới</Text>
          <Input
            label="Mật khẩu mới"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            hint="Ít nhất 8 ký tự, gồm chữ và số."
            placeholder="Nhập mật khẩu mới"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
          />
          <Input
            label="Xác nhận mật khẩu mới"
            isPassword
            value={confirm}
            onChangeText={setConfirm}
            error={confirmError}
            placeholder="Nhập lại mật khẩu mới"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
          />

          <Notice
            variant="success"
            message="Mật khẩu mới không được trùng mật khẩu cũ."
            icon={icons.lock}
          />
          <Notice message={formError} />

          <Button title="Lưu mật khẩu mới" loading={loading} onPress={handleResetPassword} />
        </View>
      ) : null}

      <Pressable style={styles.backToLogin} onPress={goToLogin} hitSlop={8}>
        <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
      </Pressable>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24 },

  steps: { marginTop: 18, marginBottom: 22 },
  form: { gap: 14 },
  stepTitle: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 24, color: colors.textDark },

  otpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  otpHint: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textMuted },
  otpHintError: { color: colors.error },
  resendLink: { fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 15, color: colors.primary },

  backToLogin: { alignItems: 'center', paddingVertical: 20 },
  backToLoginText: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: colors.primary },
});
