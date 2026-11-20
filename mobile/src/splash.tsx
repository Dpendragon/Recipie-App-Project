import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

// Giữ splash screen cho tới khi biết chắc trạng thái đăng nhập
export function SplashScreenController() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return null;
}
