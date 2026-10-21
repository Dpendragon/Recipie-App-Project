import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { deleteToken, getToken, setToken } from '@/services/auth/authStorage';
import { getProfile } from '@/services/api/authApi';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'offline';

export type AuthContextValue = {
  status: AuthStatus;
  signIn: (token: string, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');

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
        // 401 = backend từ chối token
        await deleteToken();
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
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    await deleteToken();
    setStatus('signedOut');
  }, []);

  return (
    <AuthContext.Provider value={{ status, signIn, signOut, retry: verify }}>
      {children}
    </AuthContext.Provider>
  );
}
