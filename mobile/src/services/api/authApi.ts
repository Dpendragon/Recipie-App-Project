import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  VerifyResetOtpResponse,
} from '@/types/auth.types';
import { apiClient } from './apiClient';

// POST /auth/register
export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', body);
  return data;
}

// POST /auth/login
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body);
  return data;
}

// GET /auth/profile — App Gate dùng để xác minh token còn hiệu lực mỗi khi mở app
export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/profile');
  return data;
}

// POST /auth/forgot-password — gửi mã OTP về email
export async function forgotPassword(email: string): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
  return data;
}

// POST /auth/verify-reset-otp — kiểm tra OTP, nhận resetToken
export async function verifyResetOtp(email: string, otp: string): Promise<VerifyResetOtpResponse> {
  const { data } = await apiClient.post<VerifyResetOtpResponse>('/auth/verify-reset-otp', {
    email,
    otp,
  });
  return data;
}

// POST /auth/reset-password — đặt mật khẩu mới bằng resetToken
export async function resetPassword(
  resetToken: string,
  newPassword: string,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', {
    resetToken,
    newPassword,
  });
  return data;
}