import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
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
