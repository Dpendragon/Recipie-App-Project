import { SplashScreen } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

// Giữ splash screen cho tới khi biết chắc trạng thái đăng nhập
export function SplashScreenController() {
  const { status } = useAuth();

  if (status !== 'loading') {
    SplashScreen.hide();
  }

  return null;
}
