import { useEffect, useState } from 'react';
import { getToken } from '@/services/auth/authStorage';

// Cache SQLite phân vùng theo user_id (Mục 7.12) nhưng AuthContext chưa giữ
// thông tin người dùng, nên đọc id từ claim `sub` của JWT đang lưu ({ sub: user.id }).
// Chỉ giải mã phần payload để chọn đúng vùng cache trên máy, KHÔNG xác thực chữ ký:
// mọi quyền truy cập dữ liệu vẫn do server kiểm tra bằng chính token này.
// Đọc được cả khi mất mạng vì token nằm trong SecureStore/RAM.
export function decodeUserIdFromToken(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    // base64url -> base64 có padding để atob đọc được.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as { sub?: unknown };
    const sub = typeof claims.sub === 'string' ? Number(claims.sub) : claims.sub;
    return typeof sub === 'number' && Number.isInteger(sub) && sub > 0 ? sub : null;
  } catch {
    return null;
  }
}

// undefined: đang đọc token; null: không có token hoặc token không đọc được.
export function useCurrentUserId(): number | null | undefined {
  const [userId, setUserId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((token) => {
        if (!cancelled) setUserId(token ? decodeUserIdFromToken(token) : null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return userId;
}
