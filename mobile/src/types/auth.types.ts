// Thông tin người dùng mà backend trả về
export interface User {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

// Dữ liệu gửi lên POST /auth/register.
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string; 
}

// POST /auth/register trả về user vừa tạo
export interface RegisterResponse extends User {
  createdAt: string;
}

// Dữ liệu gửi lên POST /auth/login.
export interface LoginRequest {
  email: string;
  password: string;
}

// POST /auth/login trả về token (JWT) và thông tin người dùng.
export interface LoginResponse {
  accessToken: string;
  user: User;
}
