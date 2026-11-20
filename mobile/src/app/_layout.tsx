import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SessionCheckScreen } from '@/components/auth/SessionCheckScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreenController } from '@/splash';
import { colors, fonts, radius } from '@/constants/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <SplashScreenController />
      <RootNavigator />
    </AuthProvider>
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
