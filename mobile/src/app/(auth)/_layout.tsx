// Khung của nhóm màn hình chưa đăng nhập
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: 'welcome',
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
