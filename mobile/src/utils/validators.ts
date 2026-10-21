// Regex: có phần trước @, phần sau @, và dấu chấm trong tên miền.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Vui lòng nhập email';
  if (!EMAIL_REGEX.test(value)) return 'Email không hợp lệ';
  if (value.length > 255) return 'Email tối đa 255 ký tự';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Vui lòng nhập mật khẩu';
  if (password.length < 8) return 'Mật khẩu tối thiểu 8 ký tự';
  if (password.length > 72) return 'Mật khẩu tối đa 72 ký tự';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Mật khẩu phải gồm cả chữ cái và chữ số';
  }
  return null;
}

export function validateName(name: string): string | null {
  if (name.trim().length > 100) return 'Họ tên tối đa 100 ký tự';
  return null;
}
