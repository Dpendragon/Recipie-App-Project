import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SessionCheckScreen } from '@/components/auth/SessionCheckScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreenController } from '@/splash';
import { colors, fonts, radius } from '@/constants/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Quicksand_700Bold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // GestureHandlerRootView cần bọc ngoài cùng để thao tác vuốt (vd vuốt xoá
  // dòng mua sắm) hoạt động.
  return (
    <GestureHandlerRootView style={styles.root}>
      <NetworkProvider>
        <AuthProvider>
          <SplashScreenController />
          <RootNavigator />
        </AuthProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { status, retry } = useAuth();

  if (status === 'loading') {
    return <SessionCheckScreen />;
  }

  if (status === 'offline') {
    return <OfflineNotice onRetry={retry} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function OfflineNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mất kết nối</Text>
      <Text style={styles.message}>
        Không thể xác minh phiên đăng nhập. Kiểm tra kết nối mạng rồi thử lại.
      </Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.textDark },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMid,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  buttonText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.white },
});
