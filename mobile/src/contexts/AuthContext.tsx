import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { deleteToken, getToken, setToken } from '@/services/auth/authStorage';
import { getProfile } from '@/services/api/authApi';
import { clearCacheForUser } from '@/services/cache/cacheManager';
import { decodeUserIdFromToken } from '@/hooks/useCurrentUserId';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'offline';

export type AuthContextValue = {
  status: AuthStatus;
  sessionExpired: boolean;
  signIn: (token: string, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

// Xoá cache offline của tài khoản đang đăng xuất: đọc
// userId từ token CÒN trong storage, nên phải gọi trước deleteToken. Dùng cho cả
// đăng xuất chủ động và đăng xuất cưỡng bức khi token hết hạn. Xoá cache thất bại
// không được chặn đăng xuất — token vẫn phải bị xoá.
async function clearCacheOfCurrentUser() {
  try {
    const token = await getToken();
    const userId = token ? decodeUserIdFromToken(token) : null;
    if (userId !== null) {
      await clearCacheForUser(userId);
    }
  } catch (error) {
    console.warn('[AuthContext] Xoá cache khi đăng xuất thất bại', error);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);

  // Kiểm tra phiên đăng nhập
  const verify = useCallback(async () => {
    setStatus('loading');
    const token = await getToken();

    if (!token) {
      setStatus('signedOut');
      return;
    }

    try {
      await getProfile();
      setStatus('signedIn');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await clearCacheOfCurrentUser();
        await deleteToken();
        setSessionExpired(true);
        setStatus('signedOut');
      } else {
        setStatus('offline');
      }
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  const signIn = useCallback(async (token: string, remember = true) => {
    await setToken(token, remember);
    setSessionExpired(false);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    await clearCacheOfCurrentUser();
    await deleteToken();
    setSessionExpired(false);
    setStatus('signedOut');
  }, []);

  return (
    <AuthContext.Provider value={{ status, sessionExpired, signIn, signOut, retry: verify }}>
      {children}
    </AuthContext.Provider>
  );
}
